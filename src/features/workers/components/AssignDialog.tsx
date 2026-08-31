import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card } from "@/components/ui/card";
import { useProjects } from "@/features/projects/api/useProjects";
import {
  useWorkerAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/features/workers/api/useAssignments";
import { formatDate, todayStr } from "@/utils/date";
import type { Worker } from "@/types";
import type { WorkerAssignment } from "@/types";
import { Loader2, Plus, Trash2, ArrowRight } from "lucide-react";

export function AssignDialog({
  open,
  onOpenChange,
  worker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
}) {
  const { data: projects = [] } = useProjects({});
  const { data: assignments = [], isLoading } = useWorkerAssignments();
  const createMutation = useCreateAssignment();
  const deleteMutation = useDeleteAssignment();

  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [rateOverride, setRateOverride] = useState("");

  useEffect(() => {
    if (open) {
      setProjectId("");
      setStartDate(todayStr());
      setEndDate("");
      setRateOverride("");
    }
  }, [open]);

  const workerAssignments = useMemo(
    () =>
      assignments.filter(
        (a) => a.worker_id === worker?.id
      ) as Array<WorkerAssignment & { project?: { id: string; name: string; status: string } | null }>,
    [assignments, worker]
  );

  const handleCreate = () => {
    if (!worker || !projectId) return;
    createMutation.mutate(
      {
        worker_id: worker.id,
        project_id: projectId,
        start_date: startDate,
        end_date: endDate || null,
        daily_rate_override: rateOverride ? Number(rateOverride) : null,
      },
      {
        onSuccess: () => {
          setProjectId("");
          setStartDate(todayStr());
          setEndDate("");
          setRateOverride("");
          toast.success("Trabajador asignado a la obra");
        },
        onError: () =>
          toast.error("No se pudo asignar al trabajador", {
            description: "Verifica que el trabajador no esté ya asignado.",
          }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar a obra</DialogTitle>
          <DialogDescription>
            {worker ? `Asocia a ${worker.name} a una obra y define su vigencia.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Obra *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="assign-start">Inicio</Label>
              <Input
                id="assign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-end">Fin</Label>
              <Input
                id="assign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-rate">Tarifa día (opcional)</Label>
              <Input
                id="assign-rate"
                type="number"
                inputMode="numeric"
                value={rateOverride}
                onChange={(e) => setRateOverride(e.target.value)}
                placeholder="Ej. 90000"
              />
            </div>
          </div>

          <Button
            variant="glow"
            className="w-full"
            onClick={handleCreate}
            disabled={!projectId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Asignar a obra
          </Button>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Obras asignadas
            </p>
            {isLoading && (
              <div className="flex h-16 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && workerAssignments.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin asignaciones.
              </p>
            )}
            <div className="space-y-1.5">
              {workerAssignments.map((a) => (
                <Card key={a.id} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {a.project?.name ?? "—"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDate(a.start_date)}
                        <ArrowRight className="h-3 w-3" />
                        {a.end_date ? formatDate(a.end_date) : "Activa"}
                        {a.daily_rate_override
                          ? ` · ${Number(a.daily_rate_override).toLocaleString("es-CO")}/día`
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => {
                        deleteMutation.mutate(a.id, {
                          onSuccess: () =>
                            toast.success("Asignación eliminada"),
                          onError: () =>
                            toast.error("No se pudo quitar la asignación"),
                        });
                      }}
                      aria-label="Quitar asignación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}