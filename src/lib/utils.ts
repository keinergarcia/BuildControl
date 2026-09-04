import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convierte cadenas vacías o nulas a null (útiles para campos opcionales en formularios). */
export function toNull(v: string | null | undefined): string | null {
  return v == null || v === "" ? null : v;
}

/** Devuelve las iniciales (máx. 2) de un nombre, en mayúsculas. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Sanitiza un nombre de archivo para usarlo seguro en rutas de Storage. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 120);
}
