import { useState } from "react";
import { toast } from "sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateDailyRecord,
  useUpdateDailyRecord,
} from "@/features/daily-records/api/useDailyRecords";
import type { DailyRecordInput } from "@/features/daily-records/api/dailyRecords";
import type { ProjectDailyRecord } from "@/types";
import { Loader2 } from "lucide-react";

const WEATHER_OPTIONS = [
  { value: "Despejado", label: "Despejado" },
  { value: "Parcialmente nublado", label: "Parcialmente nublado" },
  { value: "Nublado", label: "Nublado" },
  { value: "Lluvia", label: "Lluvia" },
  { value: "Tormenta", label: "Tormenta" },
  { value: "Ventoso", label: "Ventoso" },
  { value: "Calor extremo", label: "Calor extremo" },
];

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const toForm = (r: ProjectDailyRecord): DailyRecordInput => ({
  project_id: r.project_id,
  record_date: r.record_date,
  weather: r.weather ?? "",
  workers_present: r.workers_present ?? null,
  notes: r.notes ?? "",
  activities: r.activities ?? "",
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string | null;
  record: ProjectDailyRecord | null;
}

export function DailyRecordForm({
  open,
  onOpenChange,
  projectId,
  userId,
  record,
}: Props) {
  const isEdit = Boolean(record);
  const base = record ? toForm(record) : null;

  const [date, setDate] = useState(base?.record_date ?? todayISO());
  const [weather, setWeather] = useState(base?.weather ?? "");
  const [workers, setWorkers] = useState(String(base?.workers_present ?? ""));
  const [notes, setNotes] = useState(base?.notes ?? "");
  const [activities, setActivities] = useState(base?.activities ?? "");

  const createMutation = useCreateDailyRecord();
  const updateMutation = useUpdateDailyRecord();

  const handleSubmit = () => {
    if (!date) {
      toast.error("Selecciona la fecha del registro");
      return;
    }

    const input: DailyRecordInput = {
      project_id: projectId,
      user_id: userId,
      record_date: date,
      weather: weather || null,
      workers_present: workers !== "" ? Number(workers) : null,
      notes: notes || null,
      activities: activities || null,
    };

    const opts = {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(isEdit ? "Registro actualizado" : "Registro guardado");
      },
      onError: () =>
        toast.error(isEdit ? "No se pudo actualizar el registro" : "No se pudo guardar el registro", {
          description: isEdit
            ? undefined
            : "Verifica que no exista ya un registro para este día.",
        }),
    };

    if (isEdit && record) {
      updateMutation.mutate({ id: record.id, input }, opts);
    } else {
      createMutation.mutate(input, opts);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar registro" : "Registrar avance diario"}</DialogTitle>
          <DialogDescription>
            Registra el avance de obra, condiciones y personal presente en este día.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="record-date">Fecha</Label>
              <Input
                id="record-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="record-weather">Clima</Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger id="record-weather">
                  <SelectValue placeholder="Clima" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_OPTIONS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="record-workers">Trabajadores presentes</Label>
            <Input
              id="record-workers"
              type="number"
              min={0}
              value={workers}
              onChange={(e) => setWorkers(e.target.value)}
              placeholder="Ej. 5"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="record-activities">Actividades realizadas</Label>
            <Textarea
              id="record-activities"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              rows={3}
              placeholder="Ej. Fundición de cimientos, instalación de redes eléctricas..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="record-notes">Observaciones</Label>
            <Textarea
              id="record-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Novedades, riesgos, pendientes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Guardar registro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
