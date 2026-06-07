import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getMachines, getMachine, createMachine, updateMachine,
  updateMachineStatus, deleteMachine, getMachineStats
} from '../controllers/machinesController';

const router = Router();
router.use(authenticate);

router.get('/stats', getMachineStats);
router.get('/', getMachines);
router.get('/:id', getMachine);
router.post('/', requireRole('ADMIN', 'MANAGER'), createMachine);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateMachine);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateMachineStatus);
router.delete('/:id', requireRole('ADMIN'), deleteMachine);

export default router;
