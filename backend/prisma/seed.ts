import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@couture.dz' },
    update: {},
    create: { email: 'admin@couture.dz', password: hashedPassword, name: 'Administrateur', role: 'ADMIN' }
  });

  // Config atelier
  await prisma.workshopConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Atelier Principal',
      workDaysPerMonth: 26,
      hoursPerDay: 8,
      overheadPercent: 15,
      numberOfOperators: 20,
      targetEfficiency: 75,
      currency: 'DZD'
    }
  });

  // Fournisseurs
  const supp1 = await prisma.supplier.upsert({
    where: { code: 'FOURN-001' },
    update: {},
    create: { code: 'FOURN-001', name: 'Textiles Algérie SARL', contact: 'Mohamed', phone: '0555123456', email: 'textiles@dz.com' }
  });

  // Matières premières
  const tissu = await prisma.material.upsert({
    where: { code: 'TIS-001' },
    update: {},
    create: {
      code: 'TIS-001', name: 'Tissu Coton Blanc', category: 'TISSU',
      unit: 'mètre', unitCost: 450, stockQuantity: 150, minimumStock: 30, supplierId: supp1.id
    }
  });

  const fil = await prisma.material.upsert({
    where: { code: 'FIL-001' },
    update: {},
    create: {
      code: 'FIL-001', name: 'Fil Polyester Blanc', category: 'FIL',
      unit: 'bobine', unitCost: 80, stockQuantity: 50, minimumStock: 10
    }
  });

  const bouton = await prisma.material.upsert({
    where: { code: 'BOU-001' },
    update: {},
    create: {
      code: 'BOU-001', name: 'Bouton Blanc 12mm', category: 'BOUTON',
      unit: 'pièce', unitCost: 12, stockQuantity: 500, minimumStock: 100
    }
  });

  // Modèle de vêtement
  const chemise = await prisma.coutureModel.upsert({
    where: { code: 'MOD-CHM-001' },
    update: {},
    create: {
      code: 'MOD-CHM-001',
      name: 'Chemise Homme Classique',
      category: 'Chemise',
      description: 'Chemise homme col classique, manches longues',
      salePrice: 2500,
      components: {
        create: [
          { materialId: tissu.id, quantity: 1.8, unit: 'mètre' },
          { materialId: fil.id, quantity: 2, unit: 'bobine' },
          { materialId: bouton.id, quantity: 8, unit: 'pièce' }
        ]
      },
      operations: {
        create: [
          { name: 'Coupe', machineType: 'Table de coupe', standardMinutes: 8, sequence: 1 },
          { name: 'Assemblage col', machineType: 'Machine plate', standardMinutes: 6, sequence: 2 },
          { name: 'Assemblage manches', machineType: 'Machine plate', standardMinutes: 10, sequence: 3 },
          { name: 'Assemblage corps', machineType: 'Machine plate', standardMinutes: 12, sequence: 4 },
          { name: 'Boutonnières', machineType: 'Machine boutonnière', standardMinutes: 5, sequence: 5 },
          { name: 'Couture boutons', machineType: 'Machine bouton', standardMinutes: 4, sequence: 6 },
          { name: 'Repassage & contrôle', machineType: 'Fer repassage', standardMinutes: 5, sequence: 7 }
        ]
      }
    }
  });

  // Employés
  const emp1 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-001' },
    update: {},
    create: {
      employeeId: 'EMP-001', firstName: 'Fatima', lastName: 'Benali',
      position: 'Opératrice machine plate', department: 'Couture',
      paymentType: 'PIECE', phone: '0661234567',
      hireDate: new Date('2022-01-15')
    }
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeId: 'EMP-002' },
    update: {},
    create: {
      employeeId: 'EMP-002', firstName: 'Ahmed', lastName: 'Khedim',
      position: 'Responsable coupe', department: 'Coupe',
      paymentType: 'MENSUEL', monthlyRate: 45000, phone: '0771234567',
      hireDate: new Date('2020-03-01')
    }
  });

  // Tarifs pièce pour Fatima
  const ops = await prisma.modelOperation.findMany({ where: { modelId: chemise.id } });
  for (const op of ops) {
    if (op.name === 'Assemblage corps' || op.name === 'Assemblage manches') {
      await prisma.pieceRate.create({
        data: { employeeId: emp1.id, operationId: op.id, operationName: op.name, rate: 35 }
      });
    }
  }

  // Ordre de fabrication exemple
  await prisma.productionOrder.upsert({
    where: { orderNumber: 'OF-2026-0001' },
    update: {},
    create: {
      orderNumber: 'OF-2026-0001',
      modelId: chemise.id,
      quantity: 100,
      status: 'EN_COURS',
      startDate: new Date('2026-06-01')
    }
  });

  console.log('✅ Base de données initialisée avec succès!');
  console.log('🔑 Admin: admin@couture.dz / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
