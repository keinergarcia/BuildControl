import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { incomeSchema } from "@/utils/validators";
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
import { PAYMENT_METHOD_LABELS, type Project, type Client } from "@/types";
import type { PaymentMethod } from "@/types/enums";
import type { IncomeInput } from "@/features/income/api/income";
import { todayStr } from "@/utils/date";


const incomeFormSchema = incomeSchema.extend({
  project_id: z.string().uuid("Selecciona una obra"),
}).extend({
  client_id: z.string().uuid().optional().or(z.literal("")),
});

type IncomeFormData = z.infer<typeof incomeFormSchema>;

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] })
);

interface IncomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income: IncomeInput | null;
  projects: Project[];
  clients: Client[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (input: IncomeInput) => void;
  title: string;
  description: string;
}

function toFormValue(
  income: IncomeInput | null,
  fixedProjectId?: string
): IncomeFormData {
  return {
    project_id: income?.project_id ?? fixedProjectId ?? "",
    client_id: income?.client_id ?? "",
    amount: income?.amount ?? 0,
    payment_date: income?.payment_date ?? todayStr(),
    payment_time: income?.payment_time ?? "",
    concept: income?.concept ?? "",
    payment_method: income?.payment_method ?? null,
    notes: income?.notes ?? "",
  };
}

function buildIncomeInput(data: IncomeFormData): IncomeInput {
  return {
    project_id: data.project_id,
    client_id: toNull(data.client_id),
    amount: data.amount,
    payment_date: data.payment_date,
    payment_time: toNull(data.payment_time),
    concept: data.concept,
    payment_method: data.payment_method,
    notes: toNull(data.notes),
  };
}

export function IncomeForm({
  open,
  onOpenChange,
  income,
  projects,
  clients,
  fixedProjectId,
  isSubmitting,
  onSave,
  title,
  description,
}: IncomeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: toFormValue(income, fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(income, fixedProjectId));
  }, [income, open, fixedProjectId, reset]);

  const selectedProject = projects.find((p) => p.id === fixedProjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildIncomeInput(data)))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label>Obra *</Label>
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
                    <SelectValue placeholder="Seleccionar obra" />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin cliente</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company && c.name !== c.company
                            ? `${c.name} (${c.company})`
                            : c.name}
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

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto *</Label>
            <Input
              id="concept"
              placeholder="Ej. Anticipo, primer pago, abono"
              {...register("concept")}
              aria-invalid={!!errors.concept}
            />
            {errors.concept && (
              <p className="text-sm text-destructive">{errors.concept.message}</p>
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
              <Label htmlFor="payment_date">Fecha *</Label>
              <Input
                id="payment_date"
                type="date"
                {...register("payment_date")}
                aria-invalid={!!errors.payment_date}
              />
              {errors.payment_date && (
                <p className="text-sm text-destructive">{errors.payment_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_time">Hora</Label>
              <Input id="payment_time" type="time" {...register("payment_time")} />
            </div>
          </div>

          {fixedProjectId && selectedProject?.client_id && clients.length > 0 && (
            <p className="text-xs text-muted-foreground">
              El cliente de esta obra se puede seleccionar arriba para asociarlo al ingreso.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales del ingreso"
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
