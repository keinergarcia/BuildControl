import { supabase } from "@/lib/supabase";
import type {
  Project,
  ProjectWithDetails,
  Client,
} from "@/types";

export interface ProjectListFilters {
  search?: string;
  status?: string;
  client_id?: string;
}

export async function fetchProjects(
  filters: ProjectListFilters = {}
): Promise<ProjectWithDetails[]> {
  let query = supabase
    .from("projects")
    .select(
      "*, client:clients(id, name, company, phone, email, document_type, document_number, address, notes, created_at, updated_at)"
    )
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProjectWithDetails[];
}

export async function fetchProject(id: string): Promise<ProjectWithDetails> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      client:clients(id, name, company),
      contracts(id, project_id, contract_type, total_value, daily_rate, start_date, planned_end_date, conditions, notes),
      budgets:project_budgets(id, project_id, category_id, budgeted_amount),
      expenses(id, project_id, category_id, description, amount, expense_date, payment_method, notes),
      worker_payments(id, project_id, worker_id, amount, payment_date, concept, payment_method, notes),
      income_payments(id, project_id, client_id, amount, payment_date, concept, payment_method, notes),
      personal_withdrawals(id, project_id, amount, withdrawal_date, reason, notes)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Proyecto no encontrado");
  return data as ProjectWithDetails;
}

export type ProjectInput = Omit<
  Partial<Project>,
  "id" | "created_at" | "updated_at"
>;

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase.from("projects").insert(input).select().single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Client[];
}
