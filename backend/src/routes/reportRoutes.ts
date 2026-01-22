import { Router } from 'express';
import { getDashboardStats, getEmployeeStats, downloadReport } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dashboard-stats', authenticateToken, getDashboardStats);
router.get('/employee-stats', authenticateToken, getEmployeeStats);
router.get('/download', authenticateToken, downloadReport);

export default router;
