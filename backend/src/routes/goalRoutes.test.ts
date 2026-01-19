import request from 'supertest';
import express from 'express';
import cors from 'cors';
import goalRoutes from '../routes/goalRoutes';
import { prismaMock } from '../tests/singleton';
import jwt from 'jsonwebtoken';

// Mock auth middleware to bypass real token verification or use a spy?
// Easier to generate a valid token signed with SECRET or mock the middleware.
// For integration testing routes, using real middleware but mocking DB is good.
// But we need a valid token.

const SECRET = 'test_secret';

const app = express();
app.use(cors());
app.use(express.json());
// Mock user for the request
const mockUser = { id: 1, email: 'manager@example.com', role: 'MANAGER', divisionId: 1 };
const token = jwt.sign(mockUser, SECRET);

app.use('/api/goals', goalRoutes);

describe('Goal API', () => {
    it('should get goals for division', async () => {
        const goals = [
            { id: 1, title: 'Goal 1', divisionId: 1, creatorId: 1 },
            { id: 2, title: 'Goal 2', divisionId: 1, creatorId: 1 }
        ];

        prismaMock.goal.findMany.mockResolvedValue(goals as any);

        const res = await request(app)
            .get('/api/goals')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(2);
    });

    it('should create a goal', async () => {
        const goalData = {
            code: 'G001',
            title: 'New Goal',
            description: 'Desc',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        };

        prismaMock.goal.create.mockResolvedValue({
            id: 3,
            ...goalData,
            startDate: new Date(goalData.startDate),
            endDate: new Date(goalData.endDate),
            divisionId: 1,
            creatorId: 1
        } as any);

        // We also need to mock getting the user inside the controller logic if it queries DB? 
        // No, controller uses req.user from token.

        const res = await request(app)
            .post('/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send(goalData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('New Goal');
    });
});
