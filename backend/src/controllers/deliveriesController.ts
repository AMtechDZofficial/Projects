import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

async function generateDeliveryNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.delivery.count({
    where: { deliveryDate: { gte: new Date(`${year}-01-01`) } }
  });
  return `BL-${year}-${String(count + 1).padStart(5, '0')}`;
}

export const getDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, status } = req.query;
    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: { include: { client: { select: { name: true, code: true } } } },
        lines: { include: { model: { select: { name: true, code: true } } } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } }
      },
      orderBy: { deliveryDate: 'desc' }
    });
    res.json(deliveries);
  } catch { res.status(500).json({ message: 'Erreur chargement livraisons' }); }
};

export const getDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { client: true } },
        lines: { include: { model: true } },
        invoice: true
      }
    });
    if (!delivery) { res.status(404).json({ message: 'Livraison non trouvée' }); return; }
    res.json(delivery);
  } catch { res.status(500).json({ message: 'Erreur chargement livraison' }); }
};

const VALID_DELIVERY_STATUSES = ['EN_PREPARATION', 'LIVRE', 'SIGNE', 'RETOUR_PARTIEL'];

export const createDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, deliveryDate, carrierName, trackingNumber, notes, lines } = req.body;
    const typedLines = (lines as { modelId: string; colorRef?: string; sizeBreakdown: unknown; quantity: number }[]);

    const delivery = await prisma.$transaction(async (tx) => {
      const order = await tx.clientOrder.findUnique({
        where: { id: orderId },
        include: {
          lines: { select: { modelId: true, quantity: true } },
          deliveries: { include: { lines: { select: { modelId: true, quantity: true } } } }
        }
      });
      if (!order) throw Object.assign(new Error('Commande non trouvée'), { statusCode: 404 });

      const del = await tx.delivery.create({
        data: {
          deliveryNumber: await generateDeliveryNumber(tx),
          orderId,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
          carrierName,
          trackingNumber,
          notes,
          lines: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: typedLines.map(l => ({
              modelId: l.modelId,
              colorRef: l.colorRef,
              sizeBreakdown: l.sizeBreakdown,
              quantity: l.quantity
            })) as any
          }
        },
        include: {
          order: { include: { client: { select: { name: true } } } },
          lines: { include: { model: { select: { name: true } } } }
        }
      });

      // Check if all ordered quantities are now covered
      const deliveredByModel = new Map<string, number>();
      for (const existingDel of order.deliveries) {
        for (const dl of existingDel.lines) {
          deliveredByModel.set(dl.modelId, (deliveredByModel.get(dl.modelId) ?? 0) + dl.quantity);
        }
      }
      for (const nl of typedLines) {
        deliveredByModel.set(nl.modelId, (deliveredByModel.get(nl.modelId) ?? 0) + nl.quantity);
      }
      const fullyDelivered = order.lines.every(
        ol => (deliveredByModel.get(ol.modelId) ?? 0) >= ol.quantity
      );

      await tx.clientOrder.update({
        where: { id: orderId },
        data: { status: fullyDelivered ? 'LIVREE' : 'PARTIELLEMENT_LIVREE' }
      });

      return del;
    });

    res.status(201).json(delivery);
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ message: e.message });
    } else {
      res.status(500).json({ message: 'Erreur création livraison' });
    }
  }
};

export const signDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status: 'SIGNE', signedAt: new Date() }
    });
    res.json(delivery);
  } catch { res.status(500).json({ message: 'Erreur signature livraison' }); }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !VALID_DELIVERY_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Statut invalide' });
      return;
    }
    const delivery = await prisma.delivery.update({ where: { id: req.params.id }, data: { status } });
    res.json(delivery);
  } catch { res.status(500).json({ message: 'Erreur mise à jour statut' }); }
};
