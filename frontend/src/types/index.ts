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

export type MachineType = 'MACHINE_PLATE' | 'SURJETEUSE' | 'BOUTONNIERE' | 'MACHINE_BOUTON' | 'TABLE_COUPE' | 'FER_REPASSAGE' | 'MACHINE_CANON' | 'BRODERIE' | 'POINT_INVISIBLE' | 'PRESSE' | 'AUTRE';
export type MachineStatus = 'DISPONIBLE' | 'EN_SERVICE' | 'EN_PANNE' | 'MAINTENANCE';
export type ShiftType = 'MATIN' | 'APRES_MIDI' | 'JOURNEE';

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  brand?: string;
  model?: string;
  status: MachineStatus;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface OperatorAssignment {
  id: string;
  orderId: string;
  employeeId: string;
  employee: { id: string; firstName: string; lastName: string; employeeId: string; position: string };
  operationId: string;
  operation: { id: string; name: string; sequence: number; machineType?: string; standardMinutes: number };
  machineId?: string;
  machine?: { id: string; code: string; name: string; type: MachineType };
  targetQuantity: number;
  actualQuantity: number;
  shiftType: ShiftType;
  date: string;
  notes?: string;
}

export interface LineStation {
  operationId: string;
  operationName: string;
  tmo: number;
  requiredOperators: number;
  machineType?: string;
  utilization: number;
  bottleneck: boolean;
}

export interface LineBalancingResult {
  model: { id: string; name: string; code: string };
  cycleTime: number;
  targetOutput: number;
  availableMinutes: number;
  totalTMO: number;
  totalOperators: number;
  lineEfficiency: number;
  bottleneckOperation: string;
  stations: LineStation[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Commercial ───────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  rc?: string;
  nif?: string;
  paymentTerms: number;
  isActive: boolean;
  createdAt: string;
}

export type ClientOrderStatus = 'DEVIS' | 'CONFIRMEE' | 'EN_PRODUCTION' | 'PARTIELLEMENT_LIVREE' | 'LIVREE' | 'FACTUREE' | 'PAYEE' | 'ANNULEE';

export interface ClientOrderLine {
  id: string;
  orderId: string;
  modelId: string;
  model: { name: string; code: string };
  colorRef?: string;
  sizeBreakdown: Record<string, number>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ClientOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client: { name: string; code: string; city?: string };
  status: ClientOrderStatus;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  depositAmount: number;
  notes?: string;
  lines: ClientOrderLine[];
  _count?: { deliveries: number };
}

export type DeliveryStatus = 'EN_PREPARATION' | 'LIVRE' | 'SIGNE' | 'RETOUR_PARTIEL';

export interface DeliveryLine {
  id: string;
  deliveryId: string;
  modelId: string;
  model: { name: string; code: string };
  colorRef?: string;
  sizeBreakdown: Record<string, number>;
  quantity: number;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  orderId: string;
  order: { id: string; orderNumber: string; client: { name: string; code: string; address?: string; city?: string; phone?: string; rc?: string; nif?: string } };
  deliveryDate: string;
  status: DeliveryStatus;
  carrierName?: string;
  trackingNumber?: string;
  signedAt?: string;
  notes?: string;
  lines: DeliveryLine[];
  invoice?: { id: string; invoiceNumber: string; status: string };
}

export type InvoiceStatus = 'BROUILLON' | 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
export type PaymentMethod = 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'TRAITE' | 'AUTRE';

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  deliveryId: string;
  clientId: string;
  client: { name: string; code: string; address?: string; city?: string; phone?: string; email?: string; rc?: string; nif?: string; paymentTerms?: number };
  delivery: { deliveryNumber: string; deliveryDate: string; lines?: DeliveryLine[]; order?: { lines: { modelId: string; colorRef?: string; unitPrice: number }[] } };
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  timbre: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes?: string;
  payments: InvoicePayment[];
}

// ─── Présences ────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'REPOS' | 'MISSION';

export interface Attendance {
  id: string;
  employeeId: string;
  employee: { id: string; firstName: string; lastName: string; employeeId: string; position: string };
  date: string;
  status: AttendanceStatus;
  arrivedAt?: string;
  leftAt?: string;
  hoursWorked?: number;
  notes?: string;
}

// ─── Planification ────────────────────────────────────────────────────────────

export interface ProductionSchedule {
  id: string;
  orderId: string;
  plannedStart: string;
  plannedEnd: string;
  estimatedDays: number;
  actualStart?: string;
  actualEnd?: string;
  priority: number;
}

export interface OrderCapacityItem {
  id: string;
  orderNumber: string;
  modelName: string;
  quantity: number;
  status: string;
  totalMinutes: number;
  estimatedDays: number;
  plannedStart?: string;
  plannedEnd?: string;
  clientName?: string;
  deliveryDate?: string;
}

// ─── Qualité ──────────────────────────────────────────────────────────────────

export type DefectSeverity = 'MINEUR' | 'MAJEUR' | 'CRITIQUE';
export type CheckType = 'EN_COURS' | 'FINAL';
export type QCStatus = 'EN_ATTENTE' | 'VALIDE' | 'BLOQUE';

export interface DefectType {
  id: string;
  code: string;
  name: string;
  severity: DefectSeverity;
  description?: string;
  isActive: boolean;
}

export interface QualityDefect {
  id: string;
  defectTypeId: string;
  defectType: { name: string; severity: DefectSeverity };
  quantity: number;
  notes?: string;
}

export interface QualityCheck {
  id: string;
  orderId: string;
  order: { id: string; orderNumber: string; model: { name: string; code: string } };
  operationId?: string;
  operation?: { name: string; sequence: number };
  checkType: CheckType;
  checkDate: string;
  quantityChecked: number;
  quantityPassed: number;
  quantityRework: number;
  quantityRejected: number;
  firstPassYield: number;
  status: QCStatus;
  notes?: string;
  defects: QualityDefect[];
}
