import prisma from '../config/database';

export const calculatePayroll = async (employeeId: string, periodStart: Date, periodEnd: Date) => {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error('Employé non trouvé');

  const config = await prisma.workshopConfig.findFirst();
  const workDays = config?.workDaysPerMonth || 26;
  const hoursPerDay = Number(config?.hoursPerDay || 8);

  let baseSalary = 0;
  let pieceEarnings = 0;
  let chainBonus = 0;

  if (employee.paymentType === 'MENSUEL') {
    baseSalary = Number(employee.monthlyRate || 0);
  } else if (employee.paymentType === 'HORAIRE') {
    baseSalary = Number(employee.hourlyRate || 0) * workDays * hoursPerDay;
  } else if (employee.paymentType === 'PIECE') {
    // Calcul par pièce
    const productions = await prisma.pieceProduction.findMany({
      where: { employeeId, date: { gte: periodStart, lte: periodEnd } }
    });
    pieceEarnings = productions.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    baseSalary = 0;
  } else if (employee.paymentType === 'CHAINE') {
    // Base fixe + prime chaîne
    baseSalary = Number(employee.monthlyRate || 0);
    const productions = await prisma.pieceProduction.findMany({
      where: { employeeId, date: { gte: periodStart, lte: periodEnd } }
    });
    chainBonus = productions.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  }

  const totalAmount = baseSalary + pieceEarnings + chainBonus;

  return {
    employeeId,
    periodStart,
    periodEnd,
    workDays,
    hoursWorked: workDays * hoursPerDay,
    baseSalary,
    pieceEarnings,
    chainBonus,
    bonus: 0,
    deductions: 0,
    totalAmount,
    status: 'BROUILLON' as const
  };
};
