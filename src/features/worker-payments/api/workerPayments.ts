import { supabase } from "@/lib/supabase";
import type { WorkerPayment, Project, Worker } from "@/types";
import type { PaymentMethod } from "@/types/enums";

export interface WorkerPaymentWithRelations
  extends Omit<WorkerPayment, "project" | "worker"> {
  project?: Pick<Project, "id" | "name" | "status"> | null;
  worker?: Pick<Worker, "id" | "name" | "role"> | null;
}

export interface WorkerPaymentInput {
  worker_id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_time?: string | null;
  concept: string;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
}

export async function fetchWorkerPayments(
  projectId?: string
): Promise<WorkerPaymentWithRelations[]> {
  let query = supabase
    .from("worker_payments")
    .select("*, project:projects(id, name, status), worker:workers(id, name, role)")
    .order("payment_date", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WorkerPaymentWithRelations[];
}

export async function createWorkerPayment(
  input: WorkerPaymentInput
): Promise<WorkerPayment> {
  const { data, error } = await supabase
    .from("worker_payments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as WorkerPayment;
}

export async function updateWorkerPayment(
  id: string,
  input: WorkerPaymentInput
): Promise<WorkerPayment> {
  const { data, error } = await supabase
    .from("worker_payments")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as WorkerPayment;
}

export async function deleteWorkerPayment(id: string): Promise<void> {
  const { error } = await supabase.from("worker_payments").delete().eq("id", id);
  if (error) throw error;
}