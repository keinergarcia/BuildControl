// Cliente de la capa IA (React -> Supabase Edge Function -> proveedor).
// Si la función no está desplegada o VITE_AI_ENABLED es falso, todo el
// asistente usa el motor local determinista (insights.ts), que garantiza
// respuestas con datos reales.

import { supabase } from "@/lib/supabase";

export type AiTask = "chat" | "ocr" | "predict";

const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const enabled = import.meta.env.VITE_AI_ENABLED === "true";

export interface AiResult {
  served: boolean;
  text?: string;
}

export async function callAi(
  task: AiTask,
  payload: Record<string, unknown>,
  image?: string
): Promise<AiResult | null> {
  if (!enabled || !baseUrl) return null;

  try {
    // La Edge Function exige autenticación JWT; adjuntamos el token de sesión.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

    const res = await fetch(`${baseUrl}/functions/v1/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task, payload, image }),
      signal: AbortSignal.timeout(20000),
    });
    const data2 = (await res.json()) as {
      served: boolean;
      reason?: string;
      result?: string;
    };
    if (!data2.served) return null;
    return { served: true, text: typeof data2.result === "string" ? data2.result : undefined };
  } catch {
    return null;
  }
}