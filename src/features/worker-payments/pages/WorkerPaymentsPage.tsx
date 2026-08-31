import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/money";
import { formatDate, formatTime } from "@/utils/date";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { useProjects } from "@/features/projects/api/useProjects";
import { useWorkers } from "@/features/workers/api/useWorkers";
import {
  useWorkerPayments,
  useCreateWorkerPayment,
  useUpdateWorkerPayment,
  useDeleteWorkerPayment,
} from "@/features/worker-payments/api/useWorkerPayments";
import { WorkerPaymentForm } from "@/features/worker-payments/components/WorkerPaymentForm";
import type {
  WorkerPaymentWithRelations,
  WorkerPaymentInput,
} from "@/features/worker-payments/api/workerPayments";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  HardHat,
  Landmark,
} from "lucide-react";

const toForm = (p: WorkerPaymentWithRelations): WorkerPaymentInput => ({
  worker_id: p.worker_id,
  project_id: p.project_id,
  amount: Number(p.amount),
  payment_date: p.payment_date,
  payment_time: p.payment_time ?? "",
  concept: p.concept,
  payment_method: p.payment_method,
  notes: p.notes ?? "",
});

const emptyForm: WorkerPaymentInput = {
  worker_id: "",
  project_id: "",
  amount: 0,
  payment_date: "",
  payment_time: "",
  concept: "",
  payment_method: null,
  notes: "",
};

export default function WorkerPaymentsPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerPaymentWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: projects = [] } = useProjects({});
  const { data: workers = [] } = useWorkers();
  const {
    data: payments = [],
    isLoading,
    isError,
    refetch,
  } = useWorkerPayments(projectFilter !== "all" ? projectFilter : undefined);
  const createMutation = useCreateWorkerPayment();
  const updateMutation = useUpdateWorkerPayment();
  const deleteMutation = useDeleteWorkerPayment();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: WorkerPaymentWithRelations) => {
    setEditing(p);
    setFormOpen(true);
  };

  const formValue = editing
    ? toForm(editing)
    : projectFilter !== "all"
      ? { ...emptyForm, project_id: projectFilter }
      : emptyForm;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pagos a trabajadores</h1>
            <p className="text-muted-foreground">
              Sueldos, jornales y anticipos pagados a tu equipo
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo pago
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por obra</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las obras</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los pagos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && payments.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay pagos registrados</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Registra los pagos a tu equipo para controlar la mano de obra de cada obra.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo pago
            </Button>
          </Card>
        )}

        {!isLoading && !isError && payments.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Obra</th>
                      <th className="px-5 py-3 font-medium">Trabajador</th>
                      <th className="px-5 py-3 font-medium">Concepto</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Valor</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{p.project?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="flex items-center gap-1.5 font-medium">
                            <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.worker?.name ?? "—"}
                          </p>
                          {p.worker?.role && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {p.worker.role}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p>{p.concept}</p>
                          <span className="text-xs text-muted-foreground">
                            {p.payment_method
                              ? PAYMENT_METHOD_LABELS[p.payment_method]
                              : "—"}
                          </span>
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {formatDate(p.payment_date)}
                          {p.payment_time && (
                            <span className="ml-1 text-xs">· {formatTime(p.payment_time)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">
                          {formatCOP(Number(p.amount))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(p)}
                              aria-label="Editar pago"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: p.id, name: p.concept })
                              }
                              aria-label="Eliminar pago"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <WorkerPaymentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          payment={editing ? formValue : null}
          projects={projects}
          workers={workers}
          fixedProjectId={projectFilter !== "all" ? projectFilter : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: WorkerPaymentInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Pago actualizado", {
                      description: "Los costos de mano de obra se recalcularon.",
                    });
                  },
                  onError: () =>
                    toast.error("No se pudo actualizar el pago"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Pago a trabajador registrado", {
                    description: "Afecta automáticamente los costos de la obra.",
                  });
                },
                onError: () =>
                  toast.error("No se pudo registrar el pago"),
              });
            }
          }}
          title={editing ? "Editar pago" : "Nuevo pago"}
          description={
            editing
              ? "Actualiza los datos del pago."
              : "Registra un pago y afecta automáticamente los costos de la obra."
          }
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar pago"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar el pago "
          suffix="? Se actualizarán los cálculos financieros de la obra."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Pago eliminado", {
                  description: "Los costos de la obra se actualizaron.",
                });
              },
              onError: () =>
                toast.error("No se pudo eliminar el pago"),
            });
          }}
        />

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Landmark className="h-4 w-4" />
            Total pagado
          </span>
          <span className="font-semibold tabular-nums">
            {formatCOP(payments.reduce((s, p) => s + Number(p.amount), 0))}
          </span>
        </div>
      </div>
    </PageTransition>
  );
}