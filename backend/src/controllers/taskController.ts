import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import prisma from '../prismaClient';
// Removed local initialization

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        divisionId: number;
    }
}

export const getTasks = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    const { 
        userId, // Deprecated in favor of assigneeId but kept for backward compat if any
        assigneeId,
        priority,
        status,
        dueDateStart, dueDateEnd,
        createdAtStart, createdAtEnd,
        closedAtStart, closedAtEnd,
        page = 1,
        limit = 10
    } = req.query; 

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause: any = {
            goal: {
                divisionId: req.user.divisionId
            }
        };

        // --- Role & Assignee Logic ---
        if (req.user.role === 'EMPLOYEE') {
            // Employees see their own tasks
            whereClause.assigneeId = req.user.id;
        } else {
            // Managers can see all, or filter by specific assignee
            if (assigneeId) {
                whereClause.assigneeId = Number(assigneeId);
            } else if (userId) { // Backward compatibility
                whereClause.assigneeId = Number(userId);
            }
        }

        // --- Priority & Status ---
        if (priority && priority !== 'ALL') {
             whereClause.priority = priority as any;
        }

        if (status && status !== 'ALL') {
             whereClause.status = status as any;
        }

        // --- Date Range Helper ---
        const buildDateFilter = (start: any, end: any) => {
            if (!start && !end) return undefined;
            const filter: any = {};
            if (start) filter.gte = new Date(start as string);
            if (end) {
                // Set to end of day if it's just a date string, or strictly use provided ISO
                const endDate = new Date(end as string);
                if ((end as string).length <= 10) { // YYYY-MM-DD
                    endDate.setHours(23, 59, 59, 999);
                }
                filter.lte = endDate;
            }
            return filter;
        };

        // --- Date Filters ---
        const dueDateFilter = buildDateFilter(dueDateStart, dueDateEnd);
        if (dueDateFilter) whereClause.dueDate = dueDateFilter;

        const createdAtFilter = buildDateFilter(createdAtStart, createdAtEnd);
        if (createdAtFilter) whereClause.createdAt = createdAtFilter;

        // "Date Closed" - using updatedAt for COMPLETED tasks as proxy
        if (closedAtStart || closedAtEnd) {
             const closedFilter = buildDateFilter(closedAtStart, closedAtEnd);
             // We only care about closed dates for tasks that are actually closed (COMPLETED)
             // But if user filters by date closed, they implicitly want completed tasks? 
             // Or we just filter tasks that were *updated* in that range AND are completed.
             if (closedFilter) {
                 whereClause.updatedAt = closedFilter;
                 whereClause.status = 'COMPLETED'; 
             }
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where: whereClause,
                include: {
                    goal: { select: { title: true, code: true } },
                    assignee: { select: { id: true, name: true, email: true } },
                    comments: {
                        include: { user: { select: { id: true, name: true } } },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.task.count({ where: whereClause })
        ]);

        res.json({
            data: tasks,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
}

export const createTask = async (req: AuthRequest, res: Response) => {
    const { title, description, status, priority, dueDate, goalId, assigneeId } = req.body;
    
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Verify goal belongs to division
        const goal = await prisma.goal.findUnique({ where: { id: Number(goalId) } });
        if (!goal || goal.divisionId !== req.user.divisionId) {
             return res.status(400).json({ message: 'Invalid goal' });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: status || 'TODO',
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                goalId: Number(goalId),
                assigneeId: assigneeId ? Number(assigneeId) : null // Default to null (unassigned) if not specified
            }
        });
        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating task' });
    }
}

export const updateTask = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, priority, assigneeId } = req.body;

    // Spec: "bisa update status task dari todo ke inprogress dan seterusnya"
    try {
        const task = await prisma.task.findUnique({ where: { id: Number(id) } });

        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Check permission. Manager or Assignee.
        // Manager can update anything (including status). Employee can update status.
        if (req.user?.role !== 'MANAGER' && task.assigneeId !== req.user?.id) {
             return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

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
             await prisma.taskHistory.createMany({ data: historyEntries });
         }

        const data: any = {
            status,
            priority,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            title: req.body.title,
            description: req.body.description,
            goalId: req.body.goalId ? Number(req.body.goalId) : undefined
        };

        if (assigneeId !== undefined) {
            // Frontend sends 0 or null for unassigned? 
            // If string "0", treat as null.
            data.assigneeId = (assigneeId && Number(assigneeId) > 0) ? Number(assigneeId) : null;
        }

        const updatedTask = await prisma.task.update({
            where: { id: Number(id) },
            data,
            include: {
                assignee: { select: { name: true, email: true } }
            }
        });
        res.json(updatedTask);   
    } catch (error) {
        res.status(500).json({ message: 'Error updating task' });
    }
}

// Add Comment to Task
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // task id
    
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: "Invalid task ID" });
    }

    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const comment = await prisma.comment.create({
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
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
};
// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    // Only Manager can delete
    if (req.user?.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Not authorized to delete tasks' });
    }

    if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid task ID' });

    try {
        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task' });
    }
}

export const getTaskHistory = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const history = await prisma.taskHistory.findMany({
            where: { taskId: Number(id) },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching history' });
    }
}
