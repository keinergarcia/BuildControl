import { describe, it, expect } from "vitest";
import { answerQuestion, type AssistantContext } from "../insights";
import { formatCOP } from "@/lib/money";
import type { ProjectWithDetails, FinancialSummary } from "@/types";

const summary: FinancialSummary = {
  contractValue: 180_000_000,
  receivedAmount: 100_000_000,
  pendingAmount: 80_000_000,
  totalExpenses: 30_000_000,
  totalCosts: 46_000_000,
  laborCost: 14_000_000,
  materialCost: 12_000_000,
  totalWithdrawals: 2_000_000,
  availableCash: 52_000_000,
  budgetUsed: 60,
  totalBudget: 76_000_000,
  remainingBudget: 30_000_000,
  profit: 54_000_000,
  profitMargin: 30,
  expectedProfit: 104_000_000,
  projectedProfit: 54_000_000,
  projectedCost: 18_000_000,
  dailyCost: 300_000,
  dailyLaborCost: 150_000,
  dailyMaterialCost: 120_000,
  dailyOtherCost: 30_000,
  daysElapsed: 30,
  daysRemaining: 30,
  scheduleVariance: 5,
  potentialTimeSavings: 0,
};

const project = {
  id: "p1",
  name: "Casa Verde",
  status: "activo",
  start_date: "2026-07-01",
  planned_end_date: "2026-09-15",
  actual_end_date: null,
  expenses: [
    { id: "e1", project_id: "p1", category_id: "mat", amount: 500_000, description: "Cemento x20", expense_date: "2026-08-10" },
    { id: "e2", project_id: "p1", category_id: "mat", amount: 300_000, description: "Cemento x10", expense_date: "2026-08-12" },
    { id: "e3", project_id: "p1", category_id: "mat", amount: 28_000_000, description: "Estructura metálica", expense_date: "2026-08-05" },
    { id: "e4", project_id: "p1", category_id: "mat", amount: 240_000, description: "Arena gruesa", expense_date: "2026-08-08" },
  ],
  worker_payments: [
    { id: "w1", worker_id: "w1", project_id: "p1", amount: 800_000, payment_date: "2026-08-15", concept: "Semana 1", worker: { name: "Carlos Ríos" } },
    { id: "w2", worker_id: "w2", project_id: "p1", amount: 900_000, payment_date: "2026-08-15", concept: "Semana 1", worker: { name: "Ana Gómez" } },
  ],
  budgets: [
    { id: "b1", project_id: "p1", category_id: "mat", budgeted_amount: 40_000_000 },
    { id: "b2", project_id: "p1", category_id: "mano", budgeted_amount: 50_000_000 },
  ],
} as unknown as ProjectWithDetails;

const ctx: AssistantContext = {
  projects: [project],
  rows: [{ project, summary }],
  totals: {
    activeProjects: 1,
    totalContractValue: 180_000_000,
    totalReceived: 100_000_000,
    totalPending: 80_000_000,
    totalCosts: 46_000_000,
    totalExpenses: 30_000_000,
    totalLabor: 14_000_000,
    totalWithdrawals: 2_000_000,
    availableCash: 52_000_000,
    totalProfit: 54_000_000,
    expectedProfit: 104_000_000,
    projectedProfit: 54_000_000,
    weightedBudgetUsed: 60,
    totalBudget: 76_000_000,
    weightedProfitMargin: 30,
  },
  alerts: [],
};

const emptyCtx: AssistantContext = {
  projects: [],
  rows: [],
  totals: { ...ctx.totals, activeProjects: 0, totalContractValue: 0, totalReceived: 0, totalPending: 0, totalCosts: 0, totalExpenses: 0, totalLabor: 0, totalWithdrawals: 0, availableCash: 0, totalProfit: 0, expectedProfit: 0, projectedProfit: 0, weightedBudgetUsed: 0, totalBudget: 0, weightedProfitMargin: 0 },
  alerts: [],
};

describe("answerQuestion — utilidad", () => {
  it("reporta la utilidad real sin inventar", () => {
    const a = answerQuestion("¿Cuál es mi utilidad total?", ctx);
    expect(a.text).toContain(formatCOP(54_000_000));
    expect(a.text).toContain("30%");
    expect(a.tone).toBe("success");
  });
});

describe("answerQuestion — gastos", () => {
  it("filtra gastos por keyword real (cemento)", () => {
    const a = answerQuestion("¿cuánto he gastado en cemento?", ctx);
    expect(a.text).toContain("cemento");
    expect(a.text).toContain(formatCOP(800_000));
  });

  it("da totales reales si no hay keyword", () => {
    const a = answerQuestion("¿cuánto es mi gasto total?", ctx);
    expect(a.text).toContain(formatCOP(30_000_000));
    expect(a.text).toContain(formatCOP(14_000_000));
  });
});

describe("answerQuestion — trabajadores", () => {
  it("suma pagos por nombre del trabajador", () => {
    const a = answerQuestion("¿cuánto le he pagado a Carlos?", ctx);
    expect(a.text).toContain("Carlos");
    expect(a.text).toContain(formatCOP(800_000));
  });

  it("no inventa un trabajador inexistente", () => {
    const a = answerQuestion("¿cuánto le he pagado a Pedro?", ctx);
    expect(a.text).not.toContain("Pedro");
  });
});

describe("answerQuestion — presupuesto", () => {
  it("dice si vas dentro del presupuesto", () => {
    const a = answerQuestion("¿voy por encima del presupuesto?", ctx);
    expect(a.text).toMatch(/dentro del presupuesto/);
    expect(a.tone).toBe("success");
  });
});

describe("answerQuestion — anomalías", () => {
  it("detecta el gasto atípico", () => {
    const a = answerQuestion("¿hay gastos atípicos?", ctx);
    expect(a.text).toContain("Estructura metálica");
    expect(a.text).toContain(formatCOP(28_000_000));
  });
});

describe("answerQuestion — vacío", () => {
  it("no inventa respuestas sin datos", () => {
    const a = answerQuestion("¿cuánto he gastado en cemento?", emptyCtx);
    expect(a.text).not.toContain("cemento");
    expect(a.suggestions.length).toBeGreaterThan(0);
  });
});