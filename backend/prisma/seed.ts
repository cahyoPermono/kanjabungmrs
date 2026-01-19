import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      role: Role.ADMIN,
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
      role: Role.MANAGER,
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
      role: Role.EMPLOYEE,
      divisionId: division.id,
    },
  });

  // Initial Goal
  const goal1 = await prisma.goal.create({
    data: {
      code: 'Q1-2024',
      title: 'Implement Core Banking System',
      description: 'Upgrade the legacy system to the new microservices architecture.',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      divisionId: division.id,
      creatorId: manager.id,
      tasks: {
        create: [
          {
            title: 'Design Database Schema',
            description: 'Define tables for User, Account, and Transaction.',
            status: 'COMPLETED',
            priority: 'HIGH',
            assigneeId: employee.id,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5))
          },
          {
            title: 'Setup API Gateway',
            description: 'Configure Nginx layout.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            assigneeId: employee.id,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
          },
          {
            title: 'Frontend Integration',
            description: 'Connect React app to new APIs.',
            status: 'TODO',
            priority: 'URGENT',
            assigneeId: null, // Unassigned
            dueDate: new Date(new Date().setDate(new Date().getDate() + 10))
          }
        ]
      }
    }
  });

  console.log({ admin, manager, employee, goal1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
