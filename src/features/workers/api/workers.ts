import { supabase } from "@/lib/supabase";
import type { Worker } from "@/types";
import type { WorkerPaymentType } from "@/types/enums";

export interface WorkerInput {
  name: string;
  phone?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  role: string;
  payment_type: WorkerPaymentType;
  daily_rate?: number | null;
  status?: "activo" | "inactivo";
  notes?: string | null;
}

export async function fetchWorkers(search = ""): Promise<Worker[]> {
  let query = supabase
    .from("workers")
    .select("*")
    .order("name", { ascending: true });

  if (search) {
    const q = search.trim();
    query = query.or(`name.ilike.%${q}%,role.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Worker[];
}

export async function createWorker(input: WorkerInput): Promise<Worker> {
  const { data, error } = await supabase.from("workers").insert(input).select().single();
  if (error) throw error;
  return data as Worker;
}

export async function updateWorker(
  id: string,
  input: WorkerInput
): Promise<Worker> {
  const { data, error } = await supabase
    .from("workers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Worker;
}

export async function deleteWorker(id: string): Promise<void> {
  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (error) throw error;
}
