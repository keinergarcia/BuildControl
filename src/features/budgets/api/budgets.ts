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

export async function saveProjectBudgets(
  projectId: string,
  userId: string,
  items: BudgetItemInput[]
): Promise<void> {
  const rows = items.map((i) => ({
    project_id: projectId,
    category_id: i.category_id,
    user_id: userId,
    budgeted_amount: i.budgeted_amount,
  }));
  const { error } = await supabase
    .from("project_budgets")
    .upsert(rows, { onConflict: "project_id,category_id" });
  if (error) throw error;
}
