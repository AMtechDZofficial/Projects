import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { calculateModelCost } from '../services/costService';

export const getModels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const models = await prisma.coutureModel.findMany({
      where,
      include: {
        components: { include: { material: true } },
        operations: { orderBy: { sequence: 'asc' } }
      },
      orderBy: { code: 'asc' }
    });
    res.json(models);
  } catch {
    res.status(500).json({ message: 'Erreur chargement modèles' });
  }
};

export const getModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const model = await prisma.coutureModel.findUnique({
      where: { id: req.params.id },
      include: {
        components: { include: { material: { include: { supplier: { select: { name: true } } } } } },
        operations: { orderBy: { sequence: 'asc' } }
      }
    });
    if (!model) { res.status(404).json({ message: 'Modèle non trouvé' }); return; }
    res.json(model);
  } catch {
    res.status(500).json({ message: 'Erreur chargement modèle' });
  }
};

export const createModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { components, operations, ...modelData } = req.body;
    const model = await prisma.coutureModel.create({
      data: {
        ...modelData,
        components: components ? { create: components } : undefined,
        operations: operations ? { create: operations } : undefined
      },
      include: { components: { include: { material: true } }, operations: true }
    });
    res.status(201).json(model);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(400).json({ message: 'Code modèle déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur création modèle' });
    }
  }
};

export const updateModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { components, operations, ...data } = req.body;
    const model = await prisma.coutureModel.update({ where: { id: req.params.id }, data });
    res.json(model);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour modèle' });
  }
};

export const deleteModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.coutureModel.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Modèle désactivé' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression modèle' });
  }
};

export const getModelCost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cost = await calculateModelCost(req.params.id);
    res.json(cost);
  } catch {
    res.status(500).json({ message: 'Erreur calcul coût modèle' });
  }
};

export const addComponent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const component = await prisma.modelComponent.create({
      data: { ...req.body, modelId: req.params.id },
      include: { material: true }
    });
    res.status(201).json(component);
  } catch {
    res.status(500).json({ message: 'Erreur ajout composant' });
  }
};

export const updateComponent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const component = await prisma.modelComponent.update({
      where: { id: req.params.componentId },
      data: req.body,
      include: { material: true }
    });
    res.json(component);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour composant' });
  }
};

export const deleteComponent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.modelComponent.delete({ where: { id: req.params.componentId } });
    res.json({ message: 'Composant supprimé' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression composant' });
  }
};

export const addOperation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const operation = await prisma.modelOperation.create({
      data: { ...req.body, modelId: req.params.id }
    });
    res.status(201).json(operation);
  } catch {
    res.status(500).json({ message: 'Erreur ajout opération' });
  }
};

export const updateOperation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const operation = await prisma.modelOperation.update({
      where: { id: req.params.operationId },
      data: req.body
    });
    res.json(operation);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour opération' });
  }
};

export const deleteOperation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.modelOperation.delete({ where: { id: req.params.operationId } });
    res.json({ message: 'Opération supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression opération' });
  }
};
