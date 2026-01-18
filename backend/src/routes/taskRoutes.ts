import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getTasks, createTask, updateTask, addComment } from '../controllers/taskController';

const router: Router = Router();

router.use(authenticateToken); // All need login

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/comments', addComment);

export default router;
