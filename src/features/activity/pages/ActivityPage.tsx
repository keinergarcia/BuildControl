import { useMemo, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/money";
import { formatDate, formatTime } from "@/utils/date";
import { useActivity } from "@/features/activity/api/useActivity";
import { useProjects } from "@/features/projects/api/useProjects";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ActivityItem, ActivityKind } from "@/features/activity/api/activity";
import {
  Receipt,
  CircleDollarSign,
  TrendingUp,
  ArrowDownToLine,
  History,
  Loader2,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  ActivityKind,
  { label: string; icon: typeof Receipt; chip: string; amount: string }
> = {
  expense: { label: "Gastos", icon: Receipt, chip: "bg-destructive", amount: "text-destructive" },
  worker_payment: { label: "Pagos", icon: CircleDollarSign, chip: "bg-info", amount: "text-info" },
  income: { label: "Ingresos", icon: TrendingUp, chip: "bg-success", amount: "text-success" },
  withdrawal: { label: "Retiros", icon: ArrowDownToLine, chip: "bg-warning", amount: "text-warning" },
  audit: { label: "Auditoría", icon: History, chip: "bg-muted-foreground", amount: "text-muted-foreground" },
};

const FILTERS: Array<{ key: ActivityKind | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "expense", label: "Gastos" },
  { key: "worker_payment", label: "Pagos" },
  { key: "income", label: "Ingresos" },
  { key: "withdrawal", label: "Retiros" },
  { key: "audit", label: "Auditoría" },
];

export default function ActivityPage() {
  const { data: projects = [], isLoading: loadingProjects, isError, refetch } = useProjects({});
  const { user } = useAuth();
  const [filter, setFilter] = useState<ActivityKind | "all">("all");

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const { data: items = [], isLoading, isFetching } = useActivity(projectIds, user?.id);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [items]);

  const groups = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of filtered) {
      const key = item.date || item.created_at.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, list]) => ({ date, list }));
  }, [filtered]);

  // Fecha de referencia estable por montaje (evita Date.now() durante el render).
  const [dayLabels] = useState(() => {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
    return { today, yesterday };
  });
  const { today, yesterday } = dayLabels;

  const groupLabel = (date: string) => {
    if (date === today) return "Hoy";
    if (date === yesterday) return "Ayer";
    return formatDate(date);
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todos los movimientos y modificaciones importantes de tus obras.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RotateCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-xs rounded-full border px-3 py-1.5 transition-colors cursor-pointer",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 tabular-nums", filter === f.key ? "opacity-80" : "text-muted-foreground")}>
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <Card>
          {isLoading || loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Cargando historial…</span>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No se pudo cargar el historial.
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Aún no hay movimientos. Registra gastos, pagos o ingresos para verlos aquí.
              </p>
            </div>
          ) : (
            <CardContent className="p-4">
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {groupLabel(g.date)}
                      </span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-1">
                      {g.list.map((item) => {
                        const meta = KIND_META[item.kind];
                        const Icon = meta.icon;
                        const pName = item.project_id ? projectName.get(item.project_id) : null;
                        return (
                          <div
                            key={item.key}
                            className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                          >
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0", meta.chip)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium truncate">{item.description || meta.label.toLowerCase()}</span>
                                {pName && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                    {pName}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {meta.label} · {formatTime(String(item.created_at || "").slice(11, 16))}
                              </p>
                            </div>
                            <span className={cn("text-sm font-semibold tabular-nums shrink-0", meta.amount)}>
                              {item.amount != null ? formatCOP(item.amount) : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}