import { describe, it, expect } from "vitest";
import {
  buildBudgetUpsertRows,
  buildBudgetSaveItems,
} from "@/features/budgets/api/budgets";

describe("buildBudgetUpsertRows", () => {
  it("reemplaza el valor enviado y NO acumula con un previo", () => {
    const items = [{ category_id: "c1", budgeted_amount: 50_000 }];
    const rows = buildBudgetUpsertRows("p1", "u1", items);
    expect(rows).toEqual([
      { project_id: "p1", category_id: "c1", user_id: "u1", budgeted_amount: 50_000 },
    ]);
  });

  it("conserva el 0 para vaciar el rubro (no lo filtra)", () => {
    const rows = buildBudgetUpsertRows("p1", "u1", [
      { category_id: "c1", budgeted_amount: 0 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].budgeted_amount).toBe(0);
  });

  it("devuelve un arreglo vacío cuando no hay items", () => {
    expect(buildBudgetUpsertRows("p1", "u1", [])).toEqual([]);
  });
});

describe("buildBudgetSaveItems", () => {
  const rows = [
    { category_id: "c1", budgeted: 100_000 },
    { category_id: "c2", budgeted: 200_000 },
  ];

  it("envía el total editado y no una suma", () => {
    const edits = { c1: 50_000 } as const;
    const items = buildBudgetSaveItems(rows, edits);
    expect(items.find((i) => i.category_id === "c1")).toEqual({
      category_id: "c1",
      budgeted_amount: 50_000,
    });
  });

  it("sin editar mantiene el valor actual del rubro", () => {
    const items = buildBudgetSaveItems(rows, {});
    expect(items.find((i) => i.category_id === "c2")).toEqual({
      category_id: "c2",
      budgeted_amount: 200_000,
    });
  });

  it("interpreta null como vaciar el rubro (0)", () => {
    const items = buildBudgetSaveItems(rows, { c1: null });
    expect(items.find((i) => i.category_id === "c1")).toEqual({
      category_id: "c1",
      budgeted_amount: 0,
    });
  });
});