import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    const clients = await prisma.client.findMany({ where, orderBy: { name: 'asc' } });
    res.json(clients);
  } catch { res.status(500).json({ message: 'Erreur chargement clients' }); }
};

export const getClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        orders: { orderBy: { orderDate: 'desc' }, take: 10, include: { lines: { include: { model: { select: { name: true, code: true } } } } } }
      }
    });
    if (!client) { res.status(404).json({ message: 'Client non trouvé' }); return; }
    res.json(client);
  } catch { res.status(500).json({ message: 'Erreur chargement client' }); }
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.create({ data: req.body });
    res.status(201).json(client);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') { res.status(400).json({ message: 'Code client déjà utilisé' }); }
    else { res.status(500).json({ message: 'Erreur création client' }); }
  }
};

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(client);
  } catch { res.status(500).json({ message: 'Erreur mise à jour client' }); }
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.client.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Client désactivé' });
  } catch { res.status(500).json({ message: 'Erreur désactivation client' }); }
};

export const getClientStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, active, withOrders] = await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({ where: { isActive: true, orders: { some: { status: { not: 'ANNULEE' } } } } })
    ]);
    res.json({ total, active, withOrders });
  } catch { res.status(500).json({ message: 'Erreur stats clients' }); }
};
