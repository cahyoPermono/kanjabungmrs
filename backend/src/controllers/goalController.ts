import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import prisma from '../prismaClient';
// Removed local initialization

// Extend Request to include user info (interface defined in middleware/auth but duplicated here for simplicity or we can export it)
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        divisionId: number;
    }
}

export const getGoals = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    const { 
        assigneeId,
        priority,
        status,
        dueDateStart, dueDateEnd,
        createdAtStart, createdAtEnd,
        closedAtStart, closedAtEnd
    } = req.query;

    try {
        const taskWhereClause: any = {};

        // --- Assignee Logic ---
        if (assigneeId) {
            taskWhereClause.assigneeId = Number(assigneeId);
        }

        // --- Priority & Status ---
        if (priority && priority !== 'ALL') {
             taskWhereClause.priority = priority as any;
        }

        if (status && status !== 'ALL') {
             taskWhereClause.status = status as any;
        }

        // --- Date Range Helper ---
        const buildDateFilter = (start: any, end: any) => {
            if (!start && !end) return undefined;
            const filter: any = {};
            if (start) filter.gte = new Date(start as string);
            if (end) {
                const endDate = new Date(end as string);
                if ((end as string).length <= 10) { 
                    endDate.setHours(23, 59, 59, 999);
                }
                filter.lte = endDate;
            }
            return filter;
        };

        const dueDateFilter = buildDateFilter(dueDateStart, dueDateEnd);
        if (dueDateFilter) taskWhereClause.dueDate = dueDateFilter;

        const createdAtFilter = buildDateFilter(createdAtStart, createdAtEnd);
        if (createdAtFilter) taskWhereClause.createdAt = createdAtFilter;

        if (closedAtStart || closedAtEnd) {
             const closedFilter = buildDateFilter(closedAtStart, closedAtEnd);
             if (closedFilter) {
                 taskWhereClause.updatedAt = closedFilter;
                 taskWhereClause.status = 'COMPLETED'; 
             }
        }

        const goalWhereClause: any = {
             divisionId: req.user.divisionId
        };

        // If we are filtering tasks, only show goals that have matching tasks
        // Check if taskWhereClause has any keys
        if (Object.keys(taskWhereClause).length > 0) {
            goalWhereClause.tasks = {
                some: taskWhereClause
            };
        }

        const goals = await prisma.goal.findMany({
            where: goalWhereClause,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                tasks: {
                    where: taskWhereClause,
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching goals' });
    }
}

export const createGoal = async (req: AuthRequest, res: Response) => {
    // Only Manager (and maybe Admin)
    const { title, description, code, startDate, endDate } = req.body;
    
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    try {
        const goal = await prisma.goal.create({
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
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(400).json({ message: 'Goal code must be unique' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error creating goal' });
    }
}

export const updateGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, description } = req.body; // Can only edit title and description

    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Only managers can update goals' });
    }

    if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid goal ID' });

    try {
        const goal = await prisma.goal.update({
            where: { id: parseInt(id) },
            data: { title, description }
        });
        res.json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating goal' });
    }
}

// Get employees in the same division (for Manager to see list or assign tasks if manager assigns)
// Actually spec says "tiap employee bisa membuat task... bisa memilih goals". 
// But Manager can "melihat task2 dan goals2 employee".
// We might need a "getDivisionEmployees" for manager.

export const getDivisionEmployees = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    try {
        const employees = await prisma.user.findMany({
            where: {
                divisionId: req.user.divisionId,
                role: 'EMPLOYEE'
            },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(employees);
    } catch (error) {
    }
}

// Delete Goal
export const deleteGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Only managers can delete goals' });
    }

    if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid goal ID' });

    try {
        await prisma.task.deleteMany({ where: { goalId: parseInt(id) } }); 
        await prisma.goal.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting goal' });
    }
}

export const getTeamOverview = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    try {
        const employees = await prisma.user.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching team overview' });
    }
}
