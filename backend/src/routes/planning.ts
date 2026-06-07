import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getSchedule, calculateAndSchedule, getCapacityAnalysis, updateSchedulePriority } from '../controllers/planningController';

const router = Router();
router.use(authenticate);

router.get('/capacity', getCapacityAnalysis);
router.get('/', getSchedule);
router.post('/schedule', requireRole('ADMIN', 'MANAGER'), calculateAndSchedule);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateSchedulePriority);

export default router;
