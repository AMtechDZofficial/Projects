import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPayrolls, calculatePayrollHandler, createPayroll,
  updatePayroll, validatePayroll, markAsPaid, getPayrollSummary
} from '../controllers/payrollController';

const router = Router();
router.use(authenticate);

router.get('/', getPayrolls);
router.get('/summary', getPayrollSummary);
router.post('/calculate', calculatePayrollHandler);
router.post('/', createPayroll);
router.put('/:id', updatePayroll);
router.post('/:id/validate', validatePayroll);
router.post('/:id/pay', markAsPaid);

export default router;
