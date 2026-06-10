import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getModels, getModel, createModel, updateModel, deleteModel,
  addComponent, updateComponent, deleteComponent,
  addOperation, updateOperation, deleteOperation,
  getModelCost
} from '../controllers/modelsController';
import {
  getModelFull,
  getPatternPieces, addPatternPiece, updatePatternPiece, deletePatternPiece,
  getGradationRows, addGradationRow, updateGradationRow, deleteGradationRow,
  getFittingSessions, upsertFittingSession,
  getPrototypeDev, upsertPrototypeDev,
  getColorVariants, addColorVariant, updateColorVariant, deleteColorVariant
} from '../controllers/modelDocsController';

const router = Router();
router.use(authenticate);

router.get('/', getModels);
router.get('/:id', getModel);
router.post('/', createModel);
router.put('/:id', updateModel);
router.delete('/:id', deleteModel);
router.get('/:id/cost', getModelCost);
router.get('/:id/full', getModelFull);

router.post('/:id/components', addComponent);
router.put('/:id/components/:componentId', updateComponent);
router.delete('/:id/components/:componentId', deleteComponent);

router.post('/:id/operations', addOperation);
router.put('/:id/operations/:operationId', updateOperation);
router.delete('/:id/operations/:operationId', deleteOperation);

router.get('/:id/pattern-pieces', getPatternPieces);
router.post('/:id/pattern-pieces', addPatternPiece);
router.put('/:id/pattern-pieces/:pieceId', updatePatternPiece);
router.delete('/:id/pattern-pieces/:pieceId', deletePatternPiece);

router.get('/:id/gradation', getGradationRows);
router.post('/:id/gradation', addGradationRow);
router.put('/:id/gradation/:rowId', updateGradationRow);
router.delete('/:id/gradation/:rowId', deleteGradationRow);

router.get('/:id/fittings', getFittingSessions);
router.post('/:id/fittings', upsertFittingSession);

router.get('/:id/prototype', getPrototypeDev);
router.post('/:id/prototype', upsertPrototypeDev);

router.get('/:id/color-variants', getColorVariants);
router.post('/:id/color-variants', addColorVariant);
router.put('/:id/color-variants/:variantId', updateColorVariant);
router.delete('/:id/color-variants/:variantId', deleteColorVariant);

export default router;
