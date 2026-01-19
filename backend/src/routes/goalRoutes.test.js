"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const goalRoutes_1 = __importDefault(require("../routes/goalRoutes"));
const singleton_1 = require("../tests/singleton");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock auth middleware to bypass real token verification or use a spy?
// Easier to generate a valid token signed with SECRET or mock the middleware.
// For integration testing routes, using real middleware but mocking DB is good.
// But we need a valid token.
const SECRET = 'test_secret';
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mock user for the request
const mockUser = { id: 1, email: 'manager@example.com', role: 'MANAGER', divisionId: 1 };
const token = jsonwebtoken_1.default.sign(mockUser, SECRET);
app.use('/api/goals', goalRoutes_1.default);
describe('Goal API', () => {
    it('should get goals for division', async () => {
        const goals = [
            { id: 1, title: 'Goal 1', divisionId: 1, creatorId: 1 },
            { id: 2, title: 'Goal 2', divisionId: 1, creatorId: 1 }
        ];
        singleton_1.prismaMock.goal.findMany.mockResolvedValue(goals);
        const res = await (0, supertest_1.default)(app)
            .get('/api/goals')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(2);
    });
    it('should create a goal', async () => {
        const goalData = {
            title: 'New Goal',
            description: 'Desc',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        };
        singleton_1.prismaMock.goal.create.mockResolvedValue({
            id: 3,
            ...goalData,
            startDate: new Date(goalData.startDate),
            endDate: new Date(goalData.endDate),
            divisionId: 1,
            creatorId: 1
        });
        // We also need to mock getting the user inside the controller logic if it queries DB? 
        // No, controller uses req.user from token.
        const res = await (0, supertest_1.default)(app)
            .post('/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send(goalData);
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('New Goal');
    });
});
//# sourceMappingURL=goalRoutes.test.js.map