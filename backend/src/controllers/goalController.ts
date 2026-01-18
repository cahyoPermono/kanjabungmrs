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
    // If Admin, see all? Or just managers see their division? 
    // Spec says: "manager bisa melihat task2 dan goals2 employee yang berada dalam 1 divisi dengan dia"
    // "employee hanya bisa melihat goals2 dan task yang melekat pada dia dan di divisinya saja"
    // So both Manager and Employee can see goals in their division.

    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    try {
        const goals = await prisma.goal.findMany({
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
    } catch (error) {
        res.status(500).json({ message: 'Error fetching goals' });
    }
}

export const createGoal = async (req: AuthRequest, res: Response) => {
    // Only Manager (and maybe Admin)
    const { title, description, startDate, endDate } = req.body;
    
    if (!req.user || !req.user.divisionId) {
        return res.status(400).json({ message: 'User not belonging to a division' });
    }

    try {
        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                divisionId: req.user.divisionId,
                creatorId: req.user.id
            }
        });
        res.status(201).json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating goal' });
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
