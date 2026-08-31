import { supabase } from "@/lib/supabase";
import type { IncomePayment, Project, Client } from "@/types";
import type { PaymentMethod } from "@/types/enums";

export interface IncomeWithRelations
  extends Omit<IncomePayment, "project" | "client"> {
  project?: Pick<Project, "id" | "name" | "status"> | null;
  client?: Pick<Client, "id" | "name" | "company"> | null;
}

export interface IncomeInput {
  project_id: string;
  client_id?: string | null;
  amount: number;
  payment_date: string;
  payment_time?: string | null;
  concept: string;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
}

export async function fetchIncome(
  projectId?: string
): Promise<IncomeWithRelations[]> {
  let query = supabase
    .from("income_payments")
    .select("*, project:projects(id, name, status), client:clients(id, name, company)")
    .order("payment_date", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as IncomeWithRelations[];
}

export async function createIncome(input: IncomeInput): Promise<IncomePayment> {
  const { data, error } = await supabase.from("income_payments").insert(input).select().single();
  if (error) throw error;
  return data as IncomePayment;
}

export async function updateIncome(
  id: string,
  input: IncomeInput
): Promise<IncomePayment> {
  const { data, error } = await supabase
    .from("income_payments")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as IncomePayment;
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from("income_payments").delete().eq("id", id);
  if (error) throw error;
}
