import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { expenseSchema } from "@/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_METHOD_LABELS, type Project } from "@/types";
import type { PaymentMethod } from "@/types/enums";
import type { BudgetCategory, ExpenseCategory, Supplier } from "@/types";
import type { ExpenseInput } from "@/features/expenses/api/expenses";
import { todayStr } from "@/utils/date";


const expenseFormSchema = expenseSchema.extend({
  project_id: z.string().uuid("Selecciona un proyecto"),
}).extend({
  category_id: z.string().uuid().optional().or(z.literal("")),
  expense_category_id: z.string().uuid().optional().or(z.literal("")),
  supplier_id: z.string().uuid().optional().or(z.literal("")),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] })
);

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseInput | null;
  projects: Project[];
  categories: BudgetCategory[];
  expenseCategories: ExpenseCategory[];
  suppliers: Supplier[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (input: ExpenseInput) => void;
  title: string;
  description: string;
}

function toFormValue(
  expense: ExpenseInput | null,
  fixedProjectId?: string
): ExpenseFormData {
  return {
    project_id: expense?.project_id ?? fixedProjectId ?? "",
    description: expense?.description ?? "",
    amount: expense?.amount ?? 0,
    category_id: expense?.category_id ?? "",
    expense_category_id: expense?.expense_category_id ?? "",
    supplier_id: expense?.supplier_id ?? "",
    expense_date: expense?.expense_date ?? todayStr(),
    expense_time: expense?.expense_time ?? "",
    payment_method: expense?.payment_method ?? null,
    notes: expense?.notes ?? "",
  };
}

function buildExpenseInput(data: ExpenseFormData): ExpenseInput {
  return {
    project_id: data.project_id,
    description: data.description,
    amount: data.amount,
    category_id: toNull(data.category_id),
    expense_category_id: toNull(data.expense_category_id),
    supplier_id: toNull(data.supplier_id),
    expense_date: data.expense_date,
    expense_time: toNull(data.expense_time),
    payment_method: data.payment_method,
    notes: toNull(data.notes),
  };
}

export function ExpenseForm({
  open,
  onOpenChange,
  expense,
  projects,
  categories,
  expenseCategories,
  suppliers,
  fixedProjectId,
  isSubmitting,
  onSave,
  title,
  description,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: toFormValue(expense, fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(expense, fixedProjectId));
  }, [expense, open, fixedProjectId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildExpenseInput(data)))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label>Proyecto *</Label>
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={!!fixedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.project_id && (
              <p className="text-sm text-destructive">{errors.project_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="Ej. Cemento, arena, agregados"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  id="amount"
                  value={field.value}
                  onChange={field.onChange}
                  ariaInvalid={!!errors.amount}
                />
              )}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría (rubro)</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rubro del presupuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin rubro</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {expenseCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Categoría propia</Label>
                <Controller
                  control={control}
                  name="expense_category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría personalizada" />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Sin categoría</SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Controller
                control={control}
                name="supplier_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin proveedor</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Fecha *</Label>
              <Input
                id="expense_date"
                type="date"
                {...register("expense_date")}
                aria-invalid={!!errors.expense_date}
              />
              {errors.expense_date && (
                <p className="text-sm text-destructive">{errors.expense_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense_time">Hora</Label>
              <Input id="expense_time" type="time" {...register("expense_time")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales del gasto"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="glow" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
