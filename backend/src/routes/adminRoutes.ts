import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { 
    getDivisions, createDivision, updateDivision, deleteDivision,
    getUsers, createUser, updateUser, deleteUser 
} from '../controllers/adminController';

const router: Router = Router();

// Protect all admin routes
router.use(authenticateToken, authorizeRole(['ADMIN']));

// Division Routes
router.get('/divisions', getDivisions);
router.post('/divisions', createDivision);
router.put('/divisions/:id', updateDivision);
router.delete('/divisions/:id', deleteDivision);

// User Routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
