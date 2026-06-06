import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { chatStream, analyzeWorkshop } from '../controllers/aiController';

const router = Router();
router.use(authenticate);

router.post('/chat', chatStream);
router.post('/analyze', analyzeWorkshop);

export default router;
