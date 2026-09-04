import type { ProjectStatus } from "@/types/enums";
import { PROJECT_STATUS_LABELS } from "@/types";

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));

// Mapa de transiciones válidas de estado. Finalizado y cancelado son estados
// terminales: no se puede volver a uno activo (P2 auditoría QA).
export const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planificacion: ["activo", "pausado", "cancelado"],
  activo: ["pausado", "finalizado", "cancelado"],
  pausado: ["activo", "finalizado", "cancelado"],
  finalizado: [],
  cancelado: [],
};
