import { supabase } from "@/lib/supabase";
import type { Contract, Project } from "@/types";
import type { ContractType } from "@/types/enums";

export interface ContractWithProject extends Contract {
  project?: Pick<Project, "id" | "name" | "status"> | null;
}

export interface ContractInput {
  project_id: string;
  contract_type: ContractType;
  total_value: number;
  daily_rate?: number | null;
  start_date: string;
  planned_end_date?: string | null;
  conditions?: string | null;
  notes?: string | null;
}

export async function fetchContracts(
  projectId?: string
): Promise<ContractWithProject[]> {
  let query = supabase
    .from("contracts")
    .select("*, project:projects(id, name, status, client_id)")
    .order("start_date", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ContractWithProject[];
}

export async function createContract(input: ContractInput): Promise<Contract> {
  const { data, error } = await supabase.from("contracts").insert(input).select().single();
  if (error) throw error;
  return data as Contract;
}

export async function updateContract(
  id: string,
  input: ContractInput
): Promise<Contract> {
  const { data, error } = await supabase
    .from("contracts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Contract;
}

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}
