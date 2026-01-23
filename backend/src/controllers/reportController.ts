import { Request, Response } from 'express';
import prisma from '../prismaClient';

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        divisionId: number;
    }
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'MANAGER') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const divisionId = req.user.divisionId;

    try {
        // 1. Goal Stats
        const totalGoals = await prisma.goal.count({ where: { divisionId } });
        // Assuming we calculate goal completion based on tasks, or if goals have a status field (they don't currently, only tasks).
        // Let's count goals that have all tasks completed? Or just skip "Goal Completion" for now and focus on Tasks.
        
        // 2. Task Stats
        const taskStats = await prisma.task.groupBy({
            by: ['status'],
            where: {
                goal: {
                    divisionId: divisionId
                }
            },
            _count: {
                _all: true
            }
        });

        const totalTasks = taskStats.reduce((acc, curr) => acc + curr._count._all, 0);
        const completedTasks = taskStats.find(s => s.status === 'COMPLETED')?._count._all || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 3. Employee Performance (Tasks Completed)
        const employeeStats = await prisma.task.groupBy({
            by: ['assigneeId'],
            where: {
                goal: { divisionId },
                status: 'COMPLETED'
            },
            _count: { _all: true }
        });

        // Need to join with User names. groupBy doesn't support include.
        // So we fetch users and map.
        const employees = await prisma.user.findMany({
            where: { divisionId, role: 'EMPLOYEE' },
            select: { id: true, name: true }
        });

        const performanceData = employees.map(emp => {
            const stat = employeeStats.find(s => s.assigneeId === emp.id);
            return {
                name: emp.name,
                completedTasks: stat ? stat._count._all : 0
            };
        }).sort((a, b) => b.completedTasks - a.completedTasks);

        // 4. Overdue Tasks
        const overdueTasks = await prisma.task.findMany({
            where: {
                goal: { divisionId },
                status: { not: 'COMPLETED' },
                dueDate: { lt: new Date() }
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                assignee: { select: { name: true } },
                priority: true
            },
            take: 5
        });

        res.json({
            overview: {
                totalGoals,
                totalTasks,
                completionRate
            },
            taskDistribution: taskStats.map(s => ({ name: s.status, value: s._count._all })),
            employeePerformance: performanceData,
            overdueTasks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching report stats' });
    }
}

export const getEmployeeStats = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;

    try {
        // 1. Task Stats
        const taskStats = await prisma.task.groupBy({
            by: ['status'],
            where: {
                assigneeId: userId
            },
            _count: {
                _all: true
            }
        });

        const totalTasks = taskStats.reduce((acc, curr) => acc + curr._count._all, 0);
        const completedTasks = taskStats.find(s => s.status === 'COMPLETED')?._count._all || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const pendingTasks = totalTasks - completedTasks;

        // 2. Overdue Tasks
        const overdueTasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                status: { not: 'COMPLETED' },
                dueDate: { lt: new Date() }
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                priority: true,
                goal: { select: { title: true } }
            },
            take: 5
        });

        // 3. Recent Activity (Completed tasks in last 7 days)
        const recentCompleted = await prisma.task.count({
            where: {
                assigneeId: userId,
                status: 'COMPLETED',
                updatedAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7))
                }
            }
        });

        res.json({
            overview: {
                totalTasks,
                completedTasks,
                pendingTasks,
                completionRate,
                recentCompleted
            },
            taskDistribution: taskStats.map(s => ({ name: s.status, value: s._count._all })),
            overdueTasks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching employee stats' });
    }
}

import ExcelJS from 'exceljs';
// Replace standard pdfkit with pdfkit-table
// @ts-ignore
import PDFDocument from 'pdfkit-table';

