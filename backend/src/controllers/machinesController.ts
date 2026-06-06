import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getMachines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status, search } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    const machines = await prisma.machine.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });
    res.json(machines);
  } catch {
    res.status(500).json({ message: 'Erreur chargement machines' });
  }
};

export const getMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            employee: { select: { firstName: true, lastName: true } },
            operation: { select: { name: true } },
            order: { select: { orderNumber: true } }
          },
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });
    if (!machine) { res.status(404).json({ message: 'Machine non trouvée' }); return; }
    res.json(machine);
  } catch {
    res.status(500).json({ message: 'Erreur chargement machine' });
  }
};

export const createMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const machine = await prisma.machine.create({ data: req.body });
    res.status(201).json(machine);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(400).json({ message: 'Code machine déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur création machine' });
    }
  }
};

export const updateMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const machine = await prisma.machine.update({ where: { id: req.params.id }, data: req.body });
    res.json(machine);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour machine' });
  }
};

export const updateMachineStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const machine = await prisma.machine.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(machine);
  } catch {
    res.status(500).json({ message: 'Erreur mise à jour statut' });
  }
};

export const deleteMachine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.machine.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Machine désactivée' });
  } catch {
    res.status(500).json({ message: 'Erreur désactivation machine' });
  }
};

export const getMachineStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, disponible, enService, enPanne, maintenance] = await Promise.all([
      prisma.machine.count({ where: { isActive: true } }),
      prisma.machine.count({ where: { isActive: true, status: 'DISPONIBLE' } }),
      prisma.machine.count({ where: { isActive: true, status: 'EN_SERVICE' } }),
      prisma.machine.count({ where: { isActive: true, status: 'EN_PANNE' } }),
      prisma.machine.count({ where: { isActive: true, status: 'MAINTENANCE' } })
    ]);
    res.json({ total, disponible, enService, enPanne, maintenance });
  } catch {
    res.status(500).json({ message: 'Erreur statistiques machines' });
  }
};
