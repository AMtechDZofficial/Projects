import { Router } from 'express';
import { login, register, me, updateConfig } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.put('/config', authenticate, updateConfig);

export default router;
