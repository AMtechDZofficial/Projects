import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  computeLineBalance,
  getAssignments, createAssignment, updateAssignment, deleteAssignment
} from '../controllers/lineBalanceController';

const router = Router();
router.use(authenticate);

router.post('/calculate', computeLineBalance);
router.get('/assignments/:orderId', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

export default router;