export const downloadReport = async (req: AuthRequest, res: Response) => {
    // Admin check - or Manager? User said "Admin Dashboard". Let's restrict to Admin/Manager?
    // User request: "untuk task2 nya hanya bisa dilihat admin... dan admin bisa delete task"
    // Update: User requested Employee can also download their own tasks.
    if (!req.user || !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const { 
        format, // 'excel' or 'pdf'
        assigneeId,
        priority,
        status,
        dueDateStart, dueDateEnd,
        createdAtStart, createdAtEnd,
        closedAtStart, closedAtEnd,
        goalId
    } = req.query;

    try {
        const whereClause: any = {};
        
        // --- Role Based Scoping ---
        if (req.user.role === 'EMPLOYEE') {
            // Employees strictly see their own tasks
            whereClause.assigneeId = req.user.id;
        } else if (req.user.role === 'MANAGER' && req.user.divisionId) {
             // Managers see their division's goals
             whereClause.goal = { divisionId: req.user.divisionId };
        }

        // --- Filters ---
        // For Managers/Admins, allow filtering by assignee. For Employees, this is ignored/overridden above.
        if (req.user.role !== 'EMPLOYEE' && assigneeId && assigneeId !== 'ALL') {
            whereClause.assigneeId = Number(assigneeId);
        }

        if (priority && priority !== 'ALL') whereClause.priority = priority as any;
        if (status && status !== 'ALL') whereClause.status = status as any;
        if (goalId && goalId !== 'ALL') whereClause.goalId = Number(goalId);

        // Date Filters
        const buildDateFilter = (start: any, end: any) => {
             if (!start && !end) return undefined;
             const filter: any = {};
             if (start) filter.gte = new Date(start as string);
             if (end) {
                 const endDate = new Date(end as string);
                 if ((end as string).length <= 10) endDate.setHours(23, 59, 59, 999);
                 filter.lte = endDate;
             }
             return filter;
         };

        if (dueDateStart || dueDateEnd) {
             const filter = buildDateFilter(dueDateStart, dueDateEnd);
             if (filter) whereClause.dueDate = filter;
        }
        if (createdAtStart || createdAtEnd) {
             const filter = buildDateFilter(createdAtStart, createdAtEnd);
             if (filter) whereClause.createdAt = filter;
        }
        if (closedAtStart || closedAtEnd) {
             const filter = buildDateFilter(closedAtStart, closedAtEnd);
             if (filter) {
                 whereClause.updatedAt = filter;
                 whereClause.status = 'COMPLETED';
             }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                goal: { select: { title: true, division: { select: { name: true } } } },
                assignee: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Tasks Report');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Goal', key: 'goal', width: 25 },
                { header: 'Division', key: 'division', width: 20 },
                { header: 'Assignee', key: 'assignee', width: 20 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Priority', key: 'priority', width: 15 },
                { header: 'Due Date', key: 'dueDate', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 15 },
            ];

            tasks.forEach(task => {
                worksheet.addRow({
                    id: task.id,
                    title: task.title,
                    goal: task.goal.title,
                    division: task.goal.division.name,
                    assignee: task.assignee?.name || 'Unassigned',
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '-',
                    createdAt: task.createdAt.toISOString().split('T')[0]
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=tasks-report.xlsx');

            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            try {
                const doc = new PDFDocument({ margin: 30, size: 'A4' });
                
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=tasks-report.pdf');

                doc.pipe(res);

                // Header
                doc.fontSize(20).text('Tasks Report', { align: 'center' });
                doc.moveDown();

                // Table
                const table = {
                    title: "Task Details",
                    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
                    headers: [
                        { label: "ID", property: 'id', width: 40 },
                        { label: "Title", property: 'title', width: 150 },
                        { label: "Goal", property: 'goal', width: 100 },
                        { label: "Assignee", property: 'assignee', width: 80 },
                        { label: "Status", property: 'status', width: 80 },
                        { label: "Priority", property: 'priority', width: 60 },
                        { label: "Due Date", property: 'dueDate', width: 70 }
                    ],
                    rows: tasks.map(task => [
                        String(task.id),
                        task.title || '',
                        task.goal?.title || '',
                        task.assignee?.name || 'Unassigned',
                        String(task.status || ''),
                        String(task.priority || ''),
                        task.dueDate ? task.dueDate.toISOString().split('T')[0] : '-'
                    ] as string[]), // Explicit cast to string[] to satisfy strict typing
                };

                // Use the callback-based table method if await doesn't work as expected or verify API
                // PDFKit-table usually is `await doc.table(table)`
                await doc.table(table, {
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
                    prepareRow: (row: any, indexColumn: any, indexRow: any, rectRow: any, rectCell: any) => {
                        doc.font("Helvetica").fontSize(8);
                        try {
                            if (indexColumn === 0 && rectRow) {
                                (doc as any).addBackground(rectRow, (indexRow % 2 ? 'blue' : 'white'), 0.15);
                            }
                        } catch (e) {}
                        return doc;
                    },
                });
                doc.end();
            } catch (pdfError) {
                console.error("PDF Generation Error:", pdfError);
                // Can't really send JSON if headers already sent, but let's try
                if (!res.headersSent) res.status(500).json({ message: 'Error generating PDF' });
            }
        } else {
            res.status(400).json({ message: 'Invalid format requested' });
        }

    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ message: 'Error generating report' });
    }
}
