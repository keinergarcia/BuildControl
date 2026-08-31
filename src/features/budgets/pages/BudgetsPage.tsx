import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProjects } from "@/features/projects/api/useProjects";
import { useProject } from "@/features/projects/api/useProjects";
import { useBudgetCategories, useSaveProjectBudgets } from "@/features/budgets/api/useBudgets";
import {
  formatCOP,
  formatCOPShort,
  parseCurrencyInput,
  safeAdd,
  safePercentage,
} from "@/lib/money";
import { Loader2, Save, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export default function BudgetsPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string>("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: projects = [] } = useProjects({});
  const project = useProject(projectId || undefined);
  const { data: categories = [] } = useBudgetCategories();
  const saveMutation = useSaveProjectBudgets();

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  const budgets = project.data?.budgets ?? [];
  const expenses = project.data?.expenses ?? [];

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const key = e.category_id ?? "";
      map[key] = safeAdd(map[key] ?? 0, Number(e.amount));
    }
    return map;
  }, [expenses]);

  const rows = useMemo(() => {
    const budgetMap = new Map(budgets.map((b) => [b.category_id, Number(b.budgeted_amount)]));
    return categories.map((c) => ({
      category: c,
      budgeted: budgetMap.get(c.id) ?? 0,
      spent: spentByCategory[c.id] ?? 0,
    }));
  }, [categories, budgets, spentByCategory]);

  const totalBudgeted = useMemo(() => safeAdd(...rows.map((r) => r.budgeted)), [rows]);
  const totalSpent = useMemo(() => safeAdd(...rows.map((r) => r.spent)), [rows]);
  const available = totalBudgeted - totalSpent;
  const usedPct = safePercentage(totalSpent, totalBudgeted);
  const contractValue = useMemo(() => {
    const c = project.data?.contracts?.[0];
    return c ? Number(c.total_value) : null;
  }, [project.data]);

  const handleSave = () => {
    if (!user || !projectId) return;
    const items = rows.map((r) => ({
      category_id: r.category.id,
      budgeted_amount: parseCurrencyInput(edits[r.category.id] ?? "") || 0,
    }));
    saveMutation.mutate(
      { projectId, userId: user.id, items },
      {
        onSuccess: () => {
          setEdits({});
          toast.success("Presupuesto guardado", {
            description: "Los cálculos de utilización se actualizan.",
          });
        },
        onError: () => toast.error("No se pudo guardar el presupuesto"),
      }
    );
  };

  const setAmount = (categoryId: string, value: string) => {
    setEdits((prev) => ({ ...prev, [categoryId]: value }));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Presupuesto</h1>
            <p className="text-muted-foreground">
              Define el presupuesto por rubro y compáralo con el gasto real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="glow" onClick={handleSave} disabled={!projectId || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {!projectId && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Selecciona un proyecto</p>
            <p className="text-sm text-muted-foreground">
              Elige un proyecto en el selector superior para gestionar su presupuesto.
            </p>
          </Card>
        )}

        {projectId && project.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        )}

        {projectId && project.isError && (
          <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p>No se pudo cargar el presupuesto del proyecto.</p>
          </Card>
        )}

        {projectId && project.data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Presupuesto total"
                value={formatCOPShort(totalBudgeted)}
                icon={<Wallet className="h-5 w-5 text-primary" />}
              />
              <StatCard
                label="Gastado"
                value={formatCOPShort(totalSpent)}
                icon={<TrendingUp className="h-5 w-5 text-destructive" />}
                sub={`${safePercentage(totalSpent, totalBudgeted)}% utilizado`}
              />
              <StatCard
                label="Disponible"
                value={formatCOPShort(available)}
                icon={<Wallet className="h-5 w-5 text-emerald-500" />}
                negative={available < 0}
              />
              <StatCard
                label="Valor del contrato"
                value={contractValue != null ? formatCOP(contractValue) : "—"}
                icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rubros del presupuesto</CardTitle>
                <Badge variant={usedPct > 100 ? "destructive" : "secondary"}>
                  {safePercentage(totalSpent, totalBudgeted)}% utilizado
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 p-2">
                <div className="hidden grid-cols-[1fr_repeat(3,120px)] gap-4 px-4 pb-2 text-xs font-medium text-muted-foreground md:grid">
                  <span>Rubro</span>
                  <span>Presupuestado</span>
                  <span>Gastado</span>
                  <span>Utilización</span>
                </div>
                {rows.map((r) => {
                  const pct = safePercentage(r.spent, r.budgeted);
                  const currentValue = edits[r.category.id] !== undefined
                    ? edits[r.category.id]
                    : String(r.budgeted || "");
                  return (
                    <div
                      key={r.category.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-[1fr_repeat(3,120px)] md:items-center md:gap-4"
                    >
                      <div>
                        <p className="font-medium">{r.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Gastado: <span className="tabular-nums">{formatCOPShort(r.spent)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 md:flex-col md:items-start">
                        <Label className="md:hidden">Presupuestado</Label>
                        <Input
                          value={currentValue}
                          onChange={(e) => setAmount(r.category.id, e.target.value)}
                          placeholder="0"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground md:hidden">Gastado</p>
                        <p className="font-semibold tabular-nums">{formatCOPShort(r.spent)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} className="flex-1" />
                        <span className="w-10 text-right text-xs tabular-nums">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
  negative,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
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
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
