import express, { Router } from 'express';
import { getDashboardStats, getEmployeeStats } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', authenticateToken, getDashboardStats);
router.get('/employee', authenticateToken, getEmployeeStats);

export default router;
