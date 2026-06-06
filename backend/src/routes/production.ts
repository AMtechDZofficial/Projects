import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOrders, getOrder, createOrder, updateOrder, updateOrderStatus,
  getSemiFinished, addSemiFinished
} from '../controllers/productionController';

const router = Router();
router.use(authenticate);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.post('/orders', createOrder);
router.put('/orders/:id', updateOrder);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/semi-finished', getSemiFinished);
router.post('/semi-finished', addSemiFinished);

export default router;
