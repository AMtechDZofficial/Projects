import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getInvoices, getInvoice, createInvoice, addPayment, getInvoiceSummary } from '../controllers/invoicesController';

const router = Router();
router.use(authenticate);

router.get('/summary', getInvoiceSummary);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', requireRole('ADMIN', 'MANAGER'), createInvoice);
router.post('/:id/payments', requireRole('ADMIN', 'MANAGER'), addPayment);

export default router;
