import { useState } from "react";
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
import { formatDate } from "@/utils/date";
import { CONTRACT_TYPE_LABELS } from "@/types";
import { useProjects } from "@/features/projects/api/useProjects";
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
} from "@/features/contracts/api/useContracts";
import {
  ContractForm,
} from "@/features/contracts/components/ContractForm";
import type { ContractWithProject } from "@/features/contracts/api/contracts";
import type { ContractInput } from "@/features/contracts/api/contracts";
import { FileSignature, Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";

const toForm = (c: ContractWithProject) => ({
  project_id: c.project_id,
  contract_type: c.contract_type,
  total_value: Number(c.total_value),
  daily_rate: c.daily_rate != null ? Number(c.daily_rate) : null,
  start_date: c.start_date,
  planned_end_date: c.planned_end_date ?? "",
  conditions: c.conditions ?? "",
  notes: c.notes ?? "",
});

const emptyForm = {
  project_id: "",
  contract_type: "precio_fijo" as const,
  total_value: 0,
  daily_rate: null,
  start_date: "",
  planned_end_date: "",
  conditions: "",
  notes: "",
};

export default function ContractsPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContractWithProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: projects = [] } = useProjects({});
  const {
    data: contracts = [],
    isLoading,
    isError,
    refetch,
  } = useContracts(projectFilter !== "all" ? projectFilter : undefined);
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const deleteMutation = useDeleteContract();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: ContractWithProject) => {
    setEditing(c);
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
            <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground">
              Modalidades y valores contractuales de tus obras
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo contrato
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por proyecto</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
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
            <p className="font-semibold">No se pudieron cargar los contratos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && contracts.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <FileSignature className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay contratos</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Registra un contrato para definir el valor y las condiciones de una obra.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo contrato
            </Button>
          </Card>
        )}

        {!isLoading && !isError && contracts.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Proyecto</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium">Valor</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Inicio</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Fin prevista</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{c.project?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary">
                            {CONTRACT_TYPE_LABELS[c.contract_type]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-semibold tabular-nums">
                          {formatCOP(Number(c.total_value))}
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {formatDate(c.start_date)}
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {c.planned_end_date ? formatDate(c.planned_end_date) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(c)}
                              aria-label="Editar contrato"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: c.id, name: c.project?.name ?? "" })
                              }
                              aria-label="Eliminar contrato"
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

        <ContractForm
          open={formOpen}
          onOpenChange={setFormOpen}
          contract={editing ? formValue : null}
          projects={projects}
          fixedProjectId={undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: ContractInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Contrato actualizado", {
                      description: "Los cálculos financieros se actualizaron.",
                    });
                  },
                  onError: () => toast.error("No se pudo actualizar el contrato"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Contrato registrado", {
                    description: "Define el valor de la obra.",
                  });
                },
                onError: () => toast.error("No se pudo crear el contrato"),
              });
            }
          }}
          title={editing ? "Editar contrato" : "Nuevo contrato"}
          description={
            editing
              ? "Actualiza los datos del contrato."
              : "Define el valor y las condiciones del contrato de una obra."
          }
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar contrato"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar el contrato de "
          suffix="? Esta acción afectará los cálculos financieros del proyecto."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Contrato eliminado", {
                  description: "Los cálculos del proyecto se actualizaron.",
                });
              },
              onError: () => toast.error("No se pudo eliminar el contrato"),
            });
          }}
        />
      </div>
    </PageTransition>
  );
}
