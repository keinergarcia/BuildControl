import { callAi } from "@/features/assistant/api/aiProxy";

export interface OcrResult {
  supplier: string | null;
  date: string | null;
  total: number | null;
  description: string | null;
}

export interface OcrOutcome {
  served: boolean;
  parsed: OcrResult | null;
  raw?: string;
}

function extractJson(text?: string): OcrResult | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]);
    return {
      supplier: typeof obj.supplier === "string" ? obj.supplier : null,
      date: typeof obj.date === "string" ? obj.date : null,
      total: typeof obj.total === "number" ? obj.total : null,
      description: typeof obj.description === "string" ? obj.description : null,
    };
  } catch {
    return null;
  }
}

export async function runOcr(imageDataUrl: string): Promise<OcrOutcome> {
  const res = await callAi(
    "ocr",
    { hint: "Extrae los campos de esta factura de materiales de construcción." },
    imageDataUrl
  );

  if (!res?.served) return { served: false, parsed: null };

  const parsed = extractJson(res.text);
  return { served: true, parsed, raw: res.text };
}

export async function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
