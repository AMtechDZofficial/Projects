import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getOrders, getOrder, createOrder, updateOrder, updateOrderStatus,
  getSemiFinished, addSemiFinished
} from '../controllers/productionController';

const router = Router();
router.use(authenticate);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.post('/orders', requireRole('ADMIN', 'MANAGER'), createOrder);
router.put('/orders/:id', requireRole('ADMIN', 'MANAGER'), updateOrder);
router.patch('/orders/:id/status', requireRole('ADMIN', 'MANAGER'), updateOrderStatus);

router.get('/semi-finished', getSemiFinished);
router.post('/semi-finished', requireRole('ADMIN', 'MANAGER'), addSemiFinished);

export default router;
