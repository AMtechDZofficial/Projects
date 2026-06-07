import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getClients, getClient, createClient, updateClient, deleteClient, getClientStats } from '../controllers/clientsController';

const router = Router();
router.use(authenticate);

router.get('/stats', getClientStats);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', requireRole('ADMIN', 'MANAGER'), createClient);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateClient);
router.delete('/:id', requireRole('ADMIN'), deleteClient);

export default router;
