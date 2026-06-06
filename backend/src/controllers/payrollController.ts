import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { calculatePayroll } from '../services/payrollService';

export const getPayrolls = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period, status, employeeId } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const payrolls = await prisma.payroll.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true, paymentType: true } } },
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(payrolls);
  } catch {
    res.status(500).json({ message: 'Erreur chargement paies' });
  }
};

export const calculatePayrollHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, periodStart, periodEnd } = req.body;
    const result = await calculatePayroll(employeeId, new Date(periodStart), new Date(periodEnd));
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Erreur calcul paie' });
  }
};

export const createPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payroll = await prisma.payroll.create({
      data: req.body,
      include: { employee: { select: { firstName: true, lastName: true } } }
    });
    res.status(201).json(payroll);
  } catch {
    res.status(500).json({ message: 'Erreur création bulletin de paie' });
  }
};

export const updatePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payroll = await prisma.payroll.update({ where: { id: req.params.id }, data: req.body });
    res.json(payroll);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour paie' });
  }
};

export const validatePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status: 'VALIDE' }
    });
    res.json(payroll);
  } catch {
    res.status(500).json({ message: 'Erreur validation paie' });
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status: 'PAYE', paidAt: new Date() }
    });
    res.json(payroll);
  } catch {
    res.status(500).json({ message: 'Erreur marquage paiement' });
  }
};

export const getPayrollSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { periodStart, periodEnd } = req.query;
    const where = periodStart && periodEnd ? {
      periodStart: { gte: new Date(periodStart as string) },
      periodEnd: { lte: new Date(periodEnd as string) }
    } : {};

    const payrolls = await prisma.payroll.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, paymentType: true } } }
    });

    const summary = {
      totalPayrolls: payrolls.length,
      totalAmount: payrolls.reduce((s, p) => s + Number(p.totalAmount), 0),
      totalPieceEarnings: payrolls.reduce((s, p) => s + Number(p.pieceEarnings), 0),
      totalBaseSalary: payrolls.reduce((s, p) => s + Number(p.baseSalary), 0),
      byStatus: {
        BROUILLON: payrolls.filter(p => p.status === 'BROUILLON').length,
        VALIDE: payrolls.filter(p => p.status === 'VALIDE').length,
        PAYE: payrolls.filter(p => p.status === 'PAYE').length
      }
    };
    res.json({ payrolls, summary });
  } catch {
    res.status(500).json({ message: 'Erreur résumé paie' });
  }
};
