import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentType, search } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (paymentType) where.paymentType = paymentType;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });
    res.json(employees);
  } catch {
    res.status(500).json({ message: 'Erreur chargement employés' });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        pieceRates: { include: { operation: true }, where: { isActive: true } },
        payrolls: { orderBy: { periodStart: 'desc' }, take: 12 }
      }
    });
    if (!employee) { res.status(404).json({ message: 'Employé non trouvé' }); return; }
    res.json(employee);
  } catch {
    res.status(500).json({ message: 'Erreur chargement employé' });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await prisma.employee.create({ data: req.body });
    res.status(201).json(employee);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(400).json({ message: 'Matricule déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur création employé' });
    }
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    res.json(employee);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour employé' });
  }
};

export const deactivateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.employee.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Employé désactivé' });
  } catch {
    res.status(500).json({ message: 'Erreur désactivation employé' });
  }
};

export const getPieceRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rates = await prisma.pieceRate.findMany({
      where: { employeeId: req.params.id, isActive: true },
      include: { operation: { include: { model: { select: { name: true } } } } }
    });
    res.json(rates);
  } catch {
    res.status(500).json({ message: 'Erreur chargement tarifs' });
  }
};

export const addPieceRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rate = await prisma.pieceRate.create({
      data: { ...req.body, employeeId: req.params.id }
    });
    res.status(201).json(rate);
  } catch {
    res.status(500).json({ message: 'Erreur ajout tarif pièce' });
  }
};

export const addPieceProduction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { modelId, operationId, quantity, pieceRate, date, notes } = req.body;
    const totalAmount = quantity * pieceRate;
    const production = await prisma.pieceProduction.create({
      data: {
        employeeId: req.params.id,
        modelId,
        operationId,
        quantity,
        pieceRate,
        totalAmount,
        date: date ? new Date(date) : new Date(),
        notes
      }
    });
    res.status(201).json(production);
  } catch {
    res.status(500).json({ message: 'Erreur enregistrement production' });
  }
};

export const getEmployeeProductions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const productions = await prisma.pieceProduction.findMany({
      where: {
        employeeId: req.params.id,
        ...(startDate && endDate ? {
          date: { gte: new Date(startDate as string), lte: new Date(endDate as string) }
        } : {})
      },
      include: {
        model: { select: { name: true, code: true } },
        operation: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(productions);
  } catch {
    res.status(500).json({ message: 'Erreur chargement productions' });
  }
};
