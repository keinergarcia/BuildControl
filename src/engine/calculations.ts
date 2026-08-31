import { differenceInDays, parseISO, isValid } from "date-fns";
import type { Contract, Expense, WorkerPayment, IncomePayment, PersonalWithdrawal, ProjectBudget, FinancialSummary } from "@/types";

function today(): Date {
  return new Date();
}

function safeDateDiff(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  if (!isValid(s) || !isValid(e)) return 0;
  return differenceInDays(e, s);
}

export function calculateContractValue(contract: Contract | undefined): number {
  return contract?.total_value ?? 0;
}

export function calculateReceivedAmount(incomePayments: IncomePayment[]): number {
  return incomePayments.reduce((sum, p) => sum + Number(p.amount), 0);
}

export function calculatePendingAmount(contractValue: number, received: number): number {
  return Math.max(0, contractValue - received);
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
}

export function calculateLaborCost(workerPayments: WorkerPayment[]): number {
  return workerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
}

export function calculateTotalCosts(expenses: Expense[], workerPayments: WorkerPayment[]): number {
  return calculateTotalExpenses(expenses) + calculateLaborCost(workerPayments);
}

export function calculateMaterialCost(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.category_id != null)
    .reduce((sum, e) => sum + Number(e.amount), 0);
}

export function calculatePersonalWithdrawals(withdrawals: PersonalWithdrawal[]): number {
  return withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
}

export function calculateAvailableCash(
  received: number,
  totalCosts: number,
  withdrawals: number
): number {
  return received - totalCosts - withdrawals;
}

export function calculateBudgetUsed(budgets: ProjectBudget[], totalCosts: number): number {
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
  if (totalBudget === 0) return 0;
  return Math.round((totalCosts / totalBudget) * 10000) / 100;
}

export function calculateRemainingBudget(budgets: ProjectBudget[]): number {
  return budgets.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
}

export function calculateProfit(contractValue: number, totalCosts: number): number {
  return contractValue - totalCosts;
}

export function calculateExpectedProfit(
  contractValue: number,
  totalBudget: number
): number {
  return contractValue - totalBudget;
}

export function calculateActualProfit(
  contractValue: number,
  totalCosts: number
): number {
  return contractValue - totalCosts;
}

// Costo proyectado al ritmo de gasto actual: costo real + costo diario * días restantes.
export function calculateProjectedCost(
  totalCosts: number,
  daysElapsed: number,
  totalDays: number
): number {
  if (daysElapsed === 0) return totalCosts;
  const projected = totalCosts + (totalCosts / daysElapsed) * Math.max(0, totalDays - daysElapsed);
  return Math.round(projected);
}

export function calculateProfitMargin(profit: number, contractValue: number): number {
  if (contractValue === 0) return 0;
  return Math.round((profit / contractValue) * 10000) / 100;
}

export function calculateProjectedProfit(
  contractValue: number,
  totalCosts: number,
  daysElapsed: number,
  totalDays: number
): number {
  if (totalDays === 0 || daysElapsed === 0) return contractValue - totalCosts;
  const projectedDailyCost = totalCosts / daysElapsed;
  const projectedTotalCost = projectedDailyCost * totalDays;
  return contractValue - projectedTotalCost;
}

export function calculateDailyCost(
  totalCosts: number,
  daysElapsed: number
): number {
  if (daysElapsed === 0) return 0;
  return Math.round(totalCosts / daysElapsed);
}

// Costo diario de mano de obra: pagos a trabajadores / días transcurridos.
export function calculateDailyLaborCost(
  laborCost: number,
  daysElapsed: number
): number {
  if (daysElapsed === 0) return 0;
  return Math.round(laborCost / daysElapsed);
}

// Costo diario de materiales: gastos clasificados como material / días transcurridos.
export function calculateDailyMaterialCost(
  materialCost: number,
  daysElapsed: number
): number {
  if (daysElapsed === 0) return 0;
  return Math.round(materialCost / daysElapsed);
}

