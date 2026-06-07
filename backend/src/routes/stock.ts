import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getFinishedStock, addFinishedStockMovement, getFinishedStockSummary
} from '../controllers/stockController';

const router = Router();
router.use(authenticate);

router.get('/finished', getFinishedStock);
router.get('/finished/summary', getFinishedStockSummary);
router.post('/finished', requireRole('ADMIN', 'MANAGER'), addFinishedStockMovement);

export default router;
