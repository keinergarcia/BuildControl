import { supabase } from "@/lib/supabase";
import type { PersonalWithdrawal, Project } from "@/types";

export interface WithdrawalWithProject
  extends Omit<PersonalWithdrawal, "project"> {
  project?: Pick<Project, "id" | "name" | "status"> | null;
}

export interface WithdrawalInput {
  project_id: string;
  amount: number;
  withdrawal_date: string;
  withdrawal_time?: string | null;
  reason: string;
  notes?: string | null;
}

export async function fetchWithdrawals(
  projectId?: string
): Promise<WithdrawalWithProject[]> {
  let query = supabase
    .from("personal_withdrawals")
    .select("*, project:projects(id, name, status)")
    .order("withdrawal_date", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WithdrawalWithProject[];
}

export async function createWithdrawal(input: WithdrawalInput): Promise<PersonalWithdrawal> {
  const { data, error } = await supabase
    .from("personal_withdrawals")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as PersonalWithdrawal;
}

export async function updateWithdrawal(
  id: string,
  input: WithdrawalInput
): Promise<PersonalWithdrawal> {
  const { data, error } = await supabase
    .from("personal_withdrawals")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PersonalWithdrawal;
}

export async function deleteWithdrawal(id: string): Promise<void> {
  const { error } = await supabase.from("personal_withdrawals").delete().eq("id", id);
  if (error) throw error;
}