// Costo diario de otros (transporte, maquinaria, servicios, etc.): resto del costo total
// que no es ni mano de obra ni material, dividido entre días transcurridos.
export function calculateDailyOtherCost(
  totalCosts: number,
  laborCost: number,
  materialCost: number,
  daysElapsed: number
): number {
  if (daysElapsed === 0) return 0;
  const other = Math.max(0, totalCosts - laborCost - materialCost);
  return Math.round(other / daysElapsed);
}

export function calculateDaysElapsed(startDate: string | null): number {
  if (!startDate) return 0;
  const days = safeDateDiff(startDate, today().toISOString().slice(0, 10));
  return Math.max(0, days);
}

export function calculateDaysRemaining(plannedEndDate: string | null): number {
  if (!plannedEndDate) return 0;
  return safeDateDiff(today().toISOString().slice(0, 10), plannedEndDate);
}

export function calculateTotalProjectDays(
  startDate: string | null,
  plannedEndDate: string | null
): number {
  if (!startDate || !plannedEndDate) return 0;
  return safeDateDiff(startDate, plannedEndDate);
}

export function calculateScheduleVariance(
  startDate: string | null,
  plannedEndDate: string | null,
  actualEndDate: string | null
): number {
  if (!startDate || !plannedEndDate) return 0;
  const end = actualEndDate ?? today().toISOString().slice(0, 10);
  const plannedDuration = safeDateDiff(startDate, plannedEndDate);
  const actualDuration = safeDateDiff(startDate, end);
  return plannedDuration - actualDuration;
}

export function calculatePotentialTimeSavings(
  dailyCost: number,
  daysAhead: number
): number {
  if (daysAhead <= 0) return 0;
  return dailyCost * daysAhead;
}

export function buildFinancialSummary(
  contract: Contract | undefined,
  expenses: Expense[],
  workerPayments: WorkerPayment[],
  incomePayments: IncomePayment[],
  withdrawals: PersonalWithdrawal[],
  budgets: ProjectBudget[],
  startDate: string | null,
  plannedEndDate: string | null,
  actualEndDate: string | null
): FinancialSummary {
  const contractValue = calculateContractValue(contract);
  const receivedAmount = calculateReceivedAmount(incomePayments);
  const pendingAmount = calculatePendingAmount(contractValue, receivedAmount);
  const totalExpenses = calculateTotalExpenses(expenses);
  const laborCost = calculateLaborCost(workerPayments);
  const materialCost = calculateMaterialCost(expenses);
  const totalCosts = calculateTotalCosts(expenses, workerPayments);
  const totalWithdrawals = calculatePersonalWithdrawals(withdrawals);
  const availableCash = calculateAvailableCash(receivedAmount, totalCosts, totalWithdrawals);

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
  const budgetUsed = totalBudget === 0 ? 0 : Math.round((totalCosts / totalBudget) * 10000) / 100;
  const remainingBudget = Math.max(0, totalBudget - totalCosts);

  const profit = calculateProfit(contractValue, totalCosts);
  const profitMargin = calculateProfitMargin(profit, contractValue);
  const expectedProfit = calculateExpectedProfit(contractValue, totalBudget);

  const elapsed = calculateDaysElapsed(startDate);
  const remaining = calculateDaysRemaining(plannedEndDate);
  const totalDays = calculateTotalProjectDays(startDate, plannedEndDate);
  const dailyCost = calculateDailyCost(totalCosts, elapsed);
  const dailyLaborCost = calculateDailyLaborCost(laborCost, elapsed);
  const dailyMaterialCost = calculateDailyMaterialCost(materialCost, elapsed);
  const dailyOtherCost = calculateDailyOtherCost(totalCosts, laborCost, materialCost, elapsed);

  const scheduleVariance = calculateScheduleVariance(startDate, plannedEndDate, actualEndDate);
  const potentialTimeSavings = calculatePotentialTimeSavings(dailyCost, Math.max(0, scheduleVariance));

  const projectedProfit = calculateProjectedProfit(contractValue, totalCosts, elapsed, totalDays);
  const projectedCost = calculateProjectedCost(totalCosts, elapsed, totalDays);

  return {
    contractValue,
    receivedAmount,
    pendingAmount,
    totalExpenses,
    totalCosts,
    laborCost,
    materialCost,
    totalWithdrawals,
    availableCash,
    budgetUsed,
    totalBudget,
    remainingBudget,
    profit,
    profitMargin,
    expectedProfit,
    projectedProfit,
    projectedCost,
    dailyCost,
    dailyLaborCost,
    dailyMaterialCost,
    dailyOtherCost,
    daysElapsed: elapsed,
    daysRemaining: remaining,
    scheduleVariance,
    potentialTimeSavings,
  };
}

