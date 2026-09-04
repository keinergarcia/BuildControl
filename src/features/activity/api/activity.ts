import { supabase } from "@/lib/supabase";

export type ActivityKind =
  | "expense"
  | "worker_payment"
  | "income"
  | "withdrawal"
  | "audit";

export interface ActivityItem {
  key: string;
  kind: ActivityKind;
  project_id: string | null;
  description: string;
  amount: number | null;
  date: string;
  created_at: string;
}

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  expenses: "Gasto",
  worker_payments: "Pago a trabajador",
  income_payments: "Ingreso",
  personal_withdrawals: "Retiro",
  projects: "Obra",
  documents: "Documento",
  contracts: "Contrato",
  project_budgets: "Presupuesto",
  clients: "Cliente",
  suppliers: "Proveedor",
  workers: "Trabajador",
};

function toItem(
  kind: ActivityKind,
  id: string,
  project_id: string | null,
  description: string,
  amount: number | null,
  date: string,
  created_at: string
): ActivityItem {
  return { key: `${kind}-${id}`, kind, project_id, description, amount, date, created_at };
}

export async function queryTable(
  table: "expenses" | "worker_payments" | "income_payments" | "personal_withdrawals",
  projectIds: string[],
  userId: string | undefined,
  limit: number,
  cols: { id: string; project_id: string; description: string; amount: string; date: string; created_at: string },
  kind: ActivityKind
) {
  let query = supabase
    .from(table)
    .select(cols.id + ", project_id, " + cols.description + ", " + cols.amount + ", " + cols.date + ", created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) =>
    toItem(
      kind,
      String(r[cols.id]),
      String(r["project_id"] ?? ""),
      String(r[cols.description] ?? "") || kind.replace("_", " "),
      r[cols.amount] == null ? null : Number(r[cols.amount]),
      String(r[cols.date] ?? String(r["created_at"] ?? "").slice(0, 10)),
      String(r["created_at"] ?? "")
    )
  );
}

export async function fetchActivity(
  projectIds: string[],
  userId: string | undefined,
  limit = 300
): Promise<ActivityItem[]> {
  if (projectIds.length === 0) return [];

  let auditQuery = supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, created_at")
    .in("entity", ["expenses", "worker_payments", "income_payments", "personal_withdrawals", "projects", "documents", "contracts"])
    .in("action", ["INSERT", "UPDATE", "DELETE"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (userId) auditQuery = auditQuery.eq("user_id", userId);

  const [expenses, payments, income, withdrawals, audit] = await Promise.all([
    queryTable("expenses", projectIds, userId, limit, { id: "id", project_id: "project_id", description: "description", amount: "amount", date: "expense_date", created_at: "created_at" }, "expense"),
    queryTable("worker_payments", projectIds, userId, limit, { id: "id", project_id: "project_id", description: "concept", amount: "amount", date: "payment_date", created_at: "created_at" }, "worker_payment"),
    queryTable("income_payments", projectIds, userId, limit, { id: "id", project_id: "project_id", description: "concept", amount: "amount", date: "payment_date", created_at: "created_at" }, "income"),
    queryTable("personal_withdrawals", projectIds, userId, limit, { id: "id", project_id: "project_id", description: "reason", amount: "amount", date: "withdrawal_date", created_at: "created_at" }, "withdrawal"),
    auditQuery,
  ]);

  if (audit.error) throw audit.error;

  const auditItems: ActivityItem[] = (audit.data ?? []).map((a) => {
    const label = (AUDIT_ENTITY_LABELS[a.entity] ?? a.entity).toLowerCase();
    const verb = a.action === "DELETE" ? "eliminó" : a.action === "INSERT" ? "creó" : "modificó";
    const project_id = a.entity === "projects" ? a.entity_id : null;
    return toItem(
      "audit",
      "audit-" + a.id,
      project_id,
      `Se ${verb} ${label}`,
      null,
      String(a.created_at ?? "").slice(0, 10),
      String(a.created_at ?? "")
    );
  });

  return [...expenses, ...payments, ...income, ...withdrawals, ...auditItems]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, limit);
}