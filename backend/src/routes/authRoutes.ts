import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router: Router = Router();

router.post('/login', login);
router.post('/register', register); // Ideally protect this later

export default router;
