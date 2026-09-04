import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { withdrawalSchema } from "@/utils/validators";
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
import type { Project } from "@/types";
import type { WithdrawalInput } from "@/features/withdrawals/api/withdrawals";
import { todayStr } from "@/utils/date";


const withdrawalFormSchema = withdrawalSchema.extend({
  project_id: z.string().uuid("Selecciona una obra"),
});

type WithdrawalFormData = z.infer<typeof withdrawalFormSchema>;

interface WithdrawalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: WithdrawalInput | null;
  projects: Project[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (input: WithdrawalInput) => void;
  title: string;
  description: string;
}

function toFormValue(
  withdrawal: WithdrawalInput | null,
  fixedProjectId?: string
): WithdrawalFormData {
  return {
    project_id: withdrawal?.project_id ?? fixedProjectId ?? "",
    amount: withdrawal?.amount ?? 0,
    withdrawal_date: withdrawal?.withdrawal_date ?? todayStr(),
    withdrawal_time: withdrawal?.withdrawal_time ?? "",
    reason: withdrawal?.reason ?? "",
    notes: withdrawal?.notes ?? "",
  };
}

function buildWithdrawalInput(data: WithdrawalFormData): WithdrawalInput {
  return {
    project_id: data.project_id,
    amount: data.amount,
    withdrawal_date: data.withdrawal_date,
    withdrawal_time: toNull(data.withdrawal_time),
    reason: data.reason,
    notes: toNull(data.notes),
  };
}

export function WithdrawalForm({
  open,
  onOpenChange,
  withdrawal,
  projects,
  fixedProjectId,
  isSubmitting,
  onSave,
  title,
  description,
}: WithdrawalFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: toFormValue(withdrawal, fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(withdrawal, fixedProjectId));
  }, [withdrawal, open, fixedProjectId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildWithdrawalInput(data)))}
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

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Input
              id="reason"
              placeholder="Ej. Gastos personales, anticipo de nómina"
              {...register("reason")}
              aria-invalid={!!errors.reason}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
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
              <Label htmlFor="withdrawal_date">Fecha *</Label>
              <Input
                id="withdrawal_date"
                type="date"
                {...register("withdrawal_date")}
                aria-invalid={!!errors.withdrawal_date}
              />
              {errors.withdrawal_date && (
                <p className="text-sm text-destructive">{errors.withdrawal_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal_time">Hora</Label>
              <Input id="withdrawal_time" type="time" {...register("withdrawal_time")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales del retiro"
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
