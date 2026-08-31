import { describe, it, expect } from "vitest";
import {
  calculateContractValue,
  calculateReceivedAmount,
  calculatePendingAmount,
  calculateTotalExpenses,
  calculateLaborCost,
  calculateTotalCosts,
  calculatePersonalWithdrawals,
  calculateAvailableCash,
  calculateProfit,
  calculateProfitMargin,
  calculateDailyCost,
  calculateScheduleVariance,
  calculatePotentialTimeSavings,
  calculateBudgetUsed,
  calculateActualProfit,
  calculateProjectedCost,
  calculateDailyLaborCost,
  calculateDailyMaterialCost,
  calculateDailyOtherCost,
} from "../calculations";
import type { Contract, Expense, WorkerPayment, IncomePayment, PersonalWithdrawal, ProjectBudget } from "@/types";

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "1",
    project_id: "p1",
    user_id: "u1",
    contract_type: "precio_fijo",
    total_value: 180000000,
    daily_rate: null,
    start_date: "2026-01-01",
    planned_end_date: "2026-06-30",
    conditions: null,
    notes: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "1",
    project_id: "p1",
    user_id: "u1",
    category_id: null,
    expense_category_id: null,
    supplier_id: null,
    description: "Test",
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
    id: "1",
    worker_id: "w1",
    project_id: "p1",
    user_id: "u1",
    amount: 80000,
    payment_date: "2026-01-15",
    payment_time: null,
    concept: "Jornada",
    payment_method: "efectivo",
    notes: null,
    created_at: "",
    ...overrides,
  };
}

function makeIncomePayment(overrides: Partial<IncomePayment> = {}): IncomePayment {
  return {
    id: "1",
    project_id: "p1",
    client_id: "c1",
    user_id: "u1",
    amount: 50000000,
    payment_date: "2026-01-10",
    payment_time: null,
    concept: "Anticipo",
    payment_method: "transferencia",
    receipt_url: null,
    notes: null,
    created_at: "",
    ...overrides,
  };
}

function makeWithdrawal(overrides: Partial<PersonalWithdrawal> = {}): PersonalWithdrawal {
  return {
    id: "1",
    project_id: "p1",
    user_id: "u1",
    amount: 500000,
    withdrawal_date: "2026-01-20",
    withdrawal_time: null,
    reason: "Personal",
    notes: null,
    created_at: "",
    ...overrides,
  };
}

describe("Contract Value", () => {
  it("returns contract total value", () => {
    const contract = makeContract({ total_value: 180000000 });
    expect(calculateContractValue(contract)).toBe(180000000);
  });

  it("returns 0 when no contract", () => {
    expect(calculateContractValue(undefined)).toBe(0);
  });
});

describe("Received Amount", () => {
  it("sums all income payments", () => {
    const payments = [
      makeIncomePayment({ amount: 50000000 }),
      makeIncomePayment({ id: "2", amount: 40000000 }),
    ];
    expect(calculateReceivedAmount(payments)).toBe(90000000);
  });

  it("returns 0 for empty payments", () => {
    expect(calculateReceivedAmount([])).toBe(0);
  });
});

describe("Pending Amount", () => {
  it("calculates pending correctly", () => {
    expect(calculatePendingAmount(180000000, 90000000)).toBe(90000000);
  });

  it("never goes below 0", () => {
    expect(calculatePendingAmount(90000000, 180000000)).toBe(0);
  });
});

describe("Total Expenses", () => {
  it("sums all expenses", () => {
    const expenses = [
      makeExpense({ amount: 5000000 }),
      makeExpense({ id: "2", amount: 3000000 }),
    ];
    expect(calculateTotalExpenses(expenses)).toBe(8000000);
  });
});

describe("Labor Cost", () => {
  it("sums all worker payments", () => {
    const payments = [
      makeWorkerPayment({ amount: 80000 }),
      makeWorkerPayment({ id: "2", amount: 120000 }),
    ];
    expect(calculateLaborCost(payments)).toBe(200000);
  });
});

describe("Total Costs", () => {
  it("combines expenses and labor", () => {
    const expenses = [makeExpense({ amount: 5000000 })];
    const labor = [makeWorkerPayment({ amount: 800000 })];
    expect(calculateTotalCosts(expenses, labor)).toBe(5800000);
  });
});

describe("Personal Withdrawals", () => {
  it("sums all withdrawals", () => {
    const withdrawals = [
      makeWithdrawal({ amount: 500000 }),
      makeWithdrawal({ id: "2", amount: 300000 }),
    ];
    expect(calculatePersonalWithdrawals(withdrawals)).toBe(800000);
  });
});

