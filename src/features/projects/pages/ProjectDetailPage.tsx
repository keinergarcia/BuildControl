import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/utils/date";
import { formatCOP, safePercentage } from "@/lib/money";
import { buildFinancialSummary } from "@/engine/calculations";
import { PROJECT_STATUS_LABELS } from "@/types";
import {
  useProject,
  useClients,
  useUpdateProject,
  useDeleteProject,
} from "@/features/projects/api/useProjects";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { useProjectCover } from "@/features/projects/api/useProjectCover";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DailyRecordTable } from "@/features/daily-records/components/DailyRecordTable";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Building2,
  Receipt,
  Users,
  TrendingUp,
  CircleDollarSign,
  Wallet,
  Landmark,
  Clock,
  Loader2,
  AlertTriangle,
  Layers,
  PiggyBank,
} from "lucide-react";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(id);
  const { data: clients = [] } = useClients();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const { user } = useAuth();
  const coverUrl = useProjectCover(project?.cover_image_url ?? null);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const summary = useMemo(() => {
    if (!project) return null;
    return buildFinancialSummary(
      project.contracts?.[0],
      project.expenses ?? [],
      project.worker_payments ?? [],
      project.income_payments ?? [],
      project.personal_withdrawals ?? [],
      project.budgets ?? [],
      project.start_date,
      project.planned_end_date,
      project.actual_end_date
    );
  }, [project]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !project || !summary) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="font-semibold">No se pudo cargar el proyecto</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          Volver a proyectos
        </Button>
      </Card>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        toast.success("Proyecto eliminado");
        navigate("/projects");
      },
      onError: () => toast.error("No se pudo eliminar el proyecto"),
    });
  };

  const totalBudget = (project.budgets ?? []).reduce(
    (sum, b) => sum + Number(b.budgeted_amount),
    0
  );

  const metrics = [
    {
      title: "Valor Contrato",
      value: summary.contractValue,
      format: formatCOP,
      icon: Receipt,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Recibido",
      value: summary.receivedAmount,
      format: formatCOP,
      icon: CircleDollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Costos Totales",
      value: summary.totalCosts,
      format: formatCOP,
      icon: Wallet,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Dinero Disponible",
      value: summary.availableCash,
      format: formatCOP,
      icon: Landmark,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Utilidad",
      value: summary.profit,
      format: formatCOP,
      icon: TrendingUp,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Mano de Obra",
      value: summary.laborCost,
      format: formatCOP,
      icon: Users,
      color: "text-muted-foreground",
      bg: "bg-secondary",
    },
    {
      title: "Margen",
      value: summary.profitMargin,
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: PiggyBank,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/projects")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <StatusBadge
                  status={project.status}
                  label={PROJECT_STATUS_LABELS[project.status]}
                />
              </div>
              {project.project_type && (
                <p className="text-sm text-muted-foreground capitalize">
                  {project.project_type}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {project.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {project.location}
            </span>
          )}
          {project.client && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {project.client.name}
            </span>
          )}
          {project.start_date && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Inicio: {formatDate(project.start_date)}
            </span>
          )}
          {project.planned_end_date && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Fin planeado: {formatDate(project.planned_end_date)}
            </span>
          )}
        </div>

        {coverUrl && (
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={coverUrl}
              alt={`Portada de ${project.name}`}
              className="h-40 w-full object-cover sm:h-56"
            />
          </div>
        )}

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((m) => (
            <Card key={m.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {m.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.bg}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={m.value}
                  format={m.format}
                  className="text-base font-bold"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-primary" />
                  Presupuesto y Costos
                </CardTitle>
                <CardDescription>
                  Comparación entre presupuesto asignado y lo ejecutado
                </CardDescription>
              </div>
              <Badge variant="info" className="hidden sm:inline-flex">
                {safePercentage(summary.totalCosts, totalBudget).toFixed(1)}% usado
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalBudget > 0 ? (
                <>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ejecutado</span>
                      <span className="font-medium">
                        {formatCOP(summary.totalCosts)}
                      </span>
                    </div>
                    <ProgressBar
                      value={summary.totalCosts}
                      max={totalBudget}
                      height="h-3"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Presupuesto total: {formatCOP(totalBudget)}</span>
                      <span>Restante: {formatCOP(Math.max(0, totalBudget - summary.totalCosts))}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground">Materiales</p>
                      <p className="mt-1 text-base font-semibold">
                        {formatCOP(summary.materialCost)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground">Mano de obra</p>
                      <p className="mt-1 text-base font-semibold">
                        {formatCOP(summary.laborCost)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aún no hay presupuesto asignado a este proyecto. Configúralo desde el módulo de Presupuesto.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Cronograma
              </CardTitle>
              <CardDescription>Avance temporal del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Días transcurridos</span>
                <span className="font-semibold">{summary.daysElapsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Días restantes</span>
                <span className="font-semibold">{summary.daysRemaining}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Costo diario</span>
                <span className="font-semibold">{formatCOP(summary.dailyCost)}</span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mano de obra / día</span>
                  <span className="font-medium tabular-nums">{formatCOP(summary.dailyLaborCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Materiales / día</span>
                  <span className="font-medium tabular-nums">{formatCOP(summary.dailyMaterialCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Otros / día</span>
                  <span className="font-medium tabular-nums">{formatCOP(summary.dailyOtherCost)}</span>
                </div>
              </div>
              {summary.potentialTimeSavings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Costo evitado (adelanto)</span>
                  <span className="font-semibold text-success">{formatCOP(summary.potentialTimeSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Utilidad proyectada</span>
                <span
                  className={`font-semibold ${
                    summary.projectedProfit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCOP(summary.projectedProfit)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="income">Ingresos</TabsTrigger>
            <TabsTrigger value="payments">Pagos a trabajadores</TabsTrigger>
            <TabsTrigger value="withdrawals">Retiros</TabsTrigger>
            <TabsTrigger value="daily">Bitácora</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <TableItems
              title="Gastos"
              empty="No hay gastos registrados para este proyecto."
              total={summary.totalExpenses}
              headers={["Descripción", "Fecha", "Monto"]}
            >
              {(project.expenses ?? [])
                .slice()
                .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1))
                .map((e) => (
                  <Row key={e.id}>
                    <Cell>{e.description}</Cell>
                    <Cell className="text-muted-foreground">{formatDate(e.expense_date)}</Cell>
                    <Cell className="text-right font-medium">{formatCOP(e.amount)}</Cell>
                  </Row>
                ))}
            </TableItems>
          </TabsContent>

          <TabsContent value="income">
            <TableItems
              title="Ingresos"
              empty="No hay ingresos registrados para este proyecto."
              total={summary.receivedAmount}
              headers={["Concepto", "Fecha", "Monto"]}
            >
              {(project.income_payments ?? [])
                .slice()
                .sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1))
                .map((p) => (
                  <Row key={p.id}>
                    <Cell>{p.concept}</Cell>
                    <Cell className="text-muted-foreground">{formatDate(p.payment_date)}</Cell>
                    <Cell className="text-right font-medium text-success">
                      {formatCOP(p.amount)}
                    </Cell>
                  </Row>
                ))}
            </TableItems>
          </TabsContent>

          <TabsContent value="payments">
            <TableItems
              title="Pagos a trabajadores"
              empty="No hay pagos a trabajadores registrados."
              total={summary.laborCost}
              headers={["Concepto", "Fecha", "Monto"]}
            >
              {(project.worker_payments ?? [])
                .slice()
                .sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1))
                .map((p) => (
                  <Row key={p.id}>
                    <Cell>{p.concept}</Cell>
                    <Cell className="text-muted-foreground">{formatDate(p.payment_date)}</Cell>
                    <Cell className="text-right font-medium">{formatCOP(p.amount)}</Cell>
                  </Row>
                ))}
            </TableItems>
          </TabsContent>

          <TabsContent value="withdrawals">
            <TableItems
              title="Retiros personales"
              empty="No hay retiros registrados para este proyecto."
              total={summary.totalWithdrawals}
              headers={["Motivo", "Fecha", "Monto"]}
            >
              {(project.personal_withdrawals ?? [])
                .slice()
                .sort((a, b) => (a.withdrawal_date < b.withdrawal_date ? 1 : -1))
                .map((w) => (
                  <Row key={w.id}>
                    <Cell>{w.reason}</Cell>
                    <Cell className="text-muted-foreground">{formatDate(w.withdrawal_date)}</Cell>
                    <Cell className="text-right font-medium">{formatCOP(w.amount)}</Cell>
                  </Row>
                ))}
            </TableItems>
          </TabsContent>

          <TabsContent value="daily">
            <DailyRecordTable
              projectId={project.id}
              userId={user?.id ?? null}
            />
          </TabsContent>
        </Tabs>

        {project.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {project.description}
              </p>
            </CardContent>
          </Card>
        )}

        <ProjectForm
          open={editOpen}
          onOpenChange={setEditOpen}
          project={project}
          clients={clients}
          userId={user?.id ?? null}
          isSubmitting={updateMutation.isPending}
          onSave={(input) => {
            updateMutation.mutate(
              { id: project.id, input },
              {
                onSuccess: () => {
                  setEditOpen(false);
                  toast.success("Proyecto actualizado");
                },
                onError: () =>
                  toast.error("No se pudo actualizar el proyecto"),
              }
            );
          }}
          title="Editar proyecto"
          description="Actualiza la información de este proyecto."
        />

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Eliminar proyecto</CardTitle>
                <CardDescription>
                  Esta acción eliminará el proyecto y toda su información asociada
                  (presupuestos, gastos, contratos, pagos). No se puede deshacer.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function TableItems({
  title,
  empty,
  total,
  headers,
  children,
}: {
  title: string;
  empty: string;
  total: number;
  headers: string[];
  children: React.ReactNode;
}) {
  const hasContent = Array.isArray(children) && children.length > 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="text-sm font-semibold text-muted-foreground">
          Total: {formatCOP(total)}
        </span>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {headers.map((h) => (
                    <th key={h} className="pb-2 pr-4 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{children}</tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {empty}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border/60 last:border-0">{children}</tr>;
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 pr-4 ${className}`}>{children}</td>;
}
