import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildFinancialSummary,
  calculateProjectedProfit,
  calculateMaterialCost,
} from "../calculations";
import type {
  Contract,
  Expense,
  IncomePayment,
  ProjectBudget,
  PersonalWithdrawal,
  WorkerPayment,
} from "@/types";

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "c1",
    project_id: "p1",
    user_id: "u1",
    contract_type: "precio_fijo",
    total_value: 180000000,
    daily_rate: null,
    start_date: "2026-01-01",
    planned_end_date: "2026-07-15",
    conditions: null,
    notes: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    project_id: "p1",
    user_id: "u1",
    category_id: null,
    expense_category_id: null,
    supplier_id: null,
    description: "",
    amount: 1000000,
    expense_date: "2026-01-15",
    expense_time: null,
    payment_method: "efectivo",
    receipt_url: null,
    notes: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeWorkerPayment(overrides: Partial<WorkerPayment> = {}): WorkerPayment {
  return {
    id: "w1",
    worker_id: "wk1",
    project_id: "p1",
    user_id: "u1",
    amount: 80000,
    payment_date: "2026-01-15",
    payment_time: null,
    concept: "",
    payment_method: "efectivo",
    notes: null,
    created_at: "",
    ...overrides,
  };
}

function makeIncome(overrides: Partial<IncomePayment> = {}): IncomePayment {
  return {
    id: "i1",
    project_id: "p1",
    client_id: "cl1",
    user_id: "u1",
    amount: 1000000,
    payment_date: "2026-01-15",
    payment_time: null,
    concept: "",
    payment_method: "transferencia",
    receipt_url: null,
    notes: null,
    created_at: "",
    ...overrides,
  };
}

function makeWithdrawal(overrides: Partial<PersonalWithdrawal> = {}): PersonalWithdrawal {
  return {
    id: "d1",
    project_id: "p1",
    user_id: "u1",
    amount: 500000,
    withdrawal_date: "2026-02-01",
    withdrawal_time: null,
    reason: "",
    notes: null,
    created_at: "",
    ...overrides,
  };
}

