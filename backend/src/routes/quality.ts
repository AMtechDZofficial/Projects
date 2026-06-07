import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getDefectTypes, createDefectType, getQualityChecks, createQualityCheck, getQualityStats } from '../controllers/qualityController';

const router = Router();
router.use(authenticate);

router.get('/defect-types', getDefectTypes);
router.post('/defect-types', requireRole('ADMIN'), createDefectType);
router.get('/stats', getQualityStats);
router.get('/checks', getQualityChecks);
router.post('/checks', requireRole('ADMIN', 'MANAGER'), createQualityCheck);

export default router;
