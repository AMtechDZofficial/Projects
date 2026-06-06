import prisma from '../config/database';

export const WORKSHOP_SYSTEM_PROMPT = `Tu es un expert en gestion d'atelier de confection textile, spécialisé dans l'industrie de la couture en Algérie.
Tu maîtrises parfaitement :
- L'organisation des ateliers de confection (chaînes de production, postes de travail)
- L'équilibrage de ligne et l'optimisation de la production
- Le calcul du coût-minute et la rentabilité des modèles
- La gestion des matières premières et des stocks
- La paie des opérateurs (à la pièce, à la chaîne, horaire, mensuel)
- Les machines de couture (machine plate, surjeteuse, boutonnière, etc.)
- Les opérations de confection (assemblage, surpiqûre, col, poignets, finitions, etc.)

Réponds toujours en français. Sois précis, pratique et donne des recommandations concrètes.
Quand tu analyses des données de l'atelier, base-toi sur les chiffres fournis dans le contexte.
Format tes réponses avec des sections claires. Utilise des tableaux quand c'est pertinent.`;

export async function buildWorkshopContext(): Promise<string> {
  try {
    const [config, employees, models, orders, materials, coutMinuteData] = await Promise.all([
      prisma.workshopConfig.findFirst(),
      prisma.employee.findMany({ where: { isActive: true }, select: { firstName: true, lastName: true, position: true, paymentType: true, monthlyRate: true, hourlyRate: true } }),
      prisma.coutureModel.findMany({
        where: { isActive: true },
        include: { operations: { orderBy: { sequence: 'asc' } }, _count: { select: { components: true } } },
        take: 20
      }),
      prisma.productionOrder.findMany({
        where: { status: { in: ['EN_ATTENTE', 'EN_COURS'] } },
        include: { model: { select: { name: true, code: true } } },
        take: 10
      }),
      prisma.material.findMany({
        where: { isActive: true },
        select: { name: true, category: true, stockQuantity: true, minimumStock: true, unitCost: true, unit: true },
        take: 30
      }),
      prisma.workshopConfig.findFirst()
    ]);

    const totalSalaires = employees.reduce((sum, emp) => {
      return sum + Number(emp.monthlyRate || 0) + Number(emp.hourlyRate || 0) * Number(config?.workDaysPerMonth || 26) * Number(config?.hoursPerDay || 8);
    }, 0);
    const totalMinutes = employees.length * Number(config?.workDaysPerMonth || 26) * Number(config?.hoursPerDay || 8) * 60 * (Number(config?.targetEfficiency || 80) / 100);
    const coutMinute = totalMinutes > 0 ? totalSalaires / totalMinutes : 0;

    const lowStock = materials.filter(m => Number(m.stockQuantity) <= Number(m.minimumStock));

    let context = `\n\n=== CONTEXTE ATELIER ===\n`;
    context += `Configuration: ${config?.name || 'Atelier'}, ${employees.length} opérateurs actifs, ${Number(config?.hoursPerDay || 8)}h/jour, ${config?.workDaysPerMonth || 26} jours/mois, efficacité cible ${config?.targetEfficiency || 80}%\n`;
    context += `Coût-minute actuel: ${coutMinute.toFixed(4)} DZD/min\n`;
    context += `Masse salariale mensuelle: ${totalSalaires.toLocaleString('fr-DZ')} DZD\n\n`;

    context += `Opérateurs (${employees.length}):\n`;
    employees.slice(0, 15).forEach(e => {
      context += `- ${e.firstName} ${e.lastName} | ${e.position} | ${e.paymentType} | ${e.monthlyRate ? Number(e.monthlyRate).toLocaleString('fr-DZ') + ' DZD/mois' : e.hourlyRate ? Number(e.hourlyRate) + ' DZD/h' : 'N/A'}\n`;
    });

    context += `\nModèles actifs (${models.length}):\n`;
    models.slice(0, 10).forEach(m => {
      const totalTMO = m.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);
      context += `- ${m.code} ${m.name} | ${m.category} | TMO total: ${totalTMO} min | ${m._count.components} matières | ${m.operations.length} opérations\n`;
      if (m.operations.length > 0) {
        const ops = m.operations.map(op => `${op.sequence}.${op.name}(${Number(op.standardMinutes)}min${op.machineType ? '/' + op.machineType : ''})`).join(', ');
        context += `  Opérations: ${ops}\n`;
      }
    });

    if (orders.length > 0) {
      context += `\nOrdres de fabrication en cours:\n`;
      orders.forEach(o => {
        context += `- OF${o.orderNumber}: ${o.model.name} | ${o.quantity} pièces | ${o.status}\n`;
      });
    }

    if (lowStock.length > 0) {
      context += `\nAlertes stock (${lowStock.length} matières sous seuil):\n`;
      lowStock.slice(0, 8).forEach(m => {
        context += `- ${m.name}: ${Number(m.stockQuantity)} ${m.unit} (min: ${Number(m.minimumStock)})\n`;
      });
    }

    context += `=== FIN CONTEXTE ===\n`;
    return context;
  } catch {
    return '';
  }
}
