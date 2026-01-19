"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
// Removed local initialization
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, divisionId: user.divisionId }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
exports.login = login;
const register = async (req, res) => {
    // Basic registration for Admin to create users, or self-register if needed (usually restricted)
    // For now implementing a basic open register for testing, but typically this should be Admin only.
    const { email, password, name, role, divisionId } = req.body;
    try {
        const existingUser = await prismaClient_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prismaClient_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'EMPLOYEE',
                divisionId: divisionId ? parseInt(divisionId) : null
            }
        });
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
exports.register = register;
const updatePassword = async (req, res) => {
    // req.user is set by authenticateToken middleware
    const userId = req.user?.id;
    const { newPassword } = req.body;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating password.' });
    }
};
exports.updatePassword = updatePassword;
//# sourceMappingURL=authController.js.map