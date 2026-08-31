import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PageTransition, FadeInUp, StaggerContainer } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/utils";
import { formatCOP } from "@/lib/money";
import { WORKER_PAYMENT_TYPE_LABELS } from "@/types";
import {
  useWorkers,
  useCreateWorker,
  useUpdateWorker,
  useDeleteWorker,
} from "@/features/workers/api/useWorkers";
import { WorkerForm } from "@/features/workers/components/WorkerForm";
import { AssignDialog } from "@/features/workers/components/AssignDialog";
import type { WorkerInput } from "@/features/workers/api/workers";
import type { Worker } from "@/types";
import {
  HardHat,
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Wallet,
  FolderKanban,
  AlertTriangle,
  Link2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function WorkersPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [assignTarget, setAssignTarget] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: workers = [], isLoading, isError, refetch } = useWorkers(search);
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker();
  const deleteMutation = useDeleteWorker();

  const { data: assignments = [] } = useQuery({
    queryKey: ["worker-assignment-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("worker_assignments").select("worker_id");
      if (error) throw error;
      return data as Array<{ worker_id: string }>;
    },
  });

  const projectCountByWorker = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      map.set(a.worker_id, (map.get(a.worker_id) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setFormOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trabajadores</h1>
            <p className="text-muted-foreground">
              Mano de obra de tus obras y su forma de pago
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo trabajador
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cargo o teléfono"
            className="pl-9"
          />
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-44 animate-pulse bg-secondary/60" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los trabajadores</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && workers.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <HardHat className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {search ? "Sin resultados" : "Aún no tienes trabajadores"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Prueba con otros términos."
                  : "Registra tu mano de obra para asignarla a obras y registrar sus pagos."}
              </p>
            </div>
            {!search && (
              <Button variant="glow" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo trabajador
              </Button>
            )}
          </Card>
        )}

        {!isLoading && !isError && workers.length > 0 && (
          <StaggerContainer>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <FadeInUp key={worker.id}>
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/40">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-bold text-white">
                            {initials(worker.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{worker.name}</h3>
                            <p className="truncate text-xs text-muted-foreground">
                              {worker.role}
                            </p>
                          </div>
                        </div>
                        {worker.status === "activo" ? (
                          <Badge variant="secondary" className="shrink-0">
                            <CheckCircle2 className="mr-1 h-3 w-3 text-success" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />
                            Inactivo
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 shrink-0" />
                          {WORKER_PAYMENT_TYPE_LABELS[worker.payment_type]}
                          {worker.daily_rate ? ` · ${formatCOP(Number(worker.daily_rate))}` : ""}
                        </p>
                        {worker.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {worker.phone}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <Badge variant="secondary" className="shrink-0">
                          <FolderKanban className="mr-1 h-3 w-3" />
                          {projectCountByWorker.get(worker.id) ?? 0} obras
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setAssignTarget(worker)}
                            aria-label="Asignar a obra"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(worker)}
                            aria-label="Editar trabajador"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({ id: worker.id, name: worker.name })
                            }
                            aria-label="Eliminar trabajador"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInUp>
              ))}
            </div>
          </StaggerContainer>
        )}

        <WorkerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          worker={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: WorkerInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Trabajador actualizado");
                  },
                  onError: () => toast.error("No se pudo actualizar el trabajador"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Trabajador creado", {
                    description: "Ya puedes asignarlo a una obra.",
                  });
                },
                onError: () => toast.error("No se pudo crear el trabajador"),
              });
            }
          }}
          title={editing ? "Editar trabajador" : "Nuevo trabajador"}
          description={
            editing
              ? "Actualiza la información de este trabajador."
              : "Registra un nuevo trabajador para asignarlo a tus obras."
          }
        />

        <AssignDialog
          open={!!assignTarget}
          onOpenChange={(o) => !o && setAssignTarget(null)}
          worker={assignTarget}
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar trabajador"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar a "
          suffix="? Se eliminarán sus asignaciones y pagos asociados."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Trabajador eliminado", {
                  description: "Se eliminaron sus asignaciones y pagos.",
                });
              },
              onError: () => toast.error("No se pudo eliminar el trabajador"),
            });
          }}
        />
      </div>
    </PageTransition>
  );
}
