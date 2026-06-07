import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch { res.status(500).json({ message: 'Erreur' }); }
});

router.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { code, name, contact, phone, email, address } = req.body;
    const supplier = await prisma.supplier.create({ data: { code, name, contact, phone, email, address } });
    res.status(201).json(supplier);
  } catch { res.status(500).json({ message: 'Erreur création fournisseur' }); }
});

router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: { name, contact, phone, email, address } });
    res.json(supplier);
  } catch { res.status(500).json({ message: 'Erreur mise à jour fournisseur' }); }
});

export default router;
