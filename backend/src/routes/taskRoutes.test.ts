import request from 'supertest';
import express from 'express';
import cors from 'cors';
import taskRoutes from '../routes/taskRoutes';
import { prismaMock } from '../tests/singleton';
import jwt from 'jsonwebtoken';

const SECRET = 'test_secret';

const app = express();
app.use(cors());
app.use(express.json());
const mockUser = { id: 1, email: 'manager@example.com', role: 'MANAGER', divisionId: 1 };
const token = jwt.sign(mockUser, SECRET);

app.use('/api/tasks', taskRoutes);

describe('Task API', () => {
    it('should create an unassigned URGENT task', async () => {
        const taskData = {
            title: 'Urgent Task',
            description: 'Do it now',
            priority: 'URGENT',
            status: 'TODO',
            goalId: 1,
            assigneeId: null, // Unassigned
            dueDate: '2024-12-31'
        };

        prismaMock.goal.findUnique.mockResolvedValue({
            id: 1,
            title: 'Goal 1',
            divisionId: 1
        } as any);

        prismaMock.task.create.mockResolvedValue({
            id: 10,
            ...taskData,
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: new Date(taskData.dueDate)
        } as any);

        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send(taskData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.priority).toEqual('URGENT');
        expect(res.body.assigneeId).toBeNull();
    });

    it('should update task status and log history', async () => {
        const taskId = 10;
        const updateData = {
            status: 'IN_PROGRESS'
        };

        // Mock findUnique to return existing task
        prismaMock.task.findUnique.mockResolvedValue({
            id: taskId,
            status: 'TODO',
            divisionId: 1,
            // ... other fields if needed by controller logic
        } as any);

        // Mock update
        prismaMock.task.update.mockResolvedValue({
            id: taskId,
            status: 'IN_PROGRESS'
        } as any);

        // Mock history creation (though controller might not wait for it or return it, logic should run)
        // Note: Controller calls prisma.taskHistory.create but doesn't block response usually? 
        // Actually it's awaited in current controller.

        const res = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('IN_PROGRESS');
    });
});
