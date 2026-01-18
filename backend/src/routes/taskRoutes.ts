import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { getTasks, createTask, updateTask, addComment, deleteTask, getTaskHistory } from '../controllers/taskController';

const router: Router = Router();

router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', authorizeRole(['MANAGER', 'EMPLOYEE']), createTask);
router.put('/:id', updateTask); // Check permission inside
router.delete('/:id', deleteTask); // Permission inside
router.post('/:id/comments', addComment);
router.get('/:id/history', getTaskHistory);

export default router;
