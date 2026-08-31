import { supabase } from "@/lib/supabase";
import type { WorkerAssignment } from "@/types";

export interface AssignmentInput {
  worker_id: string;
  project_id: string;
  start_date: string;
  end_date?: string | null;
  daily_rate_override?: number | null;
}

export async function createAssignment(input: AssignmentInput): Promise<WorkerAssignment> {
  const { data, error } = await supabase
    .from("worker_assignments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as WorkerAssignment;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from("worker_assignments").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchWorkerAssignments(): Promise<WorkerAssignment[]> {
  const { data, error } = await supabase
    .from("worker_assignments")
    .select("*, project:projects(id, name, status)")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkerAssignment[];
}
