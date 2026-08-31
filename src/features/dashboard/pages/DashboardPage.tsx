import { Link } from "react-router-dom";
import { PageTransition, FadeInUp, StaggerContainer } from "@/components/shared/PageTransition";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { formatCOPShort, formatCOP, safePercentage } from "@/lib/money";
import { formatDate } from "@/utils/date";
import { PROJECT_STATUS_LABELS } from "@/types";
import { useDashboard } from "@/features/dashboard/api/useDashboard";
import { useProjectCover } from "@/features/projects/api/useProjectCover";
import type { FinancialAlert } from "@/engine/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FolderKanban,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Wallet,
  Clock,
  ArrowRight,
  Plus,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  HardHat,
  AlertTriangle,
  Info,
  Timer,
} from "lucide-react";

const ALERT_STYLES: Record<
  FinancialAlert["severity"],
  { icon: typeof AlertTriangle; color: string; bg: string; border: string }
> = {
  critical: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  warning: {
    icon: TrendingDown,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  info: {
    icon: Info,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
  },
};

export default function DashboardPage() {
  const { projects, projectRows, alerts, activity, totals, isLoading, isError, refetch } =
    useDashboard();

  const summaryCards = [
    {
      title: "Proyectos Activos",
      value: totals.activeProjects,
      format: (v: number) => v.toString(),
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Dinero Recibido",
      value: totals.totalReceived,
      format: formatCOPShort,
      icon: CircleDollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Costos Totales",
      value: totals.totalCosts,
      format: formatCOPShort,
      icon: Wallet,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Utilidad",
      value: totals.totalProfit,
      format: (v: number) => formatCOPShort(v),
      icon: TrendingUp,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Presupuesto Usado",
      value: totals.weightedBudgetUsed,
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: Wallet,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Días Promedio Rest.",
      value: totals.avgDaysRemaining,
      format: (v: number) => v.toString(),
      icon: Clock,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  const chartData = projects.slice(0, 8).map((p) => {
    const received = (p.income_payments ?? []).reduce(
      (s, x) => s + Number(x.amount),
      0
    );
    const costs =
      (p.expenses ?? []).reduce((s, x) => s + Number(x.amount), 0) +
      (p.worker_payments ?? []).reduce((s, x) => s + Number(x.amount), 0);
    return { name: p.name.length > 14 ? `${p.name.slice(0, 14)}…` : p.name, Recibido: received, Costos: costs };
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Resumen general de tus obras y finanzas
            </p>
          </div>
          <Link to="/projects">
            <Button variant="glow">
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-28 animate-pulse bg-secondary/60" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los datos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Comienza a controlar tus obras</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Crea tu primer proyecto para llevar el control de presupuestos, gastos,
                ingresos y mano de obra de forma organizada.
              </p>
            </div>
            <Link to="/projects">
              <Button variant="glow">
                <Plus className="h-4 w-4" />
                Crear primer proyecto
              </Button>
            </Link>
          </Card>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <>
            <StaggerContainer>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((card) => (
                  <FadeInUp key={card.title}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </CardTitle>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                          <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <AnimatedNumber
                          value={card.value}
                          format={card.format}
                          className="text-2xl font-bold"
                        />
                      </CardContent>
                    </Card>
                  </FadeInUp>
                ))}
              </div>
            </StaggerContainer>

            {alerts.length > 0 && (
              <FadeInUp>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      Alertas ({alerts.length})
                    </h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {alerts.map((a) => {
                      const style = ALERT_STYLES[a.severity];
                      const Icon = style.icon;
                      return (
                        <Link
                          key={a.id}
                          to={`/projects/${a.project_id}`}
                          className={`block rounded-xl border ${style.border} ${style.bg} p-3 transition-transform hover:scale-[1.01]`}
                        >
                          <div className="flex items-start gap-2.5">
                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{a.title}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {a.message}
                              </p>
                              <p className="mt-1 truncate text-xs font-medium">
                                {a.project_name}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </FadeInUp>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rentabilidad</CardTitle>
                <CardDescription>
                  Utilidad prevista, proyectada, real y margen sobre el valor contratado
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Utilidad prevista</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {formatCOPShort(totals.expectedProfit)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Utilidad proyectada</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-info">
                    {formatCOPShort(totals.projectedProfit)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Utilidad real</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-success">
                    {formatCOPShort(totals.totalProfit)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Margen</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {totals.weightedProfitMargin.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Recibido vs Costos por Proyecto</CardTitle>
                  <CardDescription>
                    Comparación de ingresos recibidos y costos totales por obra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bc-border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--bc-text-muted)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--bc-text-muted)" tickFormatter={(v: number) => formatCOPShort(v)} />
                        <Tooltip
                          formatter={(value) => formatCOP(Number(value ?? 0))}
                          contentStyle={{
                            background: "var(--bc-bg-card)",
                            border: "1px solid var(--bc-border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Recibido" fill="var(--bc-accent-success)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Costos" fill="var(--bc-accent-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                      Sin datos de finanzas para graficar
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {activity.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      Sin actividad reciente
                    </div>
                  ) : (
                    activity.map((item, i) => (
                      <div
                        key={`${item.kind}-${item.key}-${i}`}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          {item.kind === "income" ? (
                            <ArrowUpCircle className="h-4 w-4 text-success" />
                          ) : item.kind === "worker_payment" ? (
                            <HardHat className="h-4 w-4 text-info" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{item.description || "Sin descripción"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            item.kind === "income" ? "text-success" : "text-foreground"
                          }`}
                        >
                          {formatCOPShort(item.amount ?? 0)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Proyectos Recientes</CardTitle>
                  <CardDescription>
                    Presupuesto ejecutado por cada obra
                  </CardDescription>
                </div>
                <Link to="/projects">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Ver todos
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectRows.slice(0, 5).map(({ project: p, summary }) => {
                  const budget = (p.budgets ?? []).reduce(
                    (s, x) => s + Number(x.budgeted_amount),
                    0
                  );
                  const costs =
                    (p.expenses ?? []).reduce((s, x) => s + Number(x.amount), 0) +
                    (p.worker_payments ?? []).reduce((s, x) => s + Number(x.amount), 0);
                  const pct = budget > 0 ? safePercentage(costs, budget) : 0;
                  const variance = summary.scheduleVariance;
                  const finished = p.status === "finalizado" || p.status === "cancelado";
                  return (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="block rounded-lg p-3 transition-colors hover:bg-secondary/60 -mx-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <MiniCover path={p.cover_image_url ?? null} name={p.name} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">{p.name}</p>
                              <StatusBadge
                                status={p.status}
                                label={PROJECT_STATUS_LABELS[p.status]}
                              />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {p.client?.name ?? "Sin cliente"} ·{" "}
                              {formatCOPShort(costs)} / {formatCOPShort(budget)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!finished && (
                            <Badge
                              variant={
                                variance < 0
                                  ? "destructive"
                                  : variance > 0
                                    ? "success"
                                    : "info"
                              }
                              title="Adelanto/retraso según fecha prevista"
                            >
                              <Timer className="mr-1 h-3 w-3" />
                              {variance > 0
                                ? `+${variance}d`
                                : variance < 0
                                  ? `${variance}d`
                                  : "Al día"}
                            </Badge>
                          )}
                          <Badge variant={pct > 90 ? "destructive" : pct > 75 ? "warning" : "info"}>
                            {pct.toFixed(0)}%
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <ProgressBar value={pct} height="h-1.5" className="mt-2" />
                      {summary.dailyCost > 0 && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Costo promedio diario: {formatCOP(summary.dailyCost)}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Valor total contratado
              </span>
              <span className="font-semibold tabular-nums">
                {formatCOP(totals.totalContractValue)}
              </span>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

function MiniCover({ path, name }: { path: string | null; name: string }) {
  const coverUrl = useProjectCover(path);
  if (!coverUrl) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <FolderKanban className="h-5 w-5 text-primary" />
      </div>
    );
  }
  return (
    <img
      src={coverUrl}
      alt={`Portada de ${name}`}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
    />
  );
}
