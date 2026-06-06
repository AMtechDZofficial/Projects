export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

export interface WorkshopConfig {
  id: string;
  name: string;
  workDaysPerMonth: number;
  hoursPerDay: number;
  overheadPercent: number;
  numberOfOperators: number;
  targetEfficiency: number;
  currency: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
}

export type MaterialCategory = 'TISSU' | 'FIL' | 'BOUTON' | 'FERMETURE' | 'DOUBLURE' | 'ELASTIQUE' | 'DENTELLE' | 'BRODERIE' | 'EMBALLAGE' | 'AUTRE';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  unitCost: number;
  stockQuantity: number;
  minimumStock: number;
  supplierId?: string;
  supplier?: Supplier;
  isActive: boolean;
}

export interface MaterialMovement {
  id: string;
  materialId: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference?: string;
  notes?: string;
  date: string;
}

export interface ModelComponent {
  id: string;
  modelId: string;
  materialId: string;
  material: Material;
  quantity: number;
  unit?: string;
}

export interface ModelOperation {
  id: string;
  modelId: string;
  name: string;
  description?: string;
  machineType?: string;
  standardMinutes: number;
  sequence: number;
}

export interface CoutureModel {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  salePrice?: number;
  isActive: boolean;
  components: ModelComponent[];
  operations: ModelOperation[];
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  modelId: string;
  model: { name: string; code: string };
  quantity: number;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export interface SemiFinishedStock {
  id: string;
  modelId: string;
  model: { name: string; code: string };
  operationId: string;
  operation: { name: string; sequence: number };
  quantity: number;
  date: string;
}

export interface FinishedStock {
  id: string;
  modelId: string;
  model: { name: string; code: string; category: string };
  quantity: number;
  productionCost?: number;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  reference?: string;
  date: string;
}

export type PaymentType = 'PIECE' | 'CHAINE' | 'HORAIRE' | 'MENSUEL';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: string;
  paymentType: PaymentType;
  hourlyRate?: number;
  monthlyRate?: number;
  phone?: string;
  hireDate: string;
  isActive: boolean;
}

export interface PieceRate {
  id: string;
  employeeId: string;
  operationId?: string;
  operation?: ModelOperation & { model: { name: string } };
  operationName: string;
  rate: number;
  effectiveDate: string;
}

export interface PieceProduction {
  id: string;
  employeeId: string;
  modelId: string;
  model: { name: string; code: string };
  operationId?: string;
  operation?: { name: string };
  quantity: number;
  pieceRate: number;
  totalAmount: number;
  date: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employee: { firstName: string; lastName: string; employeeId: string; paymentType: PaymentType };
  periodStart: string;
  periodEnd: string;
  workDays: number;
  hoursWorked: number;
  baseSalary: number;
  pieceEarnings: number;
  chainBonus: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  status: 'BROUILLON' | 'VALIDE' | 'PAYE';
  paidAt?: string;
}

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

export interface DashboardStats {
  totalMaterials: number;
  lowStockCount: number;
  activeModels: number;
  pendingOrders: number;
  activeEmployees: number;
  unpaidPayrolls: number;
  coutMinute: number;
  finishedStockCount: number;
}
