import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useSuppliers } from "@/features/suppliers/api/useSuppliers";
import {
  useExpenses,
  useBudgetCategories,
  useExpenseCategories,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/features/expenses/api/useExpenses";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { ExpenseCategoryDialog } from "@/features/expenses/components/ExpenseCategoryDialog";
import { ExpenseOcrDialog } from "@/features/expenses/components/ExpenseOcrDialog";
import type { ExpenseWithRelations, ExpenseInput } from "@/features/expenses/api/expenses";
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Tags,
  Wallet,
  Landmark,
  Store,
  ScanLine,
} from "lucide-react";

const toForm = (e: ExpenseWithRelations): ExpenseInput => ({
  project_id: e.project_id,
  description: e.description,
  amount: Number(e.amount),
  category_id: e.category_id ?? null,
  expense_category_id: e.expense_category_id ?? null,
  supplier_id: e.supplier_id ?? null,
  expense_date: e.expense_date,
  expense_time: e.expense_time ?? "",
  payment_method: e.payment_method,
  notes: e.notes ?? "",
});

const emptyForm: ExpenseInput = {
  project_id: "",
  description: "",
  amount: 0,
  category_id: null,
  expense_category_id: null,
  supplier_id: null,
  expense_date: "",
  expense_time: "",
  payment_method: null,
  notes: "",
};

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "ocr") {
      setOcrOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: projects = [] } = useProjects({});
  const { data: categories = [] } = useBudgetCategories();
  const { data: expenseCategories = [] } = useExpenseCategories();
  const { data: suppliers = [] } = useSuppliers();
  const {
    data: expenses = [],
    isLoading,
    isError,
    refetch,
  } = useExpenses(projectFilter !== "all" ? projectFilter : undefined);
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (e: ExpenseWithRelations) => {
    setEditing(e);
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
            <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
            <p className="text-muted-foreground">
              Costos directos de cada obra: materiales, mano de obra, servicios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCategoryOpen(true)}>
              <Tags className="h-4 w-4" />
              Categorías
            </Button>
            <Button variant="outline" onClick={() => setOcrOpen(true)}>
              <ScanLine className="h-4 w-4" />
              Desde factura
            </Button>
            <Button variant="glow" size="lg" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Button>
          </div>
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
            <p className="font-semibold">No se pudieron cargar los gastos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && expenses.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay gastos registrados</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Registra los gastos de cada obra para controlar costos y presupuesto.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Button>
          </Card>
        )}

        {!isLoading && !isError && expenses.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Obra</th>
                      <th className="px-5 py-3 font-medium">Descripción</th>
                      <th className="px-5 py-3 font-medium">Categoría</th>
                      <th className="hidden px-5 py-3 font-medium md:table-cell">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Valor</th>
                      <th className="px-5 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{e.project?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p>{e.description}</p>
                          {e.supplier && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Store className="h-3 w-3" />
                              {e.supplier.name}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            {e.category && (
                              <Badge variant="secondary">
                                <Wallet className="mr-1 h-3 w-3" />
                                {e.category.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {e.payment_method
                                ? PAYMENT_METHOD_LABELS[e.payment_method]
                                : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                          {formatDate(e.expense_date)}
                          {e.expense_time && (
                            <span className="ml-1 text-xs">· {formatTime(e.expense_time)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">
                          {formatCOP(Number(e.amount))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(e)}
                              aria-label="Editar gasto"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: e.id, name: e.description })
                              }
                              aria-label="Eliminar gasto"
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

        <ExpenseForm
          open={formOpen}
          onOpenChange={setFormOpen}
          expense={editing ? formValue : null}
          projects={projects}
          categories={categories}
          expenseCategories={expenseCategories}
          suppliers={suppliers}
          fixedProjectId={projectFilter !== "all" ? projectFilter : undefined}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: ExpenseInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Gasto actualizado", {
                      description: "Los costos de la obra se recalculan.",
                    });
                  },
                  onError: () =>
                    toast.error("No se pudo actualizar el gasto", {
                      description: "Revisa los datos e inténtalo de nuevo.",
                    }),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Gasto registrado", {
                    description: "Afecta automáticamente los costos de la obra.",
                  });
                },
                onError: () =>
                  toast.error("No se pudo registrar el gasto", {
                    description: "Revisa los datos e inténtalo de nuevo.",
                  }),
              });
            }
          }}
          title={editing ? "Editar gasto" : "Nuevo gasto"}
          description={
            editing
              ? "Actualiza los datos del gasto."
              : "Registra un gasto y afecta automáticamente los costos de la obra."
          }
        />

        <ExpenseCategoryDialog open={categoryOpen} onOpenChange={setCategoryOpen} />

        <ExpenseOcrDialog open={ocrOpen} onOpenChange={setOcrOpen} />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar gasto"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar el gasto "
          suffix="? Se actualizarán los cálculos financieros de la obra."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Gasto eliminado", {
                  description: "Los cálculos de la obra se actualizaron.",
                });
              },
              onError: () =>
                toast.error("No se pudo eliminar el gasto"),
            });
          }}
        />

        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Landmark className="h-4 w-4" />
            Total de gastos
          </span>
          <span className="font-semibold tabular-nums">
            {formatCOP(expenses.reduce((s, e) => s + Number(e.amount), 0))}
          </span>
        </div>
      </div>
    </PageTransition>
  );
}
