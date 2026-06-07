import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  getMovements, addMovement, getLowStock
} from '../controllers/materialsController';

const router = Router();

router.use(authenticate);

router.get('/', getMaterials);
router.get('/low-stock', getLowStock);
router.get('/:id', getMaterial);
router.post('/', requireRole('ADMIN', 'MANAGER'), createMaterial);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateMaterial);
router.delete('/:id', requireRole('ADMIN'), deleteMaterial);

router.get('/:id/movements', getMovements);
router.post('/:id/movements', requireRole('ADMIN', 'MANAGER'), addMovement);

export default router;
