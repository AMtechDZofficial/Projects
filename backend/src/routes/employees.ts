import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee,
  getPieceRates, addPieceRate, addPieceProduction, getEmployeeProductions
} from '../controllers/employeesController';

const router = Router();
router.use(authenticate);

router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deactivateEmployee);

router.get('/:id/piece-rates', getPieceRates);
router.post('/:id/piece-rates', addPieceRate);

router.get('/:id/productions', getEmployeeProductions);
router.post('/:id/productions', addPieceProduction);

export default router;
