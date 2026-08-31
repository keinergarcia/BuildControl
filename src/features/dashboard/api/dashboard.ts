import { supabase } from "@/lib/supabase";
import { queryTable, type ActivityItem } from "@/features/activity/api/activity";
import type { ProjectWithDetails } from "@/types";

export async function fetchDashboardData(): Promise<ProjectWithDetails[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      client:clients(id, name, company, phone, email),
      contracts(id, project_id, contract_type, total_value, daily_rate, start_date, planned_end_date),
      budgets:project_budgets(id, project_id, category_id, budgeted_amount, category:budget_categories(id, name, color, icon)),
      expenses(id, project_id, category_id, description, amount, expense_date, category:budget_categories(id, name, color)),
      worker_payments(id, project_id, worker_id, amount, payment_date, concept),
      income_payments(id, project_id, client_id, amount, payment_date, concept),
      personal_withdrawals(id, project_id, amount, withdrawal_date, reason)`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectWithDetails[];
}

export async function fetchRecentActivity(
  projectIds: string[],
  limit = 8
): Promise<ActivityItem[]> {
  if (projectIds.length === 0) return [];

  const [expenses, income, payouts] = await Promise.all([
    queryTable(
      "expenses",
      projectIds,
      limit,
      { id: "id", project_id: "project_id", description: "description", amount: "amount", date: "expense_date", created_at: "created_at" },
      "expense"
    ),
    queryTable(
      "income_payments",
      projectIds,
      limit,
      { id: "id", project_id: "project_id", description: "concept", amount: "amount", date: "payment_date", created_at: "created_at" },
      "income"
    ),
    queryTable(
      "worker_payments",
      projectIds,
      limit,
      { id: "id", project_id: "project_id", description: "concept", amount: "amount", date: "payment_date", created_at: "created_at" },
      "worker_payment"
    ),
  ]);

  return [...expenses, ...income, ...payouts]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, limit);
}
