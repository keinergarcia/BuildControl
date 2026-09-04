import { supabase } from "@/lib/supabase";
import { sanitizeFileName } from "@/lib/utils";
import type { Document, Project } from "@/types";
import type { DocumentType } from "@/types/enums";

export interface DocumentWithProject extends Omit<Document, "project"> {
  project?: Pick<Project, "id" | "name" | "status"> | null;
}

export interface DocumentInput {
  project_id?: string | null;
  name: string;
  file_url: string;
  file_type: DocumentType;
  file_size?: number | null;
  related_entity?: string | null;
  related_entity_id?: string | null;
}

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function uploadDocumentFile(file: File, userId: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB`);
  }
  const path = `${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function getDocumentSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error("No se pudo generar la URL del archivo");
  return data.signedUrl;
}

export async function deleteDocumentFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from("documents").remove([path]);
  if (error) throw error;
}

export async function fetchDocuments(projectId?: string): Promise<DocumentWithProject[]> {
  let query = supabase
    .from("documents")
    .select("*, project:projects(id, name, status)")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DocumentWithProject[];
}

export async function createDocument(input: DocumentInput): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

export async function deleteDocumentRow(id: string): Promise<{ file_url: string }> {
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .select("file_url")
    .single();
  if (error) throw error;
  return data as { file_url: string };
}