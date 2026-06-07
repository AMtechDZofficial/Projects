import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getDefectTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const types = await prisma.defectType.findMany({ where: { isActive: true }, orderBy: [{ severity: 'desc' }, { name: 'asc' }] });
    res.json(types);
  } catch { res.status(500).json({ message: 'Erreur chargement types défauts' }); }
};

export const createDefectType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, name, severity, description } = req.body;
    const dt = await prisma.defectType.create({ data: { code, name, severity, description } });
    res.status(201).json(dt);
  } catch { res.status(500).json({ message: 'Erreur création type défaut' }); }
};

export const getQualityChecks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, checkType, status } = req.query;
    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = orderId;
    if (checkType) where.checkType = checkType;
    if (status) where.status = status;
    const checks = await prisma.qualityCheck.findMany({
      where,
      include: {
        order: { include: { model: { select: { name: true, code: true } } } },
        operation: { select: { name: true, sequence: true } },
        defects: { include: { defectType: true } }
      },
      orderBy: { checkDate: 'desc' }
    });
    res.json(checks);
  } catch { res.status(500).json({ message: 'Erreur chargement contrôles' }); }
};

export const createQualityCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, operationId, checkType, quantityChecked, quantityPassed, quantityRework, quantityRejected, notes, defects } = req.body;
    const fpY = quantityChecked > 0 ? (quantityPassed / quantityChecked) * 100 : 0;
    const qcStatus = fpY >= 95 ? 'VALIDE' : fpY < 70 ? 'BLOQUE' : 'EN_ATTENTE';
    const check = await prisma.qualityCheck.create({
      data: {
        orderId,
        operationId: operationId || null,
        checkType,
        checkedById: req.user!.id,
        quantityChecked,
        quantityPassed,
        quantityRework: quantityRework || 0,
        quantityRejected: quantityRejected || 0,
        firstPassYield: fpY,
        status: qcStatus,
        notes,
        defects: {
          create: ((defects || []) as { defectTypeId: string; count: number; notes?: string }[]).map(d => ({
            defectTypeId: d.defectTypeId,
            quantity: d.count,
            notes: d.notes
          }))
        }
      },
      include: {
        order: { include: { model: { select: { name: true } } } },
        defects: { include: { defectType: true } }
      }
    });
    res.status(201).json(check);
  } catch { res.status(500).json({ message: 'Erreur création contrôle qualité' }); }
};

export const getQualityStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const checks = await prisma.qualityCheck.findMany({
      include: { defects: { include: { defectType: true } } },
      orderBy: { checkDate: 'desc' },
      take: 100
    });
    const avgFPY = checks.length ? checks.reduce((s, c) => s + Number(c.firstPassYield), 0) / checks.length : 0;
    const blocked = checks.filter(c => c.status === 'BLOQUE').length;
    const defectCounts: Record<string, number> = {};
    checks.forEach(c => c.defects.forEach(d => { defectCounts[d.defectType.name] = (defectCounts[d.defectType.name] || 0) + d.quantity; }));
    const topDefects = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    res.json({ avgFPY, totalChecks: checks.length, blocked, topDefects });
  } catch { res.status(500).json({ message: 'Erreur stats qualité' }); }
};
