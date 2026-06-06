import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const materials = await prisma.material.findMany({
      where,
      include: { supplier: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(materials);
  } catch {
    res.status(500).json({ message: 'Erreur chargement matières' });
  }
};

export const getMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        movements: { orderBy: { date: 'desc' }, take: 20 },
        modelComponents: { include: { model: { select: { name: true, code: true } } } }
      }
    });
    if (!material) { res.status(404).json({ message: 'Matière non trouvée' }); return; }
    res.json(material);
  } catch {
    res.status(500).json({ message: 'Erreur chargement matière' });
  }
};

export const createMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const material = await prisma.material.create({ data: req.body });
    res.status(201).json(material);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(400).json({ message: 'Code déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur création matière' });
    }
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const material = await prisma.material.update({ where: { id: req.params.id }, data: req.body });
    res.json(material);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour matière' });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.material.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Matière désactivée' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression matière' });
  }
};

export const getMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await prisma.materialMovement.findMany({
      where: { materialId: req.params.id },
      orderBy: { date: 'desc' }
    });
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Erreur chargement mouvements' });
  }
};

export const addMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, quantity, unitCost, reference, notes, date } = req.body;
    const totalCost = quantity * unitCost;

    const movement = await prisma.materialMovement.create({
      data: {
        materialId: req.params.id,
        type,
        quantity,
        unitCost,
        totalCost,
        reference,
        notes,
        date: date ? new Date(date) : new Date()
      }
    });

    // Mise à jour du stock
    const delta = type === 'ENTREE' ? Number(quantity) : type === 'SORTIE' ? -Number(quantity) : 0;
    await prisma.material.update({
      where: { id: req.params.id },
      data: {
        stockQuantity: { increment: delta },
        ...(type === 'ENTREE' ? { unitCost } : {})
      }
    });

    res.status(201).json(movement);
  } catch {
    res.status(500).json({ message: 'Erreur ajout mouvement' });
  }
};

export const getLowStock = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materials = await prisma.material.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: prisma.material.fields.minimumStock }
      }
    });
    // Fallback: fetch and filter manually since Prisma doesn't support field comparison directly
    const all = await prisma.material.findMany({ where: { isActive: true } });
    const low = all.filter(m => Number(m.stockQuantity) <= Number(m.minimumStock));
    res.json(low);
  } catch {
    res.status(500).json({ message: 'Erreur stock minimum' });
  }
};
