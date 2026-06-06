import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getSchedule = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.productionSchedule.findMany({
      include: {
        order: {
          include: {
            model: { select: { name: true, code: true } },
            clientOrder: { include: { client: { select: { name: true } } } }
          }
        }
      },
      orderBy: { plannedStart: 'asc' }
    });
    res.json(schedules);
  } catch { res.status(500).json({ message: 'Erreur chargement planning' }); }
};

export const calculateAndSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, plannedStart, priority } = req.body;
    const [order, config] = await Promise.all([
      prisma.productionOrder.findUnique({
        where: { id: orderId },
        include: { model: { include: { operations: true } } }
      }),
      prisma.workshopConfig.findFirst()
    ]);
    if (!order) { res.status(404).json({ message: 'Ordre non trouvé' }); return; }

    const totalTMO = order.model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);
    const nbOperators = Number(config?.numberOfOperators || 10);
    const hoursPerDay = Number(config?.hoursPerDay || 8);
    const efficiency = Number(config?.targetEfficiency || 80) / 100;
    const minutesPerDay = nbOperators * hoursPerDay * 60 * efficiency;
    const estimatedDays = (order.quantity * totalTMO) / minutesPerDay;

    const startDate = plannedStart ? new Date(plannedStart) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.ceil(estimatedDays));

    const schedule = await prisma.productionSchedule.upsert({
      where: { orderId },
      update: { plannedStart: startDate, plannedEnd: endDate, estimatedDays, priority: priority || 0 },
      create: { orderId, plannedStart: startDate, plannedEnd: endDate, estimatedDays, priority: priority || 0 },
      include: { order: { include: { model: { select: { name: true, code: true } } } } }
    });
    res.json(schedule);
  } catch { res.status(500).json({ message: 'Erreur planification' }); }
};

export const getCapacityAnalysis = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.workshopConfig.findFirst();
    const nbOperators = Number(config?.numberOfOperators || 10);
    const hoursPerDay = Number(config?.hoursPerDay || 8);
    const efficiency = Number(config?.targetEfficiency || 80) / 100;
    const minutesPerDay = nbOperators * hoursPerDay * 60 * efficiency;
    const workDaysPerMonth = Number(config?.workDaysPerMonth || 26);
    const capacityMonth = minutesPerDay * workDaysPerMonth;

    const pendingOrders = await prisma.productionOrder.findMany({
      where: { status: { in: ['EN_ATTENTE', 'EN_COURS'] } },
      include: { model: { include: { operations: true } }, schedule: true, clientOrder: { include: { client: { select: { name: true } } } } }
    });

    const ordersWithLoad = pendingOrders.map(o => {
      const totalTMO = o.model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);
      const totalMinutes = o.quantity * totalTMO;
      const estimatedDays = totalMinutes / minutesPerDay;
      const clientOrderData = o.clientOrder as { deliveryDate?: Date; client?: { name: string } } | null;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        modelName: o.model.name,
        quantity: o.quantity,
        status: o.status,
        totalMinutes,
        estimatedDays,
        plannedStart: o.schedule?.plannedStart,
        plannedEnd: o.schedule?.plannedEnd,
        clientName: clientOrderData?.client?.name,
        deliveryDate: clientOrderData?.deliveryDate
      };
    });

    const totalLoad = ordersWithLoad.reduce((s, o) => s + o.totalMinutes, 0);
    const chargeRate = capacityMonth > 0 ? (totalLoad / capacityMonth) * 100 : 0;

    res.json({ capacityMonth, totalLoad, chargeRate, minutesPerDay, orders: ordersWithLoad });
  } catch { res.status(500).json({ message: 'Erreur analyse capacité' }); }
};

export const updateSchedulePriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { priority, plannedStart, plannedEnd } = req.body;
    const schedule = await prisma.productionSchedule.update({
      where: { id: req.params.id },
      data: {
        priority,
        plannedStart: plannedStart ? new Date(plannedStart) : undefined,
        plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined
      }
    });
    res.json(schedule);
  } catch { res.status(500).json({ message: 'Erreur mise à jour planning' }); }
};
