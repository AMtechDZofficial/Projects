import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getFinishedStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { modelId } = req.query;
    const movements = await prisma.finishedStock.findMany({
      where: modelId ? { modelId: modelId as string } : {},
      include: { model: { select: { name: true, code: true, category: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Erreur chargement stock fini' });
  }
};

export const addFinishedStockMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movement = await prisma.finishedStock.create({
      data: req.body,
      include: { model: { select: { name: true, code: true } } }
    });
    res.status(201).json(movement);
  } catch {
    res.status(500).json({ message: 'Erreur ajout mouvement stock' });
  }
};

export const getFinishedStockSummary = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await prisma.finishedStock.findMany({
      include: { model: { select: { id: true, name: true, code: true, category: true } } }
    });

    // Calculer le stock actuel par modèle
    const stockByModel: Record<string, { model: { id: string; name: string; code: string; category: string }; quantity: number; totalValue: number }> = {};

    for (const m of movements) {
      const key = m.modelId;
      if (!stockByModel[key]) {
        stockByModel[key] = { model: m.model, quantity: 0, totalValue: 0 };
      }
      const qty = Number(m.quantity);
      const delta = m.type === 'ENTREE' ? qty : m.type === 'SORTIE' ? -qty : 0;
      stockByModel[key].quantity += delta;
      if (m.productionCost) {
        stockByModel[key].totalValue += delta * Number(m.productionCost);
      }
    }

    res.json(Object.values(stockByModel).filter(s => s.quantity > 0));
  } catch {
    res.status(500).json({ message: 'Erreur résumé stock' });
  }
};
