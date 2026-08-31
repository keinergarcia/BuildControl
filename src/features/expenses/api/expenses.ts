import { supabase } from "@/lib/supabase";
import type { Expense, Project, Supplier, BudgetCategory, ExpenseCategory } from "@/types";
import type { PaymentMethod } from "@/types/enums";

export interface ExpenseWithRelations
  extends Omit<Expense, "supplier" | "category"> {
  project?: Pick<Project, "id" | "name" | "status"> | null;
  category?: BudgetCategory | null;
  supplier?: Supplier | null;
}

export interface ExpenseInput {
  project_id: string;
  description: string;
  amount: number;
  category_id?: string | null;
  expense_category_id?: string | null;
  supplier_id?: string | null;
  expense_date: string;
  expense_time?: string | null;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
}

export async function fetchExpenses(
  projectId?: string
): Promise<ExpenseWithRelations[]> {
  let query = supabase
    .from("expenses")
    .select(
      "*, project:projects(id, name, status), category:budget_categories(id, name, icon, color), supplier:suppliers(id, name)"
    )
    .order("expense_date", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ExpenseWithRelations[];
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(
  id: string,
  input: ExpenseInput
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ExpenseCategory[];
}

export interface ExpenseCategoryInput {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export async function createExpenseCategory(
  input: ExpenseCategoryInput
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from("expense_categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseCategory;
}

export async function updateExpenseCategory(
  id: string,
  input: ExpenseCategoryInput
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from("expense_categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseCategory;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  if (error) throw error;
}
