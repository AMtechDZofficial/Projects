import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFinishedStock, addFinishedStockMovement, getFinishedStockSummary
} from '../controllers/stockController';

const router = Router();
router.use(authenticate);

router.get('/finished', getFinishedStock);
router.get('/finished/summary', getFinishedStockSummary);
router.post('/finished', addFinishedStockMovement);

export default router;
