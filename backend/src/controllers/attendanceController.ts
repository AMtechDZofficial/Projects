import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, month, year, employeeId } = req.query;
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
        res.status(400).json({ message: 'Format de date invalide (YYYY-MM-DD)' });
        return;
      }
      where.date = new Date(date as string);
    } else if (month && year) {
      const m = Number(month);
      const y = Number(year);
      if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
        res.status(400).json({ message: 'Mois ou année invalide' });
        return;
      }
      where.date = { gte: new Date(`${y}-${String(m).padStart(2, '0')}-01`), lte: new Date(`${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`) };
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
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDate = new Date(dateStr);
    const [presents, absents, totalEmployees] = await Promise.all([
      prisma.attendance.count({ where: { date: todayDate, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: todayDate, status: { in: ['ABSENT', 'MALADIE'] } } }),
      prisma.employee.count({ where: { isActive: true } })
    ]);
    const nonPointed = totalEmployees - presents - absents;
    res.json({ presents, absents, nonPointed, totalEmployees, date: dateStr });
  } catch { res.status(500).json({ message: 'Erreur résumé présences' }); }
};
