import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/authRoutes';
import { prismaMock } from '../tests/singleton';
import * as bcrypt from 'bcryptjs';

// We mock the centralized prisma client using singleton.ts

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
    it('should register a new user', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'EMPLOYEE',
            divisionId: 1
        };

        prismaMock.user.create.mockResolvedValue({
            id: 1,
            ...user,
            password: 'hashedpassword',
            divisionId: 1
        });

        // Mock findUnique to return null (user doesn't exist)
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/register')
            .send(user);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.email).toEqual(user.email);
    });

    it('should login an existing user', async () => {
        const user = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 10),
            role: 'EMPLOYEE',
            divisionId: 1
        };

        // We need to properly satisfy the User type, simplified here
        prismaMock.user.findUnique.mockResolvedValue(user as any);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
