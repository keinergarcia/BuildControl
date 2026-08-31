import { supabase } from "@/lib/supabase";
import type { Client } from "@/types";

export interface ClientInput {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function fetchClients(search = ""): Promise<Client[]> {
  let query = supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (search) {
    const q = search.trim();
    query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data, error } = await supabase.from("clients").insert(input).select().single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  id: string,
  input: ClientInput
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
