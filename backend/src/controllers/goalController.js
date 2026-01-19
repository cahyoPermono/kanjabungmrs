"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamOverview = exports.deleteGoal = exports.getDivisionEmployees = exports.updateGoal = exports.createGoal = exports.getGoals = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getGoals = async (req, res) => {
    // If Admin, see all? Or just managers see their division? 
    // Spec says: "manager bisa melihat task2 dan goals2 employee yang berada dalam 1 divisi dengan dia"
    // "employee hanya bisa melihat goals2 dan task yang melekat pada dia dan di divisinya saja"
    // So both Manager and Employee can see goals in their division.
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }
    try {
        const goals = await prismaClient_1.default.goal.findMany({
            where: {
                divisionId: req.user.divisionId
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                tasks: {
                    include: {
                        assignee: { select: { id: true, name: true, email: true } },
                        comments: {
                            include: { user: { select: { id: true, name: true } } },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            },
        });
        res.json(goals);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching goals' });
    }
};
exports.getGoals = getGoals;
const createGoal = async (req, res) => {
    // Only Manager (and maybe Admin)
    const { title, description, code, startDate, endDate } = req.body;
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }
    try {
        const goal = await prismaClient_1.default.goal.create({
            data: {
                title,
                description,
                code,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                divisionId: req.user.divisionId,
                creatorId: req.user.id
            }
        });
        res.status(201).json(goal);
    }
    catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(400).json({ message: 'Goal code must be unique' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error creating goal' });
    }
};
exports.createGoal = createGoal;
const updateGoal = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body; // Can only edit title and description
    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Only managers can update goals' });
    }
    try {
        const goal = await prismaClient_1.default.goal.update({
            where: { id: parseInt(id) },
            data: { title, description }
        });
        res.json(goal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating goal' });
    }
};
exports.updateGoal = updateGoal;
// Get employees in the same division (for Manager to see list or assign tasks if manager assigns)
// Actually spec says "tiap employee bisa membuat task... bisa memilih goals". 
// But Manager can "melihat task2 dan goals2 employee".
// We might need a "getDivisionEmployees" for manager.
const getDivisionEmployees = async (req, res) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }
    try {
        const employees = await prismaClient_1.default.user.findMany({
            where: {
                divisionId: req.user.divisionId,
                role: 'EMPLOYEE'
            },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(employees);
    }
    catch (error) {
    }
};
exports.getDivisionEmployees = getDivisionEmployees;
// Delete Goal
const deleteGoal = async (req, res) => {
    const { id } = req.params;
    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Only managers can delete goals' });
    }
    if (!id || typeof id !== 'string')
        return res.status(400).json({ message: 'Invalid goal ID' });
    try {
        await prismaClient_1.default.task.deleteMany({ where: { goalId: parseInt(id) } });
        await prismaClient_1.default.goal.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting goal' });
    }
};
exports.deleteGoal = deleteGoal;
const getTeamOverview = async (req, res) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }
    try {
        const employees = await prismaClient_1.default.user.findMany({
            where: {
                divisionId: req.user.divisionId,
                role: 'EMPLOYEE'
            },
            select: {
                id: true,
                name: true,
                email: true,
                assignedTasks: {
                    include: {
                        goal: { select: { title: true } },
                        assignee: { select: { id: true, name: true, email: true } },
                        comments: {
                            include: { user: { select: { id: true, name: true } } },
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json(employees);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching team overview' });
    }
};
exports.getTeamOverview = getTeamOverview;
//# sourceMappingURL=goalController.js.map