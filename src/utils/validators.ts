import { z } from "zod";

// Límites de longitud de texto (P2 auditoría QA: campos sin max-length).
const MAX_NAME = 120;
const MAX_DESC = 500;
const MAX_PHONE = 30;
const MAX_DOC = 40;
const MAX_ADDRESS = 200;
const MAX_NOTES = 1000;
const MAX_REASON = 300;

const nameField = (label: string) =>
  z.string().min(1, `${label} requerido`).max(MAX_NAME, `Máximo ${MAX_NAME} caracteres`);

const optionalText = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres`).optional().nullable();

export const projectSchema = z
  .object({
    name: nameField("Nombre"),
    description: optionalText(MAX_DESC),
    client_id: z.string().uuid().optional().nullable(),
    location: optionalText(MAX_ADDRESS),
    project_type: optionalText(MAX_NAME),
    status: z.enum(["planificacion", "activo", "pausado", "finalizado", "cancelado"]),
    start_date: z.string().optional().nullable(),
    planned_end_date: z.string().optional().nullable(),
    notes: optionalText(MAX_NOTES),
  })
  .refine(
    (data) =>
      !data.start_date ||
      !data.planned_end_date ||
      data.planned_end_date >= data.start_date,
    {
      message: "La fecha fin debe ser posterior o igual a la fecha inicio",
      path: ["planned_end_date"],
    }
  );

export const clientSchema = z.object({
  name: nameField("Nombre"),
  company: optionalText(MAX_NAME),
  phone: optionalText(MAX_PHONE),
  email: z
    .string()
    .email("Email inválido")
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal(""))
    .nullable(),
  document_type: optionalText(MAX_NAME),
  document_number: optionalText(MAX_DOC),
  address: optionalText(MAX_ADDRESS),
  notes: optionalText(MAX_NOTES),
});

export const supplierSchema = z.object({
  name: nameField("Nombre"),
  phone: optionalText(MAX_PHONE),
  email: z
    .string()
    .email("Email inválido")
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal(""))
    .nullable(),
  address: optionalText(MAX_ADDRESS),
  notes: optionalText(MAX_NOTES),
});

export const contractSchema = z.object({
  contract_type: z.enum([
    "precio_fijo", "pago_por_dia", "pago_semanal",
    "pago_quincenal", "pago_mensual", "pago_por_avance", "otro",
  ]),
  total_value: z.coerce.number().positive("El valor del contrato debe ser mayor a 0"),
  daily_rate: z.coerce.number().nonnegative("La tarifa diaria no puede ser negativa").optional().nullable(),
  start_date: z.string().min(1, "Fecha requerida"),
  planned_end_date: z.string().optional().nullable(),
  conditions: optionalText(MAX_NOTES),
  notes: optionalText(MAX_NOTES),
});

export const expenseSchema = z.object({
  description: z.string().min(1, "Descripción requerida").max(MAX_DESC, `Máximo ${MAX_DESC} caracteres`),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  expense_date: z.string().min(1, "Fecha requerida"),
  expense_time: z.string().optional().nullable(),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: optionalText(MAX_NOTES),
});

export const workerSchema = z.object({
  name: nameField("Nombre"),
  phone: optionalText(MAX_PHONE),
  document_type: optionalText(MAX_NAME),
  document_number: optionalText(MAX_DOC),
  role: z.string().min(1, "Cargo requerido").max(MAX_NAME, `Máximo ${MAX_NAME} caracteres`),
  payment_type: z.enum(["diario", "semanal", "quincenal", "mensual", "por_trabajo", "otro"]),
  daily_rate: z.coerce.number().nonnegative("La tarifa diaria no puede ser negativa").optional().nullable(),
  notes: optionalText(MAX_NOTES),
});

export const workerPaymentSchema = z.object({
  worker_id: z.string().uuid("Selecciona un trabajador"),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  payment_date: z.string().min(1, "Fecha requerida"),
  payment_time: z.string().optional().nullable(),
  concept: z.string().min(1, "Concepto requerido").max(MAX_DESC, `Máximo ${MAX_DESC} caracteres`),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: optionalText(MAX_NOTES),
});

export const incomeSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  payment_date: z.string().min(1, "Fecha requerida"),
  payment_time: z.string().optional().nullable(),
  concept: z.string().min(1, "Concepto requerido").max(MAX_DESC, `Máximo ${MAX_DESC} caracteres`),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: optionalText(MAX_NOTES),
});

export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  withdrawal_date: z.string().min(1, "Fecha requerida"),
  withdrawal_time: z.string().optional().nullable(),
  reason: z.string().min(1, "Motivo requerido").max(MAX_REASON, `Máximo ${MAX_REASON} caracteres`),
  notes: optionalText(MAX_NOTES),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type WorkerFormData = z.infer<typeof workerSchema>;