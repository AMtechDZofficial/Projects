import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { getCoutMinute, calculateModelCost } from '../services/costService';

export const getCoutMinuteHandler = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getCoutMinute();
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Erreur calcul coût minute' });
  }
};

export const getAllModelsCosts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const models = await prisma.coutureModel.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, category: true, salePrice: true }
    });

    const costs = await Promise.all(
      models.map(async m => {
        try {
          const cost = await calculateModelCost(m.id);
          return {
            ...m,
            totalCost: cost.totalCost,
            materialsCost: cost.materialsCost,
            laborCost: cost.laborCost,
            overheadCost: cost.overheadCost,
            totalMinutes: cost.totalMinutes,
            margin: m.salePrice ? Number(m.salePrice) - cost.totalCost : null,
            marginPercent: m.salePrice && cost.totalCost > 0
              ? ((Number(m.salePrice) - cost.totalCost) / Number(m.salePrice)) * 100
              : null
          };
        } catch {
          return { ...m, totalCost: 0, materialsCost: 0, laborCost: 0, overheadCost: 0, totalMinutes: 0 };
        }
      })
    );
    res.json(costs);
  } catch {
    res.status(500).json({ message: 'Erreur calcul coûts modèles' });
  }
};

export const getModelCostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cost = await calculateModelCost(req.params.id);
    res.json(cost);
  } catch {
    res.status(500).json({ message: 'Erreur calcul coût modèle' });
  }
};
