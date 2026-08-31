import type {
  ProjectStatus,
  ContractType,
  PaymentMethod,
  WorkerPaymentType,
  WorkerStatus,
  DocumentType,
  AuditAction,
} from "./enums";

export { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, CONTRACT_TYPE_LABELS, PAYMENT_METHOD_LABELS, WORKER_PAYMENT_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from "./enums";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  document_type: string | null;
  document_number: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  location: string | null;
  project_type: string | null;
  status: ProjectStatus;
  start_date: string | null;
  planned_end_date: string | null;
  actual_end_date: string | null;
  cover_image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  project_id: string;
  user_id: string;
  contract_type: ContractType;
  total_value: number;
  daily_rate: number | null;
  start_date: string;
  planned_end_date: string | null;
  conditions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  category_id: string;
  user_id: string;
  budgeted_amount: number;
  created_at: string;
  updated_at: string;
  category?: BudgetCategory;
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  user_id: string;
  category_id: string | null;
  expense_category_id: string | null;
  supplier_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  expense_time: string | null;
  payment_method: PaymentMethod | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: BudgetCategory;
  supplier?: Supplier;
}

export interface Worker {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  role: string;
  payment_type: WorkerPaymentType;
  daily_rate: number | null;
  status: WorkerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerAssignment {
  id: string;
  worker_id: string;
  project_id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  daily_rate_override: number | null;
  created_at: string;
  worker?: Worker;
  project?: Project;
}

export interface WorkerPayment {
  id: string;
  worker_id: string;
  project_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_time: string | null;
  concept: string;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  worker?: Worker;
  project?: Project;
}

export interface IncomePayment {
  id: string;
  project_id: string;
  client_id: string | null;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_time: string | null;
  concept: string;
  payment_method: PaymentMethod | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  project?: Project;
  client?: Client;
}

export interface PersonalWithdrawal {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  withdrawal_date: string;
  withdrawal_time: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  project?: Project;
}

export interface Document {
  id: string;
  project_id: string | null;
  user_id: string;
  name: string;
  file_url: string;
  file_type: DocumentType;
  file_size: number | null;
  related_entity: string | null;
  related_entity_id: string | null;
  created_at: string;
  project?: Project;
}

export interface ProjectDailyRecord {
  id: string;
  project_id: string;
  user_id: string;
  record_date: string;
  weather: string | null;
  workers_present: number | null;
  notes: string | null;
  activities: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  entity: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface FinancialSummary {
  contractValue: number;
  receivedAmount: number;
  pendingAmount: number;
  totalExpenses: number;
  totalCosts: number;
  laborCost: number;
  materialCost: number;
  totalWithdrawals: number;
  availableCash: number;
  budgetUsed: number;
  totalBudget: number;
  remainingBudget: number;
  profit: number;
  profitMargin: number;
  expectedProfit: number;
  projectedProfit: number;
  projectedCost: number;
  dailyCost: number;
  dailyLaborCost: number;
  dailyMaterialCost: number;
  dailyOtherCost: number;
  daysElapsed: number;
  daysRemaining: number;
  scheduleVariance: number;
  potentialTimeSavings: number;
}

export interface ProjectWithDetails extends Project {
  client?: Client | null;
  contracts?: Contract[];
  budgets?: ProjectBudget[];
  expenses?: Expense[];
  worker_payments?: WorkerPayment[];
  income_payments?: IncomePayment[];
  personal_withdrawals?: PersonalWithdrawal[];
}
