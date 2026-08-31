import { useMemo, useState } from "react";
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
import { useProjects } from "@/features/projects/api/useProjects";
import {
  useWithdrawals,
  useCreateWithdrawal,
  useUpdateWithdrawal,
  useDeleteWithdrawal,
} from "@/features/withdrawals/api/useWithdrawals";
import { WithdrawalForm } from "@/features/withdrawals/components/WithdrawalForm";
import type { WithdrawalWithProject, WithdrawalInput } from "@/features/withdrawals/api/withdrawals";
import {
  ArrowDownToLine,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Wallet,
  ShieldAlert,
} from "lucide-react";

const toForm = (w: WithdrawalWithProject): WithdrawalInput => ({
  project_id: w.project_id,
  amount: Number(w.amount),
  withdrawal_date: w.withdrawal_date,
  withdrawal_time: w.withdrawal_time ?? "",
  reason: w.reason,
  notes: w.notes ?? "",
});

const emptyForm: WithdrawalInput = {
  project_id: "",
  amount: 0,
  withdrawal_date: "",
  withdrawal_time: "",
  reason: "",
  notes: "",
};

export default function WithdrawalsPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WithdrawalWithProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: projects = [] } = useProjects({});
  const {
    data: withdrawals = [],
    isLoading,
    isError,
    refetch,
  } = useWithdrawals(projectFilter !== "all" ? projectFilter : undefined);
  const createMutation = useCreateWithdrawal();
  const updateMutation = useUpdateWithdrawal();
  const deleteMutation = useDeleteWithdrawal();

  const totalWithdrawn = useMemo(
    () => withdrawals.reduce((s, w) => s + Number(w.amount), 0),
    [withdrawals]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (w: WithdrawalWithProject) => {
    setEditing(w);
    setFormOpen(true);
  };

  const formValue = editing ? toForm(editing) : projectFilter !== "all"
    ? { ...emptyForm, project_id: projectFilter }
    : emptyForm;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Retiros Personales</h1>
            <p className="text-muted-foreground">
              Dinero que retiras de la obra — no es un costo de construcción, pero afecta el flujo
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo retiro
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

        <Card className="border-info/30">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/10">
              <ShieldAlert className="h-5 w-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Recuerda</p>
              <p className="text-sm">
                Los retiros personales se separan de los costos directos de construcción: reducen el
                dinero disponible de la obra, pero no se clasifican como gasto.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los retiros</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && withdrawals.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ArrowDownToLine className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay retiros registrados</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Registra los retiros personales para conocer el dinero realmente disponible.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo retiro
            </Button>
          </Card>
        )}

        {!isLoading && !isError && withdrawals.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Obra</th>
                      <th className="px-5 py-3 font-medium">Motivo</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Valor</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{w.project?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p>{w.reason}</p>
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {formatDate(w.withdrawal_date)}
                          {w.withdrawal_time && (
                            <span className="ml-1 text-xs">· {formatTime(w.withdrawal_time)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-warning">
                          {formatCOP(Number(w.amount))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(w)}
                              aria-label="Editar retiro"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: w.id, name: w.reason })
                              }
                              aria-label="Eliminar retiro"
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

        <WithdrawalForm
          open={formOpen}
          onOpenChange={setFormOpen}
          withdrawal={editing ? formValue : null}
          projects={projects}
          fixedProjectId={projectFilter !== "all" ? projectFilter : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: WithdrawalInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Retiro actualizado", {
                      description: "El dinero disponible de la obra se actualizó.",
                    });
                  },
                  onError: () =>
                    toast.error("No se pudo actualizar el retiro"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Retiro personal registrado", {
                    description: "No se cuenta como costo directo de construcción.",
                  });
                },
                onError: () =>
                  toast.error("No se pudo registrar el retiro"),
              });
            }
          }}
          title={editing ? "Editar retiro" : "Nuevo retiro"}
          description={
            editing
              ? "Actualiza los datos del retiro."
              : "Registra un retiro personal y actualiza el dinero disponible de la obra."
          }
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar retiro"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar el retiro "
          suffix="?"
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Retiro eliminado", {
                  description: "El dinero disponible se actualizó.",
                });
              },
              onError: () =>
                toast.error("No se pudo eliminar el retiro"),
            });
          }}
        />

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Total retirado
          </span>
          <span className="font-semibold tabular-nums text-warning">
            {formatCOP(totalWithdrawn)}
          </span>
        </div>
      </div>
    </PageTransition>
  );
}
