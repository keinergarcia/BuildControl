import { useEffect, useMemo, useRef, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCOP, formatCOPShort } from "@/lib/money";
import { useDashboard } from "@/features/dashboard/api/useDashboard";
import {
  answerQuestion,
  SUGGESTIONS,
  type AssistantContext,
  type AssistantTone,
} from "@/features/assistant/insights";
import { callAi } from "@/features/assistant/api/aiProxy";
import {
  detectExpenseAnomalies,
  findOverbudgetCategories,
} from "@/engine";

import {
  Sparkles,
  Send,
  Bot,
  Loader2,
  AlertTriangle,
  Wallet,
  TrendingDown,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
  tone?: AssistantTone;
}

const toneDot: Record<AssistantTone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export default function AssistantPage() {
  const { projects, projectRows, totals, alerts, isLoading } = useDashboard();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      role: "assistant",
      tone: "neutral",
      text: "Hola 👋 Soy tu asistente. Te respondo solo con los datos que tienes registrados: gastos, pagos, ingresos, presupuestos y tiempos de tus obras.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiMode, setAiMode] = useState<"on" | "off">("off");
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    void callAi("predict", { task: "health" }).then((res) => {
      if (active) setAiMode(res?.served ? "on" : "off");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const ctx = useMemo<AssistantContext>(
    () => ({ projects, rows: projectRows, totals, alerts }),
    [projects, projectRows, totals, alerts]
  );

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: question }]);
    setBusy(true);

    const local = answerQuestion(question, ctx);

    let finalText = local.text;
    if (aiMode === "on") {
      const ai = await callAi("chat", {
        question,
        answerLocal: local.text,
        dataSource: { projects: projects.length, totals },
      });
      if (ai?.text) finalText = ai.text;
    }

    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: "assistant", text: finalText, tone: local.tone },
    ]);
    setBusy(false);
    textareaRef.current?.focus();
  };

  const analysis = useMemo(() => {
    const allExpenses = projects.flatMap((p) => p.expenses ?? []);
    const anomalies = detectExpenseAnomalies(allExpenses).slice(0, 3);

    const overbudget: { name: string; percent: number; over: number }[] = [];
    for (const row of projectRows) {
      const spent = new Map<string, number>();
      for (const e of row.project.expenses ?? []) {
        if (!e.category_id) continue;
        spent.set(e.category_id, (spent.get(e.category_id) ?? 0) + Number(e.amount));
      }
      for (const c of findOverbudgetCategories(row.project.budgets ?? [], spent)) {
        overbudget.push({ name: c.name, percent: c.percent, over: c.over });
      }
    }
    overbudget.sort((a, b) => b.over - a.over);

    const util = [...projectRows]
      .map((r) => ({
        name: r.project.name,
        expected: r.summary.expectedProfit,
        projected: r.summary.projectedProfit,
        current: r.summary.profit,
      }))
      .sort((a, b) => b.current - a.current)
      .slice(0, 4);

    return { anomalies, overbudget: overbudget.slice(0, 4), util };
  }, [projects, projectRows]);

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Asistente IA
              <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Respuestas basadas solo en tus datos reales. Nunca inventa.
            </p>
          </div>
          <Badge variant={aiMode === "on" ? "default" : "outline"} className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            {aiMode === "on" ? "Capa IA conectada" : "Motor local"}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
          <Card className="print:hidden">
            <div className="flex flex-col h-[560px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Cargando tus datos…</span>
                  </div>
                ) : (
                  <>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                          m.role === "user"
                            ? "self-end ml-auto bg-primary text-primary-foreground rounded-br-sm"
                            : "self-start bg-muted text-foreground rounded-bl-sm border border-border"
                        )}
                      >
                        {m.role === "assistant" && (
                          <span
                            className={cn(
                              "absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full border-2 border-background",
                              toneDot[m.tone ?? "neutral"]
                            )}
                          />
                        )}
                        {m.text}
                      </div>
                    ))}
                    {busy && (
                      <div className="max-w-[85%] self-start text-sm text-muted-foreground flex items-center gap-2 px-4 py-3 bg-muted rounded-2xl rounded-bl-sm border border-border">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consultando tus registros…
                      </div>
                    )}
                    <div ref={endRef} />
                  </>
                )}
              </div>

              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    disabled={busy}
                    className="text-xs rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="border-t border-border p-3 flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Pregunta algo sobre tus números…"
                  className="flex-1 resize-none min-h-[40px] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  size="icon"
                  onClick={() => void send()}
                  disabled={busy || !input.trim()}
                  className="h-10 w-10 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <Row label="Obras en curso" value={String(totals.activeProjects)} />
                <Row label="Contratado" value={formatCOPShort(totals.totalContractValue)} />
                <Row label="Costos" value={formatCOPShort(totals.totalCosts)} />
                <Row label="En caja" value={formatCOPShort(totals.availableCash)} />
                <Row label="Utilidad" value={formatCOPShort(totals.totalProfit)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Rubros sobre presupuesto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {analysis.overbudget.length === 0 ? (
                  <p className="text-muted-foreground">Ningún rubro supera su presupuesto.</p>
                ) : (
                  analysis.overbudget.map((o) => (
                    <div key={o.name}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{o.name}</span>
                        <span className="text-muted-foreground">
                          {o.percent}% · +{formatCOPShort(o.over)}
                        </span>
                      </div>
                      <Progress value={Math.min(100, o.percent)} className="h-1.5 bg-warning/20 [&>div]:bg-warning" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Gastos atípicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analysis.anomalies.length === 0 ? (
                  <p className="text-muted-foreground">No hay gastos atípicos detectados.</p>
                ) : (
                  analysis.anomalies.map((a, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="truncate">{a.item.description || "Gasto"}</span>
                      <span className="font-medium tabular-nums shrink-0">{formatCOP(a.amount)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Utilidad por obra</CardTitle>
                <CardDescription>Actual vs. prevista</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {analysis.util.length === 0 ? (
                  <p className="text-muted-foreground">Sin obras con contratos.</p>
                ) : (
                  analysis.util.map((u) => (
                    <div key={u.name}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium truncate">{u.name}</span>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {formatCOPShort(u.expected)}
                        </span>
                      </div>
                      <Progress value={u.expected > 0 ? Math.max(5, Math.min(100, (u.current / u.expected) * 100)) : 0} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Hoy: <span className="tabular-nums">{formatCOPShort(u.current)}</span>
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
              <Bot className="h-4 w-4" />
              Capa: React → Supabase Edge Function → proveedor de IA (configurable).
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}