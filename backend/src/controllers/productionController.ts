import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const orders = await prisma.productionOrder.findMany({
      where,
      include: { model: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Erreur chargement ordres' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: req.params.id },
      include: {
        model: {
          include: {
            operations: { orderBy: { sequence: 'asc' } },
            components: { include: { material: true } }
          }
        }
      }
    });
    if (!order) { res.status(404).json({ message: 'Ordre non trouvé' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Erreur chargement ordre' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Génération numéro ordre automatique
    const count = await prisma.productionOrder.count();
    const orderNumber = req.body.orderNumber || `OF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = await prisma.productionOrder.create({
      data: { ...req.body, orderNumber },
      include: { model: { select: { name: true, code: true } } }
    });
    res.status(201).json(order);
  } catch {
    res.status(500).json({ message: 'Erreur création ordre de fabrication' });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.productionOrder.update({ where: { id: req.params.id }, data: req.body });
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour ordre' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const data: Record<string, unknown> = { status };
    if (status === 'EN_COURS') data.startDate = new Date();
    if (status === 'TERMINE') data.endDate = new Date();

    const order = await prisma.productionOrder.update({ where: { id: req.params.id }, data });
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour statut' });
  }
};

export const getSemiFinished = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { modelId } = req.query;
    const semiFinished = await prisma.semiFinishedStock.findMany({
      where: modelId ? { modelId: modelId as string } : {},
      include: {
        model: { select: { name: true, code: true } },
        operation: { select: { name: true, sequence: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(semiFinished);
  } catch {
    res.status(500).json({ message: 'Erreur chargement encours' });
  }
};

export const addSemiFinished = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.semiFinishedStock.create({ data: req.body });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: 'Erreur ajout encours' });
  }
};
