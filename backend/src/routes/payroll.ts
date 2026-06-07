import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getPayrolls, calculatePayrollHandler, createPayroll,
  updatePayroll, validatePayroll, markAsPaid, getPayrollSummary
} from '../controllers/payrollController';

const router = Router();
router.use(authenticate);

router.get('/', getPayrolls);
router.get('/summary', getPayrollSummary);
router.post('/calculate', requireRole('ADMIN', 'MANAGER'), calculatePayrollHandler);
router.post('/', requireRole('ADMIN', 'MANAGER'), createPayroll);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updatePayroll);
router.post('/:id/validate', requireRole('ADMIN', 'MANAGER'), validatePayroll);
router.post('/:id/pay', requireRole('ADMIN'), markAsPaid);

export default router;
