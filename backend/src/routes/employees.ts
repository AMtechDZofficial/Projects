import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee,
  getPieceRates, addPieceRate, addPieceProduction, getEmployeeProductions
} from '../controllers/employeesController';

const router = Router();
router.use(authenticate);

router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', requireRole('ADMIN', 'MANAGER'), createEmployee);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateEmployee);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deactivateEmployee);

router.get('/:id/piece-rates', getPieceRates);
router.post('/:id/piece-rates', requireRole('ADMIN', 'MANAGER'), addPieceRate);

router.get('/:id/productions', getEmployeeProductions);
router.post('/:id/productions', requireRole('ADMIN', 'MANAGER'), addPieceProduction);

export default router;
