import { Router } from 'express';
import { login, register, me, updateConfig } from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', login);
// Registration requires an existing admin — no unauthenticated self-signup
router.post('/register', authenticate, requireRole('ADMIN'), register);
router.get('/me', authenticate, me);
// Workshop config is admin-only
router.put('/config', authenticate, requireRole('ADMIN'), updateConfig);

export default router;
