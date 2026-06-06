import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';
import { getCoutMinute } from '../services/costService';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const [
      totalMaterials, lowStockCount, activeModels, pendingOrders,
      activeEmployees, unpaidPayrolls, coutMinute, recentMovements
    ] = await Promise.all([
      prisma.material.count({ where: { isActive: true } }),
      prisma.material.findMany({ where: { isActive: true } }).then(
        mats => mats.filter(m => Number(m.stockQuantity) <= Number(m.minimumStock)).length
      ),
      prisma.coutureModel.count({ where: { isActive: true } }),
      prisma.productionOrder.count({ where: { status: { in: ['EN_ATTENTE', 'EN_COURS'] } } }),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.payroll.count({ where: { status: { in: ['BROUILLON', 'VALIDE'] } } }),
      getCoutMinute().catch(() => ({ coutMinute: 0 })),
      prisma.materialMovement.findMany({
        take: 10, orderBy: { date: 'desc' },
        include: { material: { select: { name: true } } }
      })
    ]);

    const finishedStockCount = await prisma.finishedStock.findMany()
      .then(items => items.reduce((sum, i) => {
        const delta = i.type === 'ENTREE' ? 1 : i.type === 'SORTIE' ? -1 : 0;
        return sum + delta * Number(i.quantity);
      }, 0));

    res.json({
      stats: {
        totalMaterials,
        lowStockCount,
        activeModels,
        pendingOrders,
        activeEmployees,
        unpaidPayrolls,
        coutMinute: coutMinute.coutMinute,
        finishedStockCount
      },
      recentMovements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur dashboard' });
  }
});

export default router;
