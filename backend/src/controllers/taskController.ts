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
        const whereClause: any = {
            goal: {
                divisionId: req.user.divisionId
            }
        };

        if (req.user.role === 'EMPLOYEE') {
            // Employee only sees their own tasks OR tasks they created?
            // "employee bisa membuat task, dan memilih untuk dimasukan ke goals mana saja"
            // So they create tasks. They are also likely the assignee.
            whereClause.assigneeId = req.user.id;
        } else if (userId) {
             // Manager filtering by specific employee
             whereClause.assigneeId = Number(userId);
        }

        if (date) {
            const queryDate = new Date(date as string);
            // Create start and end of day
            const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
            
            whereClause.dueDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const tasks = await prisma.task.findMany({
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
    } catch (error) {
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
                assigneeId: assigneeId ? Number(assigneeId) : req.user.id // Assign to specific user or self
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
        // Also allow if Manager is reassigning (assigneeId provided)
        // Check permission. Manager or Assignee.
        // Also allow if Manager is reassigning (assigneeId provided)
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
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
        };

        if (assigneeId !== undefined) {
            data.assigneeId = assigneeId ? Number(assigneeId) : null;
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
