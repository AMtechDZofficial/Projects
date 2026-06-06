import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCoutMinuteHandler, getAllModelsCosts, getModelCostById } from '../controllers/costsController';

const router = Router();
router.use(authenticate);

router.get('/cout-minute', getCoutMinuteHandler);
router.get('/models', getAllModelsCosts);
router.get('/models/:id', getModelCostById);

export default router;
