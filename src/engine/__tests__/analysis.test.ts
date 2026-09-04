import { describe, it, expect } from "vitest";
import {
  detectAmountAnomalies,
  detectExpenseAnomalies,
  findOverbudgetCategories,
  groupExpensesByMonth,
} from "../analysis";
import type { Expense, ProjectBudget } from "@/types";

describe("detectAmountAnomalies", () => {
  const items = [
    { name: "a", v: 100 },
    { name: "b", v: 120 },
    { name: "c", v: 110 },
    { name: "d", v: 105 },
    { name: "e", v: 90 },
    { name: "f", v: 3000 },
  ];

  it("marca solo los valores atípicos", () => {
    const out = detectAmountAnomalies(items, (i) => i.v);
    expect(out).toHaveLength(1);
    expect(out[0].item.name).toBe("f");
  });

  it("requiere al menos 4 valores", () => {
    expect(detectAmountAnomalies(items.slice(0, 3), (i) => i.v)).toHaveLength(0);
  });
});

describe("detectExpenseAnomalies", () => {
  it("funciona sobre gastos tipados", () => {
    const base = { expense_date: "2026-08-01", category_id: "c1", description: "x" };
const expenses = [
    { ...base, id: "1", project_id: "p1", amount: 10_000 },
    { ...base, id: "2", project_id: "p1", amount: 12_000 },
    { ...base, id: "3", project_id: "p1", amount: 11_000 },
    { ...base, id: "4", project_id: "p1", amount: 13_000 },
    { ...base, id: "5", project_id: "p1", amount: 250_000 },
  ] as Expense[];
    const out = detectExpenseAnomalies(expenses);
    expect(out).toHaveLength(1);
    expect(out[0].item.id).toBe("5");
  });
});

describe("findOverbudgetCategories", () => {
  const budgets = [
    {
      id: "b1",
      project_id: "p1",
      category_id: "mat",
      budgeted_amount: 50_000_000,
      category: { id: "mat", name: "Materiales" },
    },
    {
      id: "b2",
      project_id: "p1",
      category_id: "mano",
      budgeted_amount: 80_000_000,
      category: { id: "mano", name: "Mano de obra" },
    },
    {
      id: "b3",
      project_id: "p1",
      category_id: "otro",
      budgeted_amount: 10_000_000,
      category: { id: "otro", name: "Imprevistos" },
    },
  ] as ProjectBudget[];

  it("reporta solo rubros cuyo gasto supera el presupuesto", () => {
    const spent = new Map([["mat", 60_000_000]]);
    const out = findOverbudgetCategories(budgets, spent);
    expect(out).toHaveLength(1);
    expect(out[0].category_id).toBe("mat");
    expect(out[0].over).toBe(10_000_000);
    expect(out[0].percent).toBe(120);
  });

  it("ignora rubros sin presupuesto y dentro de presupuesto", () => {
    expect(findOverbudgetCategories(budgets, new Map())).toHaveLength(0);
  });
});

describe("groupExpensesByMonth", () => {
  it("agrupa por mes de forma ordenada", () => {
    const expenses = [
      { id: "1", project_id: "p1", category_id: "c", amount: 10_000, expense_date: "2026-08-05", description: "x" },
      { id: "2", project_id: "p1", category_id: "c", amount: 5_000, expense_date: "2026-08-20", description: "x" },
      { id: "3", project_id: "p1", category_id: "c", amount: 7_000, expense_date: "2026-07-10", description: "x" },
      { id: "4", project_id: "p1", category_id: "c", amount: 99_000, description: "x" },
    ] as Expense[];
    const out = groupExpensesByMonth(expenses);
    expect(out).toHaveLength(2);
    expect(out[0].month).toBe("2026-07");
    expect(out[0].label).toBe("jul 2026");
    expect(out[1].total).toBe(15_000);
    expect(out[1].count).toBe(2);
  });
});