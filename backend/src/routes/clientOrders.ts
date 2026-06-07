import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getOrders, getOrder, createOrder, updateOrder, updateOrderStatus, getOrderSummary } from '../controllers/clientOrdersController';

const router = Router();
router.use(authenticate);

router.get('/summary', getOrderSummary);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', requireRole('ADMIN', 'MANAGER'), createOrder);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateOrder);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateOrderStatus);

export default router;
