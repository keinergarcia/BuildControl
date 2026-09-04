import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useProject } from "@/features/projects/api/useProjects";
import { useClients } from "@/features/clients/api/useClients";
import {
  useIncome,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
} from "@/features/income/api/useIncome";
import { IncomeForm } from "@/features/income/components/IncomeForm";
import type { IncomeWithRelations, IncomeInput } from "@/features/income/api/income";
import {
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CircleDollarSign,
  HandCoins,
  FileSignature,
} from "lucide-react";

const toForm = (i: IncomeWithRelations): IncomeInput => ({
  project_id: i.project_id,
  client_id: i.client_id ?? null,
  amount: Number(i.amount),
  payment_date: i.payment_date,
  payment_time: i.payment_time ?? "",
  concept: i.concept,
  payment_method: i.payment_method,
  notes: i.notes ?? "",
});

const emptyForm: IncomeInput = {
  project_id: "",
  client_id: null,
  amount: 0,
  payment_date: "",
  payment_time: "",
  concept: "",
  payment_method: null,
  notes: "",
};

export default function IncomePage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: projects = [] } = useProjects({});
  const { data: clients = [] } = useClients();
  const projectDetail = useProject(projectFilter !== "all" ? projectFilter : undefined);
  const {
    data: income = [],
    isLoading,
    isError,
    refetch,
  } = useIncome(projectFilter !== "all" ? projectFilter : undefined);
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const deleteMutation = useDeleteIncome();

  const filtered = income;
  const contractValue = useMemo(() => {
    if (projectFilter === "all") return null;
    const project = projects.find((p) => p.id === projectFilter);
    const contract = project?.contracts?.[0];
    return contract ? Number(contract.total_value) : null;
  }, [projectFilter, projects]);

  const received = useMemo(
    () => filtered.reduce((s, i) => s + Number(i.amount), 0),
    [filtered]
  );
  const pending =
    contractValue != null ? Math.max(0, contractValue - received) : null;

  // Saldo disponible de la obra: recibido - gastos - pagos a trabajadores - retiros.
  const availableCash = useMemo(() => {
    const d = projectDetail.data;
    if (!d) return null;
    const costs = (d.expenses ?? []).reduce((s, e) => s + Number(e.amount), 0) +
      (d.worker_payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const withdrawals = (d.personal_withdrawals ?? []).reduce((s, w) => s + Number(w.amount), 0);
    return received - costs - withdrawals;
  }, [projectDetail.data, received]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (i: IncomeWithRelations) => {
    setEditing(i);
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
            <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>
            <p className="text-muted-foreground">
              Pagos recibidos de los clientes por cada obra
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo ingreso
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

        {projectFilter !== "all" && contractValue != null && (
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Contrato"
              value={formatCOP(contractValue)}
              icon={<FileSignature className="h-5 w-5 text-amber-500" />}
            />
            <SummaryCard
              label="Recibido"
              value={formatCOP(received)}
              icon={<CircleDollarSign className="h-5 w-5 text-emerald-500" />}
            />
            <SummaryCard
              label="Pendiente"
              value={formatCOP(pending ?? 0)}
              icon={<HandCoins className="h-5 w-5 text-info" />}
            />
            <SummaryCard
              label="Saldo disponible"
              value={availableCash != null ? formatCOP(availableCash) : "…"}
              icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
              negative={(availableCash ?? 0) < 0}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los ingresos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && income.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay ingresos registrados</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Registra los pagos que recibes de los clientes para controlar el flujo de dinero.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo ingreso
            </Button>
          </Card>
        )}

        {!isLoading && !isError && income.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Obra</th>
                      <th className="px-5 py-3 font-medium">Concepto</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Cliente</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Método</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Valor</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.map((i) => (
                      <tr key={i.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{i.project?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p>{i.concept}</p>
                          <p className="text-xs text-muted-foreground">
                            {i.client?.name ?? "Sin cliente"}
                          </p>
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {i.client?.company ?? i.client?.name ?? "—"}
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {i.payment_method ? PAYMENT_METHOD_LABELS[i.payment_method] : "—"}
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {formatDate(i.payment_date)}
                          {i.payment_time && (
                            <span className="ml-1 text-xs">· {formatTime(i.payment_time)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-emerald-500">
                          {formatCOP(Number(i.amount))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(i)}
                              aria-label="Editar ingreso"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: i.id, name: i.concept })
                              }
                              aria-label="Eliminar ingreso"
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

        <IncomeForm
          open={formOpen}
          onOpenChange={setFormOpen}
          income={editing ? formValue : null}
          projects={projects}
          clients={clients}
          fixedProjectId={projectFilter !== "all" ? projectFilter : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: IncomeInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Ingreso actualizado", {
                      description: "El flujo de dinero se actualizó.",
                    });
                  },
                  onError: () =>
                    toast.error("No se pudo actualizar el ingreso"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Pago recibido registrado", {
                    description: "El flujo de dinero y lo pendiente se actualizan.",
                  });
                },
                onError: () =>
                  toast.error("No se pudo registrar el ingreso"),
              });
            }
          }}
          title={editing ? "Editar ingreso" : "Nuevo ingreso"}
          description={
            editing
              ? "Actualiza los datos del ingreso."
              : "Registra un pago recibido del cliente y actualiza el flujo de dinero."
          }
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar ingreso"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar el ingreso "
          suffix="? Se actualizará el flujo de dinero de la obra."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Ingreso eliminado", {
                  description: "El flujo de dinero se actualizó.",
                });
              },
              onError: () =>
                toast.error("No se pudo eliminar el ingreso"),
            });
          }}
        />

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" />
            Total recibido
          </span>
          <Badge variant="secondary" className="text-emerald-500">
            {formatCOP(received)}
          </Badge>
        </div>
      </div>
    </PageTransition>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  negative,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold tabular-nums ${negative ? "text-destructive" : ""}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