function makeBudget(overrides: Partial<ProjectBudget> = {}): ProjectBudget {
  return {
    id: "b1",
    project_id: "p1",
    category_id: "cat1",
    user_id: "u1",
    budgeted_amount: 1000000,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

const CONTRACT = makeContract({ total_value: 180000000 });

const EXPENSES: Expense[] = [
  makeExpense({
    id: "e1",
    category_id: "mat",
    category: { id: "mat", name: "Materiales", icon: null, color: null, sort_order: 1 },
    amount: 12500000,
  }),
  makeExpense({
    id: "e2",
    category_id: "trp",
    category: { id: "trp", name: "Transporte", icon: null, color: null, sort_order: 3 },
    amount: 3500000,
  }),
  makeExpense({ id: "e3", category_id: null, amount: 5000000 }),
];

const LABOR: WorkerPayment[] = [
  makeWorkerPayment({ id: "w1", amount: 80000 }),
  makeWorkerPayment({ id: "w2", amount: 50000 }),
];

const INCOME: IncomePayment[] = [
  makeIncome({ id: "i1", amount: 54000000 }),
  makeIncome({ id: "i2", amount: 36000000 }),
  makeIncome({ id: "i3", amount: 36000000 }),
];

const WITHDRAWALS: PersonalWithdrawal[] = [
  makeWithdrawal({ id: "d1", amount: 500000 }),
  makeWithdrawal({ id: "d2", amount: 500000 }),
];

const BUDGETS: ProjectBudget[] = [
  makeBudget({ id: "b1", budgeted_amount: 45000000 }),
  makeBudget({ id: "b2", budgeted_amount: 40000000 }),
];

describe("calculateMaterialCost", () => {
  it("sums only expenses whose budget category is 'Materiales'", () => {
    expect(calculateMaterialCost(EXPENSES)).toBe(12500000);
  });
});

describe("calculateProjectedProfit", () => {
  const costs = 21130000;

  it("projects using daily cost against total planned days", () => {
    // 21,130,000 / 60 elapsed días -> costo diario 352,166.67
    // * 120 total días -> 42,260,000 proyectado
    const result = calculateProjectedProfit(180000000, costs, 60, 120);
    expect(result).toBeCloseTo(180000000 - 42260000, -3);
  });

  it("falls back to current profit when no days elapsed", () => {
    expect(calculateProjectedProfit(180000000, costs, 0, 120)).toBe(180000000 - costs);
  });

  it("falls back to current profit when total days unknown", () => {
    expect(calculateProjectedProfit(180000000, costs, 60, 0)).toBe(180000000 - costs);
  });
});

describe("buildFinancialSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15)); // hoy = 2026-04-15 (fijo para determinismo)
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes money metrics (deterministic, independent of today)", () => {
    const s = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS,
      "2026-01-01", "2026-07-15", null);

    expect(s.contractValue).toBe(180000000);
    expect(s.receivedAmount).toBe(126000000);
    expect(s.pendingAmount).toBe(54000000);
    expect(s.totalExpenses).toBe(21000000);
    expect(s.laborCost).toBe(130000);
    expect(s.materialCost).toBe(12500000);
    expect(s.totalCosts).toBe(21130000);
    expect(s.totalWithdrawals).toBe(1000000);
    expect(s.availableCash).toBe(103870000);
    expect(s.profit).toBe(158870000);
    expect(s.profitMargin).toBe(88.26);
    expect(s.budgetUsed).toBe(24.86);
    expect(s.remainingBudget).toBe(63870000);
  });

  it("computes time metrics with a fixed 'today'", () => {
    const s = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS,
      "2026-01-01", "2026-07-15", null);

    // elapsed = 104 días (2026-01-01 -> 2026-04-15)
    expect(s.daysElapsed).toBe(104);
    // totalDays = 195 (2026-01-01 -> 2026-07-15)
    // dailyCost = round(21,130,000 / 104) = 203,173
    expect(s.dailyCost).toBe(203173);
    // proyectado = 180M - (21.13M/104)*195
    expect(s.projectedProfit).toBeCloseTo(140381250, 0);
  });

  it("accounts for an early finish (actual_end before planned): positive variance", () => {
    const s = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS,
      "2026-01-01", "2026-07-15", "2026-07-01");
    expect(s.scheduleVariance).toBeGreaterThan(0);
  });

  it("accounts for a late finish (actual_end after planned): negative variance", () => {
    const s = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS,
      "2026-01-01", "2026-07-15", "2026-08-01");
    expect(s.scheduleVariance).toBeLessThan(0);
  });

  it("handles missing actual_end_date by comparing against today", () => {
    const s = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS,
      "2026-01-01", "2026-07-15", null);
    // hoy 2026-04-15 es antes del fin planeado -> ahead (varianza positiva)
    expect(s.scheduleVariance).toBeGreaterThan(0);
  });

  it("guards against division by zero when there is no budget or no elapsed time", () => {
    const noBudget = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, [], "2026-01-01", "2026-07-15", null);
    expect(noBudget.budgetUsed).toBe(0);
    expect(noBudget.remainingBudget).toBe(0);

    const notStarted = buildFinancialSummary(CONTRACT, [], [], INCOME, [], BUDGETS, null, null, null);
    expect(notStarted.daysElapsed).toBe(0);
    expect(notStarted.dailyCost).toBe(0);
    expect(notStarted.projectedProfit).toBe(CONTRACT.total_value); // sin gastos
  });

  it("keeps personal withdrawals OUT of construction cost (profit unaffected)", () => {
    const withWd = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, WITHDRAWALS, BUDGETS, "2026-01-01", "2026-07-15", null);
    const withoutWd = buildFinancialSummary(CONTRACT, EXPENSES, LABOR, INCOME, [], BUDGETS, "2026-01-01", "2026-07-15", null);

    // Profit es idéntico: los retiros NO son costo de construcción
    expect(withWd.profit).toBe(withoutWd.profit);
    // ...pero el flujo de caja disponible sí se reduce
    expect(withWd.availableCash).toBe(withoutWd.availableCash - 1000000);
  });
});
