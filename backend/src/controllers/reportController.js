"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getDashboardStats = async (req, res) => {
    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const divisionId = req.user.divisionId;
    try {
        // 1. Goal Stats
        const totalGoals = await prismaClient_1.default.goal.count({ where: { divisionId } });
        // Assuming we calculate goal completion based on tasks, or if goals have a status field (they don't currently, only tasks).
        // Let's count goals that have all tasks completed? Or just skip "Goal Completion" for now and focus on Tasks.
        // 2. Task Stats
        const taskStats = await prismaClient_1.default.task.groupBy({
            by: ['status'],
            where: {
                goal: {
                    divisionId: divisionId
                }
            },
            _count: {
                _all: true
            }
        });
        const totalTasks = taskStats.reduce((acc, curr) => acc + curr._count._all, 0);
        const completedTasks = taskStats.find(s => s.status === 'COMPLETED')?._count._all || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        // 3. Employee Performance (Tasks Completed)
        const employeeStats = await prismaClient_1.default.task.groupBy({
            by: ['assigneeId'],
            where: {
                goal: { divisionId },
                status: 'COMPLETED'
            },
            _count: { _all: true }
        });
        // Need to join with User names. groupBy doesn't support include.
        // So we fetch users and map.
        const employees = await prismaClient_1.default.user.findMany({
            where: { divisionId, role: 'EMPLOYEE' },
            select: { id: true, name: true }
        });
        const performanceData = employees.map(emp => {
            const stat = employeeStats.find(s => s.assigneeId === emp.id);
            return {
                name: emp.name,
                completedTasks: stat ? stat._count._all : 0
            };
        }).sort((a, b) => b.completedTasks - a.completedTasks);
        // 4. Overdue Tasks
        const overdueTasks = await prismaClient_1.default.task.findMany({
            where: {
                goal: { divisionId },
                status: { not: 'COMPLETED' },
                dueDate: { lt: new Date() }
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                assignee: { select: { name: true } },
                priority: true
            },
            take: 5
        });
        res.json({
            overview: {
                totalGoals,
                totalTasks,
                completionRate
            },
            taskDistribution: taskStats.map(s => ({ name: s.status, value: s._count._all })),
            employeePerformance: performanceData,
            overdueTasks
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching report stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=reportController.js.map