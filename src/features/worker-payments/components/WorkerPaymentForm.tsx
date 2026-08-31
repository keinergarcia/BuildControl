import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { workerPaymentSchema } from "@/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Worker } from "@/types";
import type { WorkerPaymentInput } from "@/features/worker-payments/api/workerPayments";
import { todayStr } from "@/utils/date";


const workerPaymentFormSchema = workerPaymentSchema.extend({
  project_id: z.string().uuid("Selecciona una obra"),
});

type WorkerPaymentFormData = z.infer<typeof workerPaymentFormSchema>;

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] })
);

interface WorkerPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: WorkerPaymentInput | null;
  projects: Project[];
  workers: Worker[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (input: WorkerPaymentInput) => void;
  title: string;
  description: string;
}

function toFormValue(
  payment: WorkerPaymentInput | null,
  fixedProjectId?: string
): WorkerPaymentFormData {
  return {
    project_id: payment?.project_id ?? fixedProjectId ?? "",
    worker_id: payment?.worker_id ?? "",
    amount: payment?.amount ?? 0,
    payment_date: payment?.payment_date ?? todayStr(),
    payment_time: payment?.payment_time ?? "",
    concept: payment?.concept ?? "",
    payment_method: payment?.payment_method ?? null,
    notes: payment?.notes ?? "",
  };
}

export function buildWorkerPaymentInput(data: WorkerPaymentFormData): WorkerPaymentInput {
  return {
    project_id: data.project_id,
    worker_id: data.worker_id,
    amount: data.amount,
    payment_date: data.payment_date,
    payment_time: toNull(data.payment_time),
    concept: data.concept,
    payment_method: data.payment_method,
    notes: toNull(data.notes),
  };
}

export function WorkerPaymentForm({
  open,
  onOpenChange,
  payment,
  projects,
  workers,
  fixedProjectId,
  isSubmitting,
  onSave,
  title,
  description,
}: WorkerPaymentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WorkerPaymentFormData>({
    resolver: zodResolver(workerPaymentFormSchema),
    defaultValues: toFormValue(payment, fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(payment, fixedProjectId));
  }, [payment, open, fixedProjectId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildWorkerPaymentInput(data)))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-2">
              <Label>Trabajador *</Label>
              <Controller
                control={control}
                name="worker_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.worker_id && (
                <p className="text-sm text-destructive">{errors.worker_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="concept">Concepto *</Label>
              <Input
                id="concept"
                placeholder="Ej. Pago semanal, anticipo"
                {...register("concept")}
                aria-invalid={!!errors.concept}
              />
              {errors.concept && (
                <p className="text-sm text-destructive">{errors.concept.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("amount", { valueAsNumber: true })}
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales del pago"
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
