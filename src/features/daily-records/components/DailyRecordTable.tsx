import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { formatDate } from "@/utils/date";
import {
  useDailyRecords,
  useDeleteDailyRecord,
} from "@/features/daily-records/api/useDailyRecords";
import { DailyRecordForm } from "@/features/daily-records/components/DailyRecordForm";
import type { ProjectDailyRecord } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CloudSun,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  projectId: string;
  userId: string | null;
}

export function DailyRecordTable({ projectId, userId }: Props) {
  const {
    data: records = [],
    isLoading,
    isError,
  } = useDailyRecords(projectId);
  const deleteMutation = useDeleteDailyRecord();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDailyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDailyRecord | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: ProjectDailyRecord) => {
    setEditing(r);
    setFormOpen(true);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Bitácora de avance y condiciones por día de obra.
          </p>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Registrar día
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> No se pudieron cargar los registros.
          </p>
        )}

        {!isLoading && !isError && records.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CloudSun className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aún no hay registros diarios para este proyecto. Registra el primer avance.
            </p>
          </div>
        )}

        {!isLoading && !isError && records.length > 0 && (
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatDate(r.record_date)}
                    </span>
                    {r.weather && <Badge variant="secondary">{r.weather}</Badge>}
                    {r.workers_present != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {r.workers_present} trab.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(r)}
                      aria-label={`Editar registro ${formatDate(r.record_date)}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(r)}
                      aria-label={`Eliminar registro ${formatDate(r.record_date)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {r.activities && (
                  <p className="mt-2 text-sm">{r.activities}</p>
                )}
                {r.notes && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <DailyRecordForm
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        userId={userId}
        record={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Eliminar registro"
        name={deleteTarget ? formatDate(deleteTarget.record_date) : ""}
        prefix="¿Eliminar el registro del "
        suffix="? Esta acción no se puede deshacer."
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Registro eliminado");
              setDeleteTarget(null);
            },
            onError: () => toast.error("No se pudo eliminar el registro"),
          });
        }}
      />
    </Card>
  );
}
