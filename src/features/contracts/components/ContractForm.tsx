import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { contractSchema } from "@/utils/validators";
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
import { CONTRACT_TYPE_LABELS, type Project } from "@/types";
import type { ContractType } from "@/types/enums";
import type { ContractInput } from "@/features/contracts/api/contracts";


const contractFormSchema = contractSchema
  .extend({
    project_id: z.string().uuid("Selecciona un proyecto"),
  })
  .refine(
    (data) => !data.start_date || !data.planned_end_date || data.planned_end_date >= data.start_date,
    { message: "La fecha fin debe ser posterior a la fecha inicio", path: ["planned_end_date"] }
  );

type ContractFormData = z.infer<typeof contractFormSchema>;

const CONTRACT_TYPE_OPTIONS = (Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(
  (t) => ({ value: t, label: CONTRACT_TYPE_LABELS[t] })
);

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractFormData | null;
  projects: Project[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (input: ContractInput) => void;
  title: string;
  description: string;
}

function toFormValue(
  contract: ContractFormData | null,
  fixedProjectId?: string
): ContractFormData {
  return {
    project_id: contract?.project_id ?? fixedProjectId ?? "",
    contract_type: contract?.contract_type ?? "precio_fijo",
    total_value: contract?.total_value ?? 0,
    daily_rate: contract?.daily_rate ?? null,
    start_date: contract?.start_date ?? "",
    planned_end_date: contract?.planned_end_date ?? "",
    conditions: contract?.conditions ?? "",
    notes: contract?.notes ?? "",
  };
}

function buildContractInput(data: ContractFormData): ContractInput {
  return {
    project_id: data.project_id,
    contract_type: data.contract_type,
    total_value: data.total_value,
    daily_rate:
      typeof data.daily_rate === "number" && data.daily_rate > 0
        ? data.daily_rate
        : null,
    start_date: data.start_date,
    planned_end_date: toNull(data.planned_end_date),
    conditions: toNull(data.conditions),
    notes: toNull(data.notes),
  };
}

export function ContractForm({
  open,
  onOpenChange,
  contract,
  projects,
  fixedProjectId,
  isSubmitting,
  onSave,
  title,
  description,
}: ContractFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: toFormValue(contract, fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(contract, fixedProjectId));
  }, [contract, open, fixedProjectId, reset]);

  const isDaily = watch("contract_type") === "pago_por_dia";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildContractInput(data)))}
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
            <Label>Tipo de contrato</Label>
            <Controller
              control={control}
              name="contract_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_value">
                {isDaily ? "Valor por día" : "Valor del contrato"} *
              </Label>
              <Controller
                control={control}
                name="total_value"
                render={({ field }) => (
                  <MoneyInput
                    id="total_value"
                    value={field.value}
                    onChange={field.onChange}
                    ariaInvalid={!!errors.total_value}
                  />
                )}
              />
              {errors.total_value && (
                <p className="text-sm text-destructive">{errors.total_value.message}</p>
              )}
            </div>
            {isDaily && (
              <div className="space-y-2">
                <Label htmlFor="daily_rate">Tarifa diaria</Label>
                <Controller
                  control={control}
                  name="daily_rate"
                  render={({ field }) => (
                    <MoneyInput
                      id="daily_rate"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de inicio *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
                aria-invalid={!!errors.start_date}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_end_date">Fecha fin prevista</Label>
              <Input
                id="planned_end_date"
                type="date"
                {...register("planned_end_date")}
                aria-invalid={!!errors.planned_end_date}
              />
              {errors.planned_end_date && (
                <p className="text-sm text-destructive">{errors.planned_end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Condiciones</Label>
            <Textarea
              id="conditions"
              placeholder="Condiciones de pago y avance"
              {...register("conditions")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" placeholder="Notas del contrato" {...register("notes")} />
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
