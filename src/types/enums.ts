export type ProjectStatus =
  | "planificacion"
  | "activo"
  | "pausado"
  | "finalizado"
  | "cancelado";

export type ContractType =
  | "precio_fijo"
  | "pago_por_dia"
  | "pago_semanal"
  | "pago_quincenal"
  | "pago_mensual"
  | "pago_por_avance"
  | "otro";

export type PaymentMethod =
  | "efectivo"
  | "transferencia"
  | "tarjeta_credito"
  | "tarjeta_debito"
  | "cheque"
  | "otro";

export type WorkerPaymentType =
  | "diario"
  | "semanal"
  | "quincenal"
  | "mensual"
  | "por_trabajo"
  | "otro";

export type WorkerStatus = "activo" | "inactivo";

export type DocumentType =
  | "factura"
  | "recibo"
  | "contrato"
  | "foto"
  | "plano"
  | "otro";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  factura: "Factura",
  recibo: "Recibo",
  contrato: "Contrato",
  foto: "Fotografía",
  plano: "Plano",
  otro: "Otro",
};

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planificacion: "Planificación",
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planificacion: "text-info",
  activo: "text-success",
  pausado: "text-warning",
  finalizado: "text-muted-foreground",
  cancelado: "text-destructive",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  precio_fijo: "Precio Fijo",
  pago_por_dia: "Pago por Día",
  pago_semanal: "Pago Semanal",
  pago_quincenal: "Pago Quincenal",
  pago_mensual: "Pago Mensual",
  pago_por_avance: "Pago por Avance",
  otro: "Otro",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_credito: "Tarjeta de Crédito",
  tarjeta_debito: "Tarjeta de Débito",
  cheque: "Cheque",
  otro: "Otro",
};

export const WORKER_PAYMENT_TYPE_LABELS: Record<WorkerPaymentType, string> = {
  diario: "Diario",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  por_trabajo: "Por Trabajo",
  otro: "Otro",
};