describe("Available Cash", () => {
  it("calculates cash flow correctly", () => {
    expect(calculateAvailableCash(100000, 80000, 10000)).toBe(10000);
  });

  it("can be negative", () => {
    expect(calculateAvailableCash(50000, 80000, 10000)).toBe(-40000);
  });
});

describe("Profit", () => {
  it("calculates profit correctly", () => {
    expect(calculateProfit(180000000, 115000000)).toBe(65000000);
  });

  it("can be negative (loss)", () => {
    expect(calculateProfit(100000000, 120000000)).toBe(-20000000);
  });
});

describe("Profit Margin", () => {
  it("calculates margin percentage", () => {
    expect(calculateProfitMargin(65000000, 180000000)).toBeCloseTo(36.11, 1);
  });

  it("returns 0 when contract value is 0", () => {
    expect(calculateProfitMargin(10000, 0)).toBe(0);
  });
});

describe("Daily Cost", () => {
  it("calculates daily cost", () => {
    expect(calculateDailyCost(4500000, 10)).toBe(450000);
  });

  it("returns 0 when days is 0", () => {
    expect(calculateDailyCost(4500000, 0)).toBe(0);
  });
});

describe("Daily Cost Breakdown", () => {
  it("divide el costo de mano de obra entre los días", () => {
    expect(calculateDailyLaborCost(2000000, 10)).toBe(200000);
    expect(calculateDailyLaborCost(2000000, 0)).toBe(0);
  });

  it("divide el costo de materiales entre los días", () => {
    expect(calculateDailyMaterialCost(3000000, 10)).toBe(300000);
    expect(calculateDailyMaterialCost(3000000, 0)).toBe(0);
  });

  it("calcula el costo diario de otros (resto del total)", () => {
    // total 12.000.000, labor 2.000.000, materials 5.000.000 => other 5.000.000
    expect(calculateDailyOtherCost(12000000, 2000000, 5000000, 10)).toBe(500000);
    expect(calculateDailyOtherCost(12000000, 2000000, 5000000, 0)).toBe(0);
    // nunca negativo aunque los costos marcados superen el total
    expect(calculateDailyOtherCost(1000000, 2000000, 5000000, 2)).toBe(0);
  });
});

describe("Schedule Variance", () => {
  it("returns positive when ahead of schedule", () => {
    const variance = calculateScheduleVariance("2026-01-01", "2026-06-30", "2026-06-15");
    expect(variance).toBe(15);
  });

  it("returns negative when behind schedule", () => {
    const variance = calculateScheduleVariance("2026-01-01", "2026-06-30", "2026-07-15");
    expect(variance).toBe(-15);
  });

  it("returns 0 when no dates provided", () => {
    expect(calculateScheduleVariance(null, null, null)).toBe(0);
  });
});

describe("Potential Time Savings", () => {
  it("calculates savings from being ahead", () => {
    expect(calculatePotentialTimeSavings(450000, 20)).toBe(9000000);
  });

  it("returns 0 when not ahead", () => {
    expect(calculatePotentialTimeSavings(450000, -5)).toBe(0);
  });
});

describe("Budget Used", () => {
  it("calculates budget utilization", () => {
    const budgets: ProjectBudget[] = [
      { id: "1", project_id: "p1", category_id: "cat1", user_id: "u1", budgeted_amount: 50000000, created_at: "", updated_at: "" },
      { id: "2", project_id: "p1", category_id: "cat2", user_id: "u1", budgeted_amount: 70000000, created_at: "", updated_at: "" },
    ];
    expect(calculateBudgetUsed(budgets, 60000000)).toBe(50);
  });

  it("returns 0 when no budget", () => {
    expect(calculateBudgetUsed([], 1000)).toBe(0);
  });
});

describe("Actual Profit", () => {
  it("devuelve contrato menos costos reales", () => {
    expect(calculateActualProfit(180000000, 120000000)).toBe(60000000);
    expect(calculateActualProfit(100000, 150000)).toBe(-50000);
    expect(calculateActualProfit(0, 0)).toBe(0);
  });
});

describe("Projected Cost", () => {
  it("proyecta el costo al ritmo de gasto actual", () => {
    expect(calculateProjectedCost(4500000, 10, 30)).toBe(13500000);
    expect(calculateProjectedCost(0, 10, 30)).toBe(0);
    expect(calculateProjectedCost(1000000, 0, 30)).toBe(1000000);
    expect(calculateProjectedCost(4500000, 30, 30)).toBe(4500000);
  });
});
