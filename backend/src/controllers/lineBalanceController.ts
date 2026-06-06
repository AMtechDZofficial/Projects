import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { calculateLineBalance } from '../services/lineBalanceService';

export const computeLineBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { modelId, targetOutput, hoursPerDay, efficiency } = req.body;

    const model = await prisma.coutureModel.findUnique({
      where: { id: modelId },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    if (!model) { res.status(404).json({ message: 'Modèle non trouvé' }); return; }

    const config = await prisma.workshopConfig.findFirst();
    const effectiveHours = hoursPerDay || Number(config?.hoursPerDay || 8);
    const effectiveEfficiency = (efficiency || Number(config?.targetEfficiency || 80)) / 100;
    const availableMinutes = effectiveHours * 60;

    const result = calculateLineBalance(
      model.operations.map(op => ({
        id: op.id,
        name: op.name,
        standardMinutes: Number(op.standardMinutes),
        sequence: op.sequence,
        machineType: op.machineType
      })),
      Number(targetOutput),
      availableMinutes,
      effectiveEfficiency
    );

    res.json({ model: { id: model.id, name: model.name, code: model.code }, ...result });
  } catch {
    res.status(500).json({ message: 'Erreur calcul équilibrage' });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const assignments = await prisma.operatorAssignment.findMany({
      where: { orderId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, position: true } },
        operation: { select: { id: true, name: true, sequence: true, machineType: true, standardMinutes: true } },
        machine: { select: { id: true, code: true, name: true, type: true } }
      },
      orderBy: [{ operation: { sequence: 'asc' } }]
    });
    res.json(assignments);
  } catch {
    res.status(500).json({ message: 'Erreur chargement affectations' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, employeeId, operationId, machineId, targetQuantity, shiftType, notes, date } = req.body;
    const assignment = await prisma.operatorAssignment.create({
      data: {
        orderId,
        employeeId,
        operationId,
        machineId: machineId || null,
        targetQuantity: targetQuantity || 0,
        shiftType: shiftType || 'JOURNEE',
        notes,
        date: date ? new Date(date) : new Date()
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
        operation: { select: { name: true, sequence: true, machineType: true } },
        machine: { select: { code: true, name: true, type: true } }
      }
    });
    res.status(201).json(assignment);
  } catch {
    res.status(500).json({ message: 'Erreur création affectation' });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { machineId, targetQuantity, actualQuantity, shiftType, notes } = req.body;
    const assignment = await prisma.operatorAssignment.update({
      where: { id: req.params.id },
      data: {
        machineId: machineId !== undefined ? (machineId || null) : undefined,
        targetQuantity,
        actualQuantity,
        shiftType,
        notes
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        operation: { select: { name: true, sequence: true } },
        machine: { select: { code: true, name: true } }
      }
    });
    res.json(assignment);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour affectation' });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.operatorAssignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Affectation supprimée' });
  } catch {
    res.status(500).json({ message: 'Erreur suppression affectation' });
  }
};
