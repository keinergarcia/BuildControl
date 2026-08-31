import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { workerSchema, type WorkerFormData } from "@/utils/validators";
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
import { WORKER_PAYMENT_TYPE_LABELS } from "@/types";
import type { WorkerPaymentType, WorkerStatus } from "@/types/enums";
import type { Worker } from "@/types";
import type { WorkerInput } from "@/features/workers/api/workers";


const DOCUMENT_TYPES = [
  { value: "cc", label: "Cédula de ciudadanía" },
  { value: "nit", label: "NIT" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "otro", label: "Otro" },
];

const PAYMENT_TYPE_OPTIONS = (Object.keys(WORKER_PAYMENT_TYPE_LABELS) as WorkerPaymentType[]).map(
  (t) => ({ value: t, label: WORKER_PAYMENT_TYPE_LABELS[t] })
);

function toFormValue(worker: Worker | null): WorkerFormData {
  return {
    name: worker?.name ?? "",
    phone: worker?.phone ?? "",
    document_type: worker?.document_type ?? "",
    document_number: worker?.document_number ?? "",
    role: worker?.role ?? "",
    payment_type: worker?.payment_type ?? "diario",
    daily_rate: worker?.daily_rate ?? null,
    notes: worker?.notes ?? "",
  };
}

export function buildWorkerInput(data: WorkerFormData, status?: WorkerStatus): WorkerInput {
  return {
    name: data.name,
    phone: toNull(data.phone),
    document_type: toNull(data.document_type),
    document_number: toNull(data.document_number),
    role: data.role,
    payment_type: data.payment_type,
    daily_rate:
      typeof data.daily_rate === "number" && data.daily_rate > 0
        ? data.daily_rate
        : null,
    notes: toNull(data.notes),
    status: status ?? "activo",
  };
}

interface WorkerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  isSubmitting: boolean;
  onSave: (input: WorkerInput) => void;
  title: string;
  description: string;
}

export function WorkerForm({
  open,
  onOpenChange,
  worker,
  isSubmitting,
  onSave,
  title,
  description,
}: WorkerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WorkerFormData & { status?: WorkerStatus }>({
    resolver: zodResolver(workerSchema),
    defaultValues: { ...toFormValue(worker), status: worker?.status ?? "activo" },
  });

  useEffect(() => {
    reset({ ...toFormValue(worker), status: worker?.status ?? "activo" });
  }, [worker, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildWorkerInput(data, data.status)))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej. Carlos Gómez"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Input
              id="role"
              placeholder="Ej. Maestro, Ayudante, Oficial"
              {...register("role")}
              aria-invalid={!!errors.role}
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Forma de pago</Label>
              <Controller
                control={control}
                name="payment_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Valor diario / tarifa</Label>
              <Input
                id="daily_rate"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("daily_rate", { valueAsNumber: true })}
                placeholder="Ej. 80000"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+57 300 000 0000"
                {...register("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "activo"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Controller
                control={control}
                name="document_type"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Número de documento</Label>
              <Input
                id="document_number"
                placeholder="Ej. 1234567890"
                {...register("document_number")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas del trabajador"
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
