import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return "—";
  return format(date, "dd MMM yyyy", { locale: es });
}

export function formatTime(timeStr: string): string {
  return timeStr?.slice(0, 5) ?? "";
}

export function daysBetween(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (!isValid(startDate) || !isValid(endDate)) return 0;
  return differenceInDays(endDate, startDate);
}

export function daysElapsed(startDate: string): number {
  return daysBetween(startDate, new Date().toISOString().slice(0, 10));
}

export function daysRemaining(plannedEndDate: string): number {
  return daysBetween(new Date().toISOString().slice(0, 10), plannedEndDate);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimeStr(): string {
  return new Date().toTimeString().slice(0, 5);
}
