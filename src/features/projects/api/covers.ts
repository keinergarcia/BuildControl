import { supabase } from "@/lib/supabase";
import { sanitizeFileName } from "@/lib/utils";

const COVER_BUCKET = "covers";

export async function uploadProjectCover(file: File, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function getProjectCoverSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(COVER_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error("No se pudo generar la URL de la portada");
  return data.signedUrl;
}

export async function deleteProjectCover(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(COVER_BUCKET).remove([path]);
  if (error) throw error;
}