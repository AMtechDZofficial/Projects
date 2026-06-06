import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getModels, getModel, createModel, updateModel, deleteModel,
  addComponent, updateComponent, deleteComponent,
  addOperation, updateOperation, deleteOperation,
  getModelCost
} from '../controllers/modelsController';

const router = Router();
router.use(authenticate);

router.get('/', getModels);
router.get('/:id', getModel);
router.post('/', createModel);
router.put('/:id', updateModel);
router.delete('/:id', deleteModel);
router.get('/:id/cost', getModelCost);

router.post('/:id/components', addComponent);
router.put('/:id/components/:componentId', updateComponent);
router.delete('/:id/components/:componentId', deleteComponent);

router.post('/:id/operations', addOperation);
router.put('/:id/operations/:operationId', updateOperation);
router.delete('/:id/operations/:operationId', deleteOperation);

export default router;
