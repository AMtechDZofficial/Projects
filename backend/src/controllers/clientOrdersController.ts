import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

async function generateOrderNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.clientOrder.count({
    where: { orderDate: { gte: new Date(`${year}-01-01`) } }
  });
  return `CMD-${year}-${String(count + 1).padStart(5, '0')}`;
}

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    const orders = await prisma.clientOrder.findMany({
      where,
      include: {
        client: { select: { name: true, code: true, city: true } },
        lines: { include: { model: { select: { name: true, code: true } } } },
        _count: { select: { deliveries: true } }
      },
      orderBy: { orderDate: 'desc' }
    });
    res.json(orders);
  } catch { res.status(500).json({ message: 'Erreur chargement commandes' }); }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.clientOrder.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        lines: { include: { model: { select: { name: true, code: true, salePrice: true } } } },
        productionOrders: { select: { id: true, orderNumber: true, status: true, quantity: true } },
        deliveries: { select: { id: true, deliveryNumber: true, status: true, deliveryDate: true } }
      }
    });
    if (!order) { res.status(404).json({ message: 'Commande non trouvée' }); return; }
    res.json(order);
  } catch { res.status(500).json({ message: 'Erreur chargement commande' }); }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, deliveryDate, depositAmount, notes, lines } = req.body;
    const typedLines = (lines as { modelId: string; colorRef?: string; sizeBreakdown: unknown; quantity: number; unitPrice: number }[]);
    const totalAmount = typedLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const order = await prisma.$transaction(async (tx) => {
      return tx.clientOrder.create({
        data: {
          orderNumber: await generateOrderNumber(tx),
          clientId,
          deliveryDate: new Date(deliveryDate),
          depositAmount: depositAmount || 0,
          totalAmount,
          notes,
          lines: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: typedLines.map(l => ({
              modelId: l.modelId,
              colorRef: l.colorRef,
              sizeBreakdown: l.sizeBreakdown,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              totalPrice: l.quantity * l.unitPrice
            })) as any
          }
        },
        include: {
          client: { select: { name: true, code: true } },
          lines: { include: { model: { select: { name: true } } } }
        }
      });
    });
    res.status(201).json(order);
  } catch { res.status(500).json({ message: 'Erreur création commande' }); }
};

const VALID_ORDER_STATUSES = ['DEVIS', 'CONFIRMEE', 'EN_PRODUCTION', 'PARTIELLEMENT_LIVREE', 'LIVREE', 'FACTUREE', 'PAYEE', 'ANNULEE'];

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Statut invalide' });
      return;
    }
    const order = await prisma.clientOrder.update({ where: { id: req.params.id }, data: { status } });
    res.json(order);
  } catch { res.status(500).json({ message: 'Erreur mise à jour statut' }); }
};

export const updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliveryDate, depositAmount, notes } = req.body;
    const order = await prisma.clientOrder.update({
      where: { id: req.params.id },
      data: {
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        depositAmount,
        notes
      }
    });
    res.json(order);
  } catch { res.status(500).json({ message: 'Erreur mise à jour commande' }); }
};

export const getOrderSummary = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, enCours, retard, ca] = await Promise.all([
      prisma.clientOrder.count({ where: { status: { not: 'ANNULEE' } } }),
      prisma.clientOrder.count({ where: { status: { in: ['CONFIRMEE', 'EN_PRODUCTION'] } } }),
      prisma.clientOrder.count({
        where: { status: { in: ['CONFIRMEE', 'EN_PRODUCTION'] }, deliveryDate: { lt: new Date() } }
      }),
      prisma.clientOrder.aggregate({ where: { status: { not: 'ANNULEE' } }, _sum: { totalAmount: true } })
    ]);
    res.json({ total, enCours, retard, caTotal: ca._sum.totalAmount || 0 });
  } catch { res.status(500).json({ message: 'Erreur résumé commandes' }); }
};
