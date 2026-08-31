import type { Expense, ProjectBudget } from "@/types";

// =============================================
// Motor de análisis y predicciones (determinista)
// No "inventa" datos: calcula únicamente sobre lo registrado.
// =============================================

export interface AnomalyResult<T> {
  item: T;
  amount: number;
  median: number;
  threshold: number;
}

export function detectAmountAnomalies<T>(
  items: T[],
  amountOf: (item: T) => number,
  factor = 3
): AnomalyResult<T>[] {
  const amounts = items
    .map((it) => amountOf(it))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (amounts.length < 4) return [];

  const median = amounts[Math.floor(amounts.length / 2)];
  if (median === 0) return [];

  const deviations = amounts.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)];
  const threshold = median + (mad > 0 ? factor * 1.4826 * mad : factor * median);

  return items
    .filter((it) => {
      const v = amountOf(it);
      return Number.isFinite(v) && v > 0 && v > threshold;
    })
    .map((item) => ({
      item,
      amount: amountOf(item),
      median,
      threshold,
    }));
}

export function detectExpenseAnomalies(
  expenses: Expense[],
  factor = 3
): AnomalyResult<Expense>[] {
  return detectAmountAnomalies(expenses, (e) => Number(e.amount), factor);
}

export interface OverbudgetCategory {
  category_id: string;
  name: string;
  budgeted: number;
  spent: number;
  over: number;
  percent: number;
}

export function findOverbudgetCategories(
  budgets: ProjectBudget[],
  spentByCategoryId: Map<string, number>
): OverbudgetCategory[] {
  return budgets
    .filter((b) => Number(b.budgeted_amount) > 0)
    .map((b) => {
      const budgeted = Number(b.budgeted_amount);
      const spent = spentByCategoryId.get(b.category_id) ?? 0;
      return {
        category_id: b.category_id,
        name: b.category?.name ?? "Sin rubro",
        budgeted,
        spent,
        over: Math.max(0, spent - budgeted),
        percent: Math.round((spent / budgeted) * 10000) / 100,
      };
    })
    .filter((r) => r.spent > r.budgeted)
    .sort((a, b) => b.over - a.over);
}

export interface MonthlySpend {
  month: string;
  label: string;
  total: number;
  count: number;
}

const MONTH_NAMES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function groupExpensesByMonth(expenses: Expense[]): MonthlySpend[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    if (!e.expense_date) continue;
    const key = e.expense_date.slice(0, 7);
    const entry = map.get(key) ?? { total: 0, count: 0 };
    entry.total += Number(e.amount);
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, v]) => {
      const [y, m] = month.split("-").map(Number);
      return {
        month,
        label: `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`,
        total: v.total,
        count: v.count,
      };
    });
}

export function estimateProjectDuration(
  elapsedDays: number,
  completionRatio = 0.5
): number {
  if (completionRatio <= 0) return 0;
  if (elapsedDays <= 0) return 0;
  return Math.round(elapsedDays / completionRatio);
}

export interface DelayEstimate {
  expectedTotalDays: number;
  expectedEndDate: string;
  delayDays: number;
  ahead: boolean;
}

export function estimateDelay(
  startDate: string,
  plannedEndDate: string,
  elapsedDays: number,
  completionRatio = 0.5
): DelayEstimate | null {
  if (!startDate || !plannedEndDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const plannedEnd = new Date(plannedEndDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(plannedEnd.getTime())) return null;

  const plannedDays = Math.max(
    1,
    Math.round((plannedEnd.getTime() - start.getTime()) / 86_400_000)
  );
  const expectedTotalDays = estimateProjectDuration(elapsedDays, completionRatio);
  if (expectedTotalDays === 0) return null;

  const end = new Date(start.getTime() + expectedTotalDays * 86_400_000);
  const delayDays = expectedTotalDays - plannedDays;
  return {
    expectedTotalDays,
    expectedEndDate: end.toISOString().slice(0, 10),
    delayDays,
    ahead: delayDays <= 0,
  };
}