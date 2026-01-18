import express from 'express';
import { getDashboardStats } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getDashboardStats);

export default router;
