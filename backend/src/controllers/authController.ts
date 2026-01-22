import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import prisma from '../prismaClient';
// Removed local initialization

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { division: true } // Include division to check status
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (!(user as any).isActive) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact administrator.' });
    }

    if (user.division && !(user.division as any).isActive) {
        return res.status(403).json({ message: 'Your division has been deactivated. Please contact administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, divisionId: user.divisionId },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            divisionId: user.divisionId
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const register = async (req: Request, res: Response) => {
    // Basic registration for Admin to create users, or self-register if needed (usually restricted)
    // For now implementing a basic open register for testing, but typically this should be Admin only.
    const { email, password, name, role, divisionId } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'EMPLOYEE',
                divisionId: divisionId ? parseInt(divisionId) : null
            }
        });

        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export const updatePassword = async (req: Request, res: Response) => {
    // req.user is set by authenticateToken middleware
    const userId = (req as any).user?.id;
    const { newPassword } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating password.' });
    }
};
