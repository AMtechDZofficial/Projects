import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  getMovements, addMovement, getLowStock
} from '../controllers/materialsController';

const router = Router();

router.use(authenticate);

router.get('/', getMaterials);
router.get('/low-stock', getLowStock);
router.get('/:id', getMaterial);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

router.get('/:id/movements', getMovements);
router.post('/:id/movements', addMovement);

export default router;
