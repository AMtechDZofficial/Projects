import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, month, year, employeeId } = req.query;
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (date) {
      const d = new Date(date as string);
      where.date = d;
    } else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);
      where.date = { gte: start, lte: end };
    }
    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, position: true } } },
      orderBy: [{ date: 'asc' }, { employee: { lastName: 'asc' } }]
    });
    res.json(records);
  } catch { res.status(500).json({ message: 'Erreur chargement présences' }); }
};

export const upsertAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date, status, arrivedAt, leftAt, hoursWorked, notes } = req.body;
    const dateObj = new Date(date);
    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      update: { status, arrivedAt, leftAt, hoursWorked, notes },
      create: { employeeId, date: dateObj, status, arrivedAt, leftAt, hoursWorked, notes },
      include: { employee: { select: { firstName: true, lastName: true } } }
    });
    res.json(record);
  } catch { res.status(500).json({ message: 'Erreur mise à jour présence' }); }
};

export const bulkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, records } = req.body as { date: string; records: { employeeId: string; status: string }[] };
    const dateObj = new Date(date);
    const ops = records.map(r => prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: r.employeeId, date: dateObj } },
      update: { status: r.status as 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'REPOS' | 'MISSION' },
      create: { employeeId: r.employeeId, date: dateObj, status: r.status as 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'REPOS' | 'MISSION' }
    }));
    await prisma.$transaction(ops);
    res.json({ message: `${records.length} présences enregistrées` });
  } catch { res.status(500).json({ message: 'Erreur pointage groupé' }); }
};

export const getAttendanceSummary = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [presents, absents, totalEmployees] = await Promise.all([
      prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: today, status: { in: ['ABSENT', 'MALADIE'] } } }),
      prisma.employee.count({ where: { isActive: true } })
    ]);
    const nonPointed = totalEmployees - presents - absents;
    const dateStr = today.toISOString().split('T')[0];
    res.json({ presents, absents, nonPointed, totalEmployees, date: dateStr });
  } catch { res.status(500).json({ message: 'Erreur résumé présences' }); }
};
