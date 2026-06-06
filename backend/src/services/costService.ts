import prisma from '../config/database';

export interface ModelCostResult {
  modelId: string;
  modelName: string;
  materialsCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  coutMinute: number;
  totalMinutes: number;
  breakdown: {
    materials: Array<{ name: string; quantity: number; unitCost: number; total: number }>;
    operations: Array<{ name: string; minutes: number; coutMinute: number; total: number }>;
  };
}

export interface CoutMinuteResult {
  coutMinute: number;
  totalSalaires: number;
  totalMinutes: number;
  numberOfOperators: number;
  workDaysPerMonth: number;
  hoursPerDay: number;
  efficiency: number;
}

export const getCoutMinute = async (): Promise<CoutMinuteResult> => {
  const config = await prisma.workshopConfig.findFirst();
  const workDays = config?.workDaysPerMonth || 26;
  const hoursPerDay = Number(config?.hoursPerDay || 8);
  const efficiency = Number(config?.targetEfficiency || 80) / 100;
  const numberOfOperators = config?.numberOfOperators || 10;

  // Total salaires mensuels des opérateurs actifs
  const employees = await prisma.employee.findMany({
    where: { isActive: true }
  });

  const totalSalaires = employees.reduce((sum, emp) => {
    return sum + Number(emp.monthlyRate || 0) + Number(emp.hourlyRate || 0) * workDays * hoursPerDay;
  }, 0);

  // Minutes disponibles par mois
  const totalMinutes = numberOfOperators * workDays * hoursPerDay * 60 * efficiency;

  const coutMinute = totalMinutes > 0 ? totalSalaires / totalMinutes : 0;

  return { coutMinute, totalSalaires, totalMinutes, numberOfOperators, workDaysPerMonth: workDays, hoursPerDay, efficiency: efficiency * 100 };
};

export const calculateModelCost = async (modelId: string): Promise<ModelCostResult> => {
  const model = await prisma.coutureModel.findUnique({
    where: { id: modelId },
    include: {
      components: { include: { material: true } },
      operations: { orderBy: { sequence: 'asc' } }
    }
  });

  if (!model) throw new Error('Modèle non trouvé');

  const config = await prisma.workshopConfig.findFirst();
  const overheadPercent = Number(config?.overheadPercent || 15) / 100;

  const { coutMinute } = await getCoutMinute();

  // Coût matières
  const materialBreakdown = model.components.map(c => ({
    name: c.material.name,
    unit: c.material.unit,
    quantity: Number(c.quantity),
    unitCost: Number(c.material.unitCost),
    total: Number(c.quantity) * Number(c.material.unitCost)
  }));
  const materialsCost = materialBreakdown.reduce((s, m) => s + m.total, 0);

  // Coût main d'oeuvre
  const totalMinutes = model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);
  const operationBreakdown = model.operations.map(op => ({
    name: op.name,
    machineType: op.machineType || '',
    minutes: Number(op.standardMinutes),
    coutMinute,
    total: Number(op.standardMinutes) * coutMinute
  }));
  const laborCost = totalMinutes * coutMinute;

  const subtotal = materialsCost + laborCost;
  const overheadCost = subtotal * overheadPercent;
  const totalCost = subtotal + overheadCost;

  return {
    modelId,
    modelName: model.name,
    materialsCost,
    laborCost,
    overheadCost,
    totalCost,
    coutMinute,
    totalMinutes,
    breakdown: { materials: materialBreakdown, operations: operationBreakdown }
  };
};
