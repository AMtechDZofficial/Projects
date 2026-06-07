import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getDeliveries, getDelivery, createDelivery, signDelivery, updateDeliveryStatus } from '../controllers/deliveriesController';

const router = Router();
router.use(authenticate);

router.get('/', getDeliveries);
router.get('/:id', getDelivery);
router.post('/', requireRole('ADMIN', 'MANAGER'), createDelivery);
router.patch('/:id/sign', requireRole('ADMIN', 'MANAGER'), signDelivery);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateDeliveryStatus);

export default router;
