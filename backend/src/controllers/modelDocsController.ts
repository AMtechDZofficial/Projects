import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

// ─── Pièces de Patron ────────────────────────────────────────────────────────

export const getPatternPieces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pieces = await prisma.patternPiece.findMany({
      where: { modelId: req.params.id },
      orderBy: { sequence: 'asc' }
    });
    res.json(pieces);
  } catch {
    res.status(500).json({ message: 'Erreur chargement pièces patron' });
  }
};

export const addPatternPiece = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const piece = await prisma.patternPiece.create({
      data: { ...req.body, modelId: req.params.id }
    });
    res.status(201).json(piece);
  } catch {
    res.status(500).json({ message: 'Erreur création pièce patron' });
  }
};

export const updatePatternPiece = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const piece = await prisma.patternPiece.update({
      where: { id: req.params.pieceId },
      data: req.body
    });
    res.json(piece);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour pièce patron' });
  }
};

export const deletePatternPiece = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.patternPiece.delete({ where: { id: req.params.pieceId } });
    res.json({ message: 'Pièce supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression pièce patron' });
  }
};

// ─── Tableau de Gradation ────────────────────────────────────────────────────

export const getGradationRows = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await prisma.gradationRow.findMany({
      where: { modelId: req.params.id },
      orderBy: { sequence: 'asc' }
    });
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Erreur chargement gradation' });
  }
};

export const addGradationRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const row = await prisma.gradationRow.create({
      data: { ...req.body, modelId: req.params.id }
    });
    res.status(201).json(row);
  } catch {
    res.status(500).json({ message: 'Erreur création ligne gradation' });
  }
};

export const updateGradationRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const row = await prisma.gradationRow.update({
      where: { id: req.params.rowId },
      data: req.body
    });
    res.json(row);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour ligne gradation' });
  }
};

export const deleteGradationRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.gradationRow.delete({ where: { id: req.params.rowId } });
    res.json({ message: 'Ligne supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression ligne gradation' });
  }
};

// ─── Séances d'Essayage ──────────────────────────────────────────────────────

export const getFittingSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.fittingSession.findMany({
      where: { modelId: req.params.id },
      orderBy: { sessionNumber: 'asc' }
    });
    res.json(sessions);
  } catch {
    res.status(500).json({ message: 'Erreur chargement essayages' });
  }
};

export const upsertFittingSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionNumber, ...data } = req.body;
    const session = await prisma.fittingSession.upsert({
      where: { modelId_sessionNumber: { modelId: req.params.id, sessionNumber } },
      create: { ...data, sessionNumber, modelId: req.params.id },
      update: data
    });
    res.json(session);
  } catch {
    res.status(500).json({ message: 'Erreur sauvegarde essayage' });
  }
};

// ─── Développement Prototype ─────────────────────────────────────────────────

export const getPrototypeDev = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dev = await prisma.prototypeDev.findUnique({ where: { modelId: req.params.id } });
    res.json(dev || null);
  } catch {
    res.status(500).json({ message: 'Erreur chargement prototype' });
  }
};

export const upsertPrototypeDev = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dev = await prisma.prototypeDev.upsert({
      where: { modelId: req.params.id },
      create: { ...req.body, modelId: req.params.id },
      update: req.body
    });
    res.json(dev);
  } catch {
    res.status(500).json({ message: 'Erreur sauvegarde prototype' });
  }
};

// ─── Variantes Coloris ───────────────────────────────────────────────────────

export const getColorVariants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const variants = await prisma.colorVariant.findMany({
      where: { modelId: req.params.id },
      orderBy: { sequence: 'asc' }
    });
    res.json(variants);
  } catch {
    res.status(500).json({ message: 'Erreur chargement coloris' });
  }
};

export const addColorVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const variant = await prisma.colorVariant.create({
      data: { ...req.body, modelId: req.params.id }
    });
    res.status(201).json(variant);
  } catch {
    res.status(500).json({ message: 'Erreur création coloris' });
  }
};

export const updateColorVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const variant = await prisma.colorVariant.update({
      where: { id: req.params.variantId },
      data: req.body
    });
    res.json(variant);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour coloris' });
  }
};

export const deleteColorVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.colorVariant.delete({ where: { id: req.params.variantId } });
    res.json({ message: 'Coloris supprimé' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression coloris' });
  }
};

// ─── Détail complet modèle (documents) ───────────────────────────────────────

export const getModelFull = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const model = await prisma.coutureModel.findUnique({
      where: { id: req.params.id },
      include: {
        components: { include: { material: true } },
        operations: { orderBy: { sequence: 'asc' } },
        patternPieces: { orderBy: { sequence: 'asc' } },
        gradationRows: { orderBy: { sequence: 'asc' } },
        fittingSessions: { orderBy: { sessionNumber: 'asc' } },
        prototypeDev: true,
        colorVariants: { orderBy: { sequence: 'asc' } }
      }
    });
    if (!model) { res.status(404).json({ message: 'Modèle non trouvé' }); return; }
    res.json(model);
  } catch {
    res.status(500).json({ message: 'Erreur chargement modèle complet' });
  }
};
