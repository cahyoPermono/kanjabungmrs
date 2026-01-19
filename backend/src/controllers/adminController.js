"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = exports.deleteDivision = exports.updateDivision = exports.createDivision = exports.getDivisions = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
// Removed local initialization
// Division Management
const getDivisions = async (req, res) => {
    try {
        const divisions = await prismaClient_1.default.division.findMany({
            include: { _count: { select: { users: true } } }
        });
        res.json(divisions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching divisions' });
    }
};
exports.getDivisions = getDivisions;
const createDivision = async (req, res) => {
    const { name } = req.body;
    try {
        const division = await prismaClient_1.default.division.create({ data: { name } });
        res.status(201).json(division);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating division' });
    }
};
exports.createDivision = createDivision;
const updateDivision = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const division = await prismaClient_1.default.division.update({ where: { id: Number(id) }, data: { name } });
        res.json(division);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating division' });
    }
};
exports.updateDivision = updateDivision;
const deleteDivision = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient_1.default.division.delete({ where: { id: Number(id) } });
        res.json({ message: 'Division deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting division' });
    }
};
exports.deleteDivision = deleteDivision;
// User Management
const getUsers = async (req, res) => {
    try {
        const users = await prismaClient_1.default.user.findMany({
            select: { id: true, name: true, email: true, role: true, divisionId: true, division: { select: { name: true } } }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    const { email, password, name, role, divisionId } = req.body;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prismaClient_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                divisionId: Number(divisionId) // Ensure it is a number
            }
        });
        res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, name, role, divisionId } = req.body;
    try {
        const user = await prismaClient_1.default.user.update({
            where: { id: Number(id) },
            data: {
                email,
                name,
                role,
                divisionId: divisionId ? Number(divisionId) : null
            }
        });
        res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient_1.default.user.delete({ where: { id: Number(id) } });
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=adminController.js.map