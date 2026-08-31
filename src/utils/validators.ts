import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().min(1, "Nombre requerido"),
    description: z.string().optional().nullable(),
    client_id: z.string().uuid().optional().nullable(),
    location: z.string().optional().nullable(),
    project_type: z.string().optional().nullable(),
    status: z.enum(["planificacion", "activo", "pausado", "finalizado", "cancelado"]),
    start_date: z.string().optional().nullable(),
    planned_end_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
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
  name: z.string().min(1, "Nombre requerido"),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  document_type: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const contractSchema = z.object({
  contract_type: z.enum([
    "precio_fijo", "pago_por_dia", "pago_semanal",
    "pago_quincenal", "pago_mensual", "pago_por_avance", "otro",
  ]),
  total_value: z.coerce.number().min(0, "Valor requerido"),
  daily_rate: z.coerce.number().optional().nullable(),
  start_date: z.string().min(1, "Fecha requerida"),
  planned_end_date: z.string().optional().nullable(),
  conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  expense_date: z.string().min(1, "Fecha requerida"),
  expense_time: z.string().optional().nullable(),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const workerSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional().nullable(),
  document_type: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  role: z.string().min(1, "Cargo requerido"),
  payment_type: z.enum(["diario", "semanal", "quincenal", "mensual", "por_trabajo", "otro"]),
  daily_rate: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const workerPaymentSchema = z.object({
  worker_id: z.string().uuid("Selecciona un trabajador"),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  payment_date: z.string().min(1, "Fecha requerida"),
  payment_time: z.string().optional().nullable(),
  concept: z.string().min(1, "Concepto requerido"),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const incomeSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  payment_date: z.string().min(1, "Fecha requerida"),
  payment_time: z.string().optional().nullable(),
  concept: z.string().min(1, "Concepto requerido"),
  payment_method: z.enum(["efectivo", "transferencia", "tarjeta_credito", "tarjeta_debito", "cheque", "otro"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive("Valor debe ser positivo"),
  withdrawal_date: z.string().min(1, "Fecha requerida"),
  withdrawal_time: z.string().optional().nullable(),
  reason: z.string().min(1, "Motivo requerido"),
  notes: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type ContractFormData = z.infer<typeof contractSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type WorkerFormData = z.infer<typeof workerSchema>;
export type WorkerPaymentFormData = z.infer<typeof workerPaymentSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
