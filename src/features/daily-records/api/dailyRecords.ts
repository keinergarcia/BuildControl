import { supabase } from "@/lib/supabase";
import type { ProjectDailyRecord } from "@/types";

export interface DailyRecordInput {
  project_id: string;
  user_id?: string | null;
  record_date: string;
  weather?: string | null;
  workers_present?: number | null;
  notes?: string | null;
  activities?: string | null;
}

export async function fetchDailyRecords(
  projectId: string
): Promise<ProjectDailyRecord[]> {
  const { data, error } = await supabase
    .from("project_daily_records")
    .select("*")
    .eq("project_id", projectId)
    .order("record_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectDailyRecord[];
}

export async function createDailyRecord(
  input: DailyRecordInput
): Promise<ProjectDailyRecord> {
  const { data, error } = await supabase
    .from("project_daily_records")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ProjectDailyRecord;
}

export async function updateDailyRecord(
  id: string,
  input: DailyRecordInput
): Promise<ProjectDailyRecord> {
  const { data, error } = await supabase
    .from("project_daily_records")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ProjectDailyRecord;
}

export async function deleteDailyRecord(id: string): Promise<void> {
  const { error } = await supabase.from("project_daily_records").delete().eq("id", id);
  if (error) throw error;
}
