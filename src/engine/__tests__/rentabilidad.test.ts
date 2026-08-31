import { describe, it, expect } from "vitest";
import {
  calculateExpectedProfit,
  buildAlerts,
  buildFinancialSummary,
} from "../calculations";
import type { FinancialSummary } from "@/types";

describe("calculateExpectedProfit", () => {
  it("resta el presupuesto total al valor del contrato", () => {
    expect(calculateExpectedProfit(180_000_000, 120_000_000)).toBe(60_000_000);
  });

  it("puede ser negativo si el presupuesto supera el contrato", () => {
    expect(calculateExpectedProfit(100_000_000, 130_000_000)).toBe(-30_000_000);
  });
});

function makeSummary(overrides: Partial<FinancialSummary> = {}): FinancialSummary {
  return {
    contractValue: 180_000_000,
    receivedAmount: 180_000_000,
    pendingAmount: 0,
    totalExpenses: 40_000_000,
    totalCosts: 60_000_000,
    laborCost: 20_000_000,
    materialCost: 40_000_000,
    totalWithdrawals: 0,
    availableCash: 120_000_000,
    budgetUsed: 50,
    totalBudget: 120_000_000,
    remainingBudget: 60_000_000,
    profit: 120_000_000,
    profitMargin: 66.67,
    expectedProfit: 60_000_000,
    projectedProfit: 120_000_000,
    projectedCost: 60_000_000,
    dailyCost: 400_000,
    dailyLaborCost: 133_333,
    dailyMaterialCost: 266_667,
    dailyOtherCost: 0,
    daysElapsed: 150,
    daysRemaining: 30,
    scheduleVariance: 25,
    potentialTimeSavings: 10_000_000,
    ...overrides,
  };
}

describe("buildAlerts", () => {
  const project = { id: "p1", name: "Obra Test", status: "activo" };

  it("no genera alertas para un proyecto sano", () => {
    const alerts = buildAlerts(project, makeSummary());
    expect(alerts).toHaveLength(0);
  });

  it("alerta cuando el presupuesto está agotado (>= 100%)", () => {
    const alerts = buildAlerts(project, makeSummary({ budgetUsed: 100 }));
    expect(alerts.some((a) => a.code === "budget_exhausted")).toBe(true);
    expect(alerts.find((a) => a.code === "budget_exhausted")?.severity).toBe("critical");
  });

  it("alerta cuando el presupuesto supera el 80%", () => {
    const alerts = buildAlerts(project, makeSummary({ budgetUsed: 85 }));
    expect(alerts.some((a) => a.code === "budget_high")).toBe(true);
  });

  it("alerta por retraso de cronograma", () => {
    const alerts = buildAlerts(project, makeSummary({ scheduleVariance: -15 }));
    const delay = alerts.find((a) => a.code === "schedule_delay");
    expect(delay).toBeDefined();
    expect(delay?.message).toContain("15 días");
  });

  it("no alerta por retraso si el proyecto está finalizado", () => {
    const alerts = buildAlerts(
      { ...project, status: "finalizado" },
      makeSummary({ scheduleVariance: -15 })
    );
    expect(alerts.some((a) => a.code === "schedule_delay")).toBe(false);
  });

  it("alerta por utilidad proyectada negativa", () => {
    const alerts = buildAlerts(project, makeSummary({ projectedProfit: -5_000_000 }));
    expect(alerts.some((a) => a.code === "projected_loss")).toBe(true);
  });

  it("alerta cuando no se ha recibido ningún ingreso", () => {
    const alerts = buildAlerts(
      project,
      makeSummary({ receivedAmount: 0, pendingAmount: 180_000_000 })
    );
    expect(alerts.some((a) => a.code === "no_income")).toBe(true);
  });

  it("alerta por caja disponible negativa", () => {
    const alerts = buildAlerts(project, makeSummary({ availableCash: -1_000_000 }));
    expect(alerts.some((a) => a.code === "negative_cash")).toBe(true);
  });

  it("informa cuando no hay presupuesto definido", () => {
    const alerts = buildAlerts(project, makeSummary({ totalBudget: 0, budgetUsed: 0 }));
    expect(alerts.some((a) => a.code === "no_budget")).toBe(true);
  });

  it("alerta por fecha de finalización vencida", () => {
    const alerts = buildAlerts(project, makeSummary({ daysRemaining: -7 }));
    expect(alerts.some((a) => a.code === "end_date_passed")).toBe(true);
  });

  it("integra expectedProfit en el resumen financiero", () => {
    const s = buildFinancialSummary(
      { total_value: 180_000_000 } as never,
      [],
      [],
      [],
      [],
      [{ budgeted_amount: 120_000_000 } as never],
      null,
      null,
      null
    );
    expect(s.expectedProfit).toBe(60_000_000);
  });
});