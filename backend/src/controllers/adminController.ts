import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import prisma from '../prismaClient';
// Removed local initialization

// Division Management
export const getDivisions = async (req: Request, res: Response) => {
  try {
    const divisions = await prisma.division.findMany({
        include: { _count: { select: { users: true } } }
    });
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching divisions' });
  }
};

export const createDivision = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const division = await prisma.division.create({ data: { name } });
    res.status(201).json(division);
  } catch (error) {
    res.status(500).json({ message: 'Error creating division' });
  }
};

export const updateDivision = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const division = await prisma.division.update({ where: { id: Number(id) }, data: { name } });
    res.json(division);
  } catch (error) {
      res.status(500).json({ message: 'Error updating division' });
  }
}

export const deleteDivision = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.division.delete({ where: { id: Number(id) } });
        res.json({ message: 'Division deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting division' });
    }
}

// User Management
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, divisionId: true, division: { select: { name: true } } }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, divisionId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                divisionId: Number(divisionId) // Ensure it is a number
            }
        });
        res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user' });
    }
}

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name, role, divisionId } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                email,
                name,
                role,
                divisionId: divisionId ? Number(divisionId) : null
            }
        });
        res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
         res.status(500).json({ message: 'Error updating user' });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: 'User deleted' });
    } catch (error) {
         res.status(500).json({ message: 'Error deleting user' });
    }
}
