import { buildFinancialSummary } from "@/engine/calculations";
import type { FinancialSummary, ProjectWithDetails } from "@/types";
import { toCsv, downloadCsv } from "@/lib/csv";

export interface ProjectReportRow {
  project: ProjectWithDetails;
  summary: FinancialSummary;
}

export function buildProjectRows(projects: ProjectWithDetails[]): ProjectReportRow[] {
  return projects.map((p) => ({
    project: p,
    summary: buildFinancialSummary(
      p.contracts?.[0],
      p.expenses ?? [],
      p.worker_payments ?? [],
      p.income_payments ?? [],
      p.personal_withdrawals ?? [],
      p.budgets ?? [],
      p.start_date,
      p.planned_end_date,
      p.actual_end_date
    ),
  }));
}

export function sumRows(rows: ProjectReportRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.contractValue += r.summary.contractValue;
      acc.receivedAmount += r.summary.receivedAmount;
      acc.pendingAmount += r.summary.pendingAmount;
      acc.totalCosts += r.summary.totalCosts;
      acc.totalExpenses += r.summary.totalExpenses;
      acc.laborCost += r.summary.laborCost;
      acc.totalWithdrawals += r.summary.totalWithdrawals;
      acc.availableCash += r.summary.availableCash;
      acc.profit += r.summary.profit;
      return acc;
    },
    {
      contractValue: 0,
      receivedAmount: 0,
      pendingAmount: 0,
      totalCosts: 0,
      totalExpenses: 0,
      laborCost: 0,
      totalWithdrawals: 0,
      availableCash: 0,
      profit: 0,
    }
  );
}

export function exportFinancialReport(
  rows: ProjectReportRow[],
  filename = "reporte-financiero.csv"
): void {
  const data = rows.map((r) => [
    r.project.name,
    r.summary.contractValue,
    r.summary.receivedAmount,
    r.summary.pendingAmount,
    r.summary.totalExpenses,
    r.summary.laborCost,
    r.summary.totalCosts,
    r.summary.totalWithdrawals,
    r.summary.availableCash,
    r.summary.profit,
    r.summary.profitMargin,
    r.summary.budgetUsed,
    r.summary.dailyCost,
    r.summary.daysElapsed,
    r.summary.scheduleVariance > 0 ? `+${r.summary.scheduleVariance}` : r.summary.scheduleVariance,
  ]);
  const csv = toCsv(
    [
      "Obra",
      "Contrato",
      "Recibido",
      "Pendiente",
      "Gastos",
      "Mano de obra",
      "Costos totales",
      "Retiros",
      "Caja",
      "Utilidad",
      "Margen %",
      "Presupuesto usado %",
      "Costo diario",
      "Días transcurridos",
      "Adelanto/Retraso (días)",
    ],
    data
  );
  downloadCsv(filename, csv);
}

export function exportTransactions(
  filename: string,
  headers: string[],
  rows: unknown[][]
): void {
  downloadCsv(filename, toCsv(headers, rows));
}