import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { getGoals, createGoal, getDivisionEmployees, deleteGoal, getTeamOverview } from '../controllers/goalController';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', authorizeRole(['MANAGER', 'EMPLOYEE']), getGoals); // Both can view goals
router.get('/employees', authorizeRole(['MANAGER']), getDivisionEmployees); // Manager sees employees
router.get('/team-overview', authorizeRole(['MANAGER']), getTeamOverview); // Manager sees hierarchical team view
router.post('/', authorizeRole(['MANAGER']), createGoal);
router.delete('/:id', authorizeRole(['MANAGER', 'ADMIN']), deleteGoal);

export default router;