const money = (v: number) => Math.round(v).toLocaleString("es-CO");

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertCode =
  | "budget_exhausted"
  | "budget_high"
  | "schedule_delay"
  | "projected_loss"
  | "no_income"
  | "negative_cash"
  | "no_budget"
  | "end_date_passed";

export interface FinancialAlert {
  id: string;
  project_id: string;
  project_name: string;
  severity: AlertSeverity;
  code: AlertCode;
  title: string;
  message: string;
  date: string;
}

export function buildAlerts(
  project: { id: string; name: string; status: string },
  s: FinancialSummary
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const base = {
    project_id: project.id,
    project_name: project.name,
    date: today().toISOString().slice(0, 10),
  };
  const finished = project.status === "finalizado" || project.status === "cancelado";

  if (s.contractValue > 0 && s.totalBudget === 0) {
    alerts.push({
      ...base,
      id: `${project.id}-no_budget`,
      severity: "info",
      code: "no_budget",
      title: "Presupuesto sin definir",
      message: "La obra tiene contrato pero aún no se ha definido un presupuesto.",
    });
  }

  if (s.budgetUsed >= 100) {
    alerts.push({
      ...base,
      id: `${project.id}-budget_exhausted`,
      severity: "critical",
      code: "budget_exhausted",
      title: "Presupuesto agotado",
      message: `Has gastado ${s.budgetUsed.toFixed(0)}% del presupuesto (${money(s.totalCosts)}).`,
    });
  } else if (s.budgetUsed >= 80) {
    alerts.push({
      ...base,
      id: `${project.id}-budget_high`,
      severity: "warning",
      code: "budget_high",
      title: "Presupuesto alto",
      message: `Has gastado ${s.budgetUsed.toFixed(0)}% del presupuesto (${money(s.totalCosts)}).`,
    });
  }

  if (!finished) {
    if (s.scheduleVariance < 0) {
      const delay = Math.abs(s.scheduleVariance);
      alerts.push({
        ...base,
        id: `${project.id}-schedule_delay`,
        severity: "warning",
        code: "schedule_delay",
        title: "Retraso en cronograma",
        message: `La obra lleva ${delay} ${delay === 1 ? "día" : "días"} de retraso.`,
      });
    }
    if (s.daysRemaining < 0) {
      const passed = Math.abs(s.daysRemaining);
      alerts.push({
        ...base,
        id: `${project.id}-end_date_passed`,
        severity: "warning",
        code: "end_date_passed",
        title: "Fecha de finalización vencida",
        message: `La fecha prevista venció hace ${passed} ${passed === 1 ? "día" : "días"}.`,
      });
    }
  }

  if (s.contractValue > 0 && s.pendingAmount === s.contractValue) {
    alerts.push({
      ...base,
      id: `${project.id}-no_income`,
      severity: "warning",
      code: "no_income",
      title: "Sin ingresos recibidos",
      message: "El contrato está firmado pero no se ha recibido ningún pago del cliente.",
    });
  }

  if (s.projectedProfit < 0) {
    alerts.push({
      ...base,
      id: `${project.id}-projected_loss`,
      severity: "critical",
      code: "projected_loss",
      title: "Utilidad proyectada negativa",
      message: `Al ritmo actual la obra cerraría en pérdida de ${money(s.projectedProfit)}.`,
    });
  }

  if (s.availableCash < 0) {
    alerts.push({
      ...base,
      id: `${project.id}-negative_cash`,
      severity: "warning",
      code: "negative_cash",
      title: "Caja disponible negativa",
      message: `Tras costos y retiros la caja está en −${money(Math.abs(s.availableCash))}.`,
    });
  }

  return alerts;
}
