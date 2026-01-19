"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskHistory = exports.deleteTask = exports.addComment = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const getTasks = async (req, res) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }
    // Manager sees all tasks in division
    // Employee sees their own tasks AND tasks in division? 
    // Spec: "employee hanya bisa melihat goals2 dan task yang melekat pada dia dan di divisinya saja"
    // Does this mean "Tasks assigned to me" AND "All tasks in my division"? 
    // Usually goals are shared, tasks are specific. 
    // Let's interpret "melekat pada dia dan di divisinya saja" as:
    // - Goals in his division (already covered)
    // - Tasks assigned to him.
    // - BUT "manager bisa melihat task2 employee yang berada dalam 1 divisi".
    // Let's implement parameter filtering.
    const { userId, date } = req.query; // Filter by user if provided (Manager view specific employee)
    try {
        const whereClause = {
            goal: {
                divisionId: req.user.divisionId
            }
        };
        if (req.user.role === 'EMPLOYEE') {
            // Employee only sees their own tasks OR tasks they created?
            // "employee bisa membuat task, dan memilih untuk dimasukan ke goals mana saja"
            // So they create tasks. They are also likely the assignee.
            whereClause.assigneeId = req.user.id;
        }
        else if (userId) {
            // Manager filtering by specific employee
            whereClause.assigneeId = Number(userId);
        }
        if (date) {
            const queryDate = new Date(date);
            // Create start and end of day
            const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
            whereClause.dueDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
        const tasks = await prismaClient_1.default.task.findMany({
            where: whereClause,
            include: {
                goal: { select: { title: true } },
                assignee: { select: { id: true, name: true, email: true } }, // Include id and email for avatar
                comments: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    const { title, description, status, priority, dueDate, goalId, assigneeId } = req.body;
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Verify goal belongs to division
        const goal = await prismaClient_1.default.goal.findUnique({ where: { id: Number(goalId) } });
        if (!goal || goal.divisionId !== req.user.divisionId) {
            return res.status(400).json({ message: 'Invalid goal' });
        }
        const task = await prismaClient_1.default.task.create({
            data: {
                title,
                description,
                status: status || 'TODO',
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                goalId: Number(goalId),
                assigneeId: assigneeId ? Number(assigneeId) : req.user.id // Assign to specific user or self
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating task' });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    const { id } = req.params;
    const { status, priority, assigneeId } = req.body;
    // Spec: "bisa update status task dari todo ke inprogress dan seterusnya"
    try {
        const task = await prismaClient_1.default.task.findUnique({ where: { id: Number(id) } });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        // Check permission. Manager or Assignee.
        // Manager can update anything (including status). Employee can update status.
        if (req.user?.role !== 'MANAGER' && task.assigneeId !== req.user?.id) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        // History Logging
        const historyEntries = [];
        if (status && status !== task.status) {
            historyEntries.push({
                taskId: task.id,
                userId: req.user.id,
                action: 'UPDATED_STATUS',
                oldValue: task.status,
                newValue: status
            });
        }
        if (priority && priority !== task.priority) {
            historyEntries.push({
                taskId: task.id,
                userId: req.user.id,
                action: 'UPDATED_PRIORITY',
                oldValue: task.priority,
                newValue: priority
            });
        }
        if (req.body.dueDate !== undefined) {
            const newDate = req.body.dueDate ? new Date(req.body.dueDate).toISOString() : null;
            const oldDate = task.dueDate ? task.dueDate.toISOString() : null;
            // distinct check
            if (newDate !== oldDate) {
                historyEntries.push({
                    taskId: task.id,
                    userId: req.user.id,
                    action: 'UPDATED_DUE_DATE',
                    oldValue: oldDate,
                    newValue: newDate
                });
            }
        }
        if (assigneeId !== undefined) {
            const newAssigneeId = assigneeId ? Number(assigneeId) : null;
            if (newAssigneeId !== task.assigneeId) {
                historyEntries.push({
                    taskId: task.id,
                    userId: req.user.id,
                    action: 'UPDATED_ASSIGNEE',
                    oldValue: task.assigneeId ? task.assigneeId.toString() : null,
                    newValue: newAssigneeId ? newAssigneeId.toString() : null
                });
            }
        }
        if (historyEntries.length > 0) {
            await prismaClient_1.default.taskHistory.createMany({ data: historyEntries });
        }
        const data = {
            status,
            priority,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
        };
        if (assigneeId !== undefined) {
            // Frontend sends 0 or null for unassigned? 
            // If string "0", treat as null.
            data.assigneeId = (assigneeId && Number(assigneeId) > 0) ? Number(assigneeId) : null;
        }
        const updatedTask = await prismaClient_1.default.task.update({
            where: { id: Number(id) },
            data,
            include: {
                assignee: { select: { name: true, email: true } }
            }
        });
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating task' });
    }
};
exports.updateTask = updateTask;
// Add Comment to Task
const addComment = async (req, res) => {
    try {
        const { id } = req.params; // task id
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: "Invalid task ID" });
        }
        const { content } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const comment = await prismaClient_1.default.comment.create({
            data: {
                content,
                taskId: parseInt(id),
                userId,
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(500).json({ message: "Error adding comment", error });
    }
};
exports.addComment = addComment;
// Delete Task
const deleteTask = async (req, res) => {
    const { id } = req.params;
    // Only Manager can delete
    if (req.user?.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Not authorized to delete tasks' });
    }
    if (!id || typeof id !== 'string')
        return res.status(400).json({ message: 'Invalid task ID' });
    try {
        await prismaClient_1.default.task.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting task' });
    }
};
exports.deleteTask = deleteTask;
const getTaskHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const history = await prismaClient_1.default.taskHistory.findMany({
            where: { taskId: Number(id) },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching history' });
    }
};
exports.getTaskHistory = getTaskHistory;
//# sourceMappingURL=taskController.js.map