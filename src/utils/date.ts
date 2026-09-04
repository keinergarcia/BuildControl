import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "—";
  return format(date, "dd MMM yyyy", { locale: es });
}

export function formatTime(timeStr: string): string {
  return timeStr?.slice(0, 5) ?? "";
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
