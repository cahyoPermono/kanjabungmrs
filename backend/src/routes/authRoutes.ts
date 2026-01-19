import { Router } from 'express';
import { login, register, updatePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

router.post('/login', login);
router.post('/register', register); // Ideally protect this later
router.put('/profile/password', authenticateToken, updatePassword);

export default router;
