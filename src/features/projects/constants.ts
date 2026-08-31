import type { ProjectStatus } from "@/types/enums";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/types";

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }));

export const STATUS_COLORS = PROJECT_STATUS_COLORS;

export const PROJECT_TYPE_OPTIONS = [
  "Residencial",
  "Comercial",
  "Industrial",
  "Remodelación",
  "Infraestructura",
  "Otro",
];
