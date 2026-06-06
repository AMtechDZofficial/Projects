import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

function generateDeliveryNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `BL-${year}-${rand}`;
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

export const createDelivery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, deliveryDate, carrierName, trackingNumber, notes, lines } = req.body;
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber: generateDeliveryNumber(),
        orderId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        carrierName,
        trackingNumber,
        notes,
        lines: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: (lines as { modelId: string; colorRef?: string; sizeBreakdown: unknown; quantity: number }[]).map(l => ({
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
    // Update order status to PARTIELLEMENT_LIVREE
    await prisma.clientOrder.update({ where: { id: orderId }, data: { status: 'PARTIELLEMENT_LIVREE' } });
    res.status(201).json(delivery);
  } catch { res.status(500).json({ message: 'Erreur création livraison' }); }
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
    const delivery = await prisma.delivery.update({ where: { id: req.params.id }, data: { status } });
    res.json(delivery);
  } catch { res.status(500).json({ message: 'Erreur mise à jour statut' }); }
};
