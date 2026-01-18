import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { getGoals, createGoal, getDivisionEmployees } from '../controllers/goalController';

const router: Router = Router();

router.use(authenticateToken); // All need login

// Shared routes (Manager + Employee)
router.get('/', getGoals);

// Manager only
router.post('/', authorizeRole(['MANAGER', 'ADMIN']), createGoal);
router.get('/employees', authorizeRole(['MANAGER', 'ADMIN']), getDivisionEmployees);

export default router;
