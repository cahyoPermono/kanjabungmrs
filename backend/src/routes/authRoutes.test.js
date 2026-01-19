"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("../routes/authRoutes"));
const singleton_1 = require("../tests/singleton");
const bcrypt = __importStar(require("bcryptjs"));
// We mock the centralized prisma client using singleton.ts
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
describe('Auth API', () => {
    it('should register a new user', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'EMPLOYEE',
            divisionId: 1
        };
        singleton_1.prismaMock.user.create.mockResolvedValue({
            id: 1,
            ...user,
            password: 'hashedpassword',
            divisionId: 1
        });
        // Mock findUnique to return null (user doesn't exist)
        singleton_1.prismaMock.user.findUnique.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app)
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
        singleton_1.prismaMock.user.findUnique.mockResolvedValue(user);
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({
            email: 'test@example.com',
            password: 'password123'
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
//# sourceMappingURL=authRoutes.test.js.map