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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const password = await bcrypt.hash('password123', 10);
    // Default Division
    const division = await prisma.division.upsert({
        where: { name: 'IT' },
        update: {},
        create: {
            name: 'IT',
        },
    });
    const hrdDivision = await prisma.division.upsert({
        where: { name: 'HRD' },
        update: {},
        create: {
            name: 'HRD',
        },
    });
    // Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@kanjabung.com' },
        update: {},
        create: {
            email: 'admin@kanjabung.com',
            name: 'Admin User',
            password,
            role: client_1.Role.ADMIN,
            divisionId: division.id,
        },
    });
    // Manager User
    const manager = await prisma.user.upsert({
        where: { email: 'manager@kanjabung.com' },
        update: {},
        create: {
            email: 'manager@kanjabung.com',
            name: 'Alice Manager',
            password,
            role: client_1.Role.MANAGER,
            divisionId: division.id,
        },
    });
    // Employee User
    const employee = await prisma.user.upsert({
        where: { email: 'employee@kanjabung.com' },
        update: {},
        create: {
            email: 'employee@kanjabung.com',
            name: 'Bob Employee',
            password,
            role: client_1.Role.EMPLOYEE,
            divisionId: division.id,
        },
    });
    console.log({ admin, manager, employee });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map