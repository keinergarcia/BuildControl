import { supabase } from "@/lib/supabase";

export interface BudgetCategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export async function fetchBudgetCategories(): Promise<BudgetCategoryRow[]> {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BudgetCategoryRow[];
}

export interface BudgetItemInput {
  category_id: string;
  budgeted_amount: number;
}

export interface BudgetUpsertRow {
  project_id: string;
  category_id: string;
  user_id: string;
  budgeted_amount: number;
}

// Semántica "replace": el valor enviado ES el nuevo total objetivo del rubro.
// No se acumula con el presupuesto previo ni se descarta el 0 (0 = vaciar).
export function buildBudgetUpsertRows(
  projectId: string,
  userId: string,
  items: BudgetItemInput[]
): BudgetUpsertRow[] {
  return items.map((i) => ({
    project_id: projectId,
    category_id: i.category_id,
    user_id: userId,
    budgeted_amount: i.budgeted_amount,
  }));
}

// Construye el payload del form con la misma semántica: si el rubro fue
// editado se usa ese total (null/0 vacía el rubro); si no, el valor actual.
export function buildBudgetSaveItems(
  rows: Array<{ category_id: string; budgeted: number }>,
  edits: Readonly<Record<string, number | null | undefined>>
): BudgetItemInput[] {
  return rows.map((r) => ({
    category_id: r.category_id,
    budgeted_amount:
      edits[r.category_id] !== undefined ? (edits[r.category_id] ?? 0) : r.budgeted,
  }));
}

export async function saveProjectBudgets(
  projectId: string,
  userId: string,
  items: BudgetItemInput[]
): Promise<void> {
  if (items.length === 0) return;

  const rows = buildBudgetUpsertRows(projectId, userId, items);

  const { error } = await supabase
    .from("project_budgets")
    .upsert(rows, { onConflict: "project_id,category_id" });
  if (error) throw error;
}