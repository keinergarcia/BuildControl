import type { FinancialSummary, ProjectWithDetails } from "@/types";
import type { FinancialAlert } from "@/engine/calculations";
import {
  detectExpenseAnomalies,
  findOverbudgetCategories,
  groupExpensesByMonth,
} from "@/engine/analysis";
import { formatCOP, formatCOPShort } from "@/lib/money";

// =============================================
// Asistente: respuestas basadas exclusivamente
// en datos reales. Nunca inventa.
// =============================================

export interface AssistantTotals {
  activeProjects: number;
  totalContractValue: number;
  totalReceived: number;
  totalPending: number;
  totalCosts: number;
  totalExpenses: number;
  totalLabor: number;
  totalWithdrawals: number;
  availableCash: number;
  totalProfit: number;
  expectedProfit: number;
  projectedProfit: number;
  weightedBudgetUsed: number;
  totalBudget: number;
  weightedProfitMargin: number;
}

export interface AssistantRow {
  project: ProjectWithDetails;
  summary: FinancialSummary;
}

export interface AssistantContext {
  projects: ProjectWithDetails[];
  rows: AssistantRow[];
  totals: AssistantTotals;
  alerts: FinancialAlert[];
}

export type AssistantTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface AssistantAnswer {
  text: string;
  tone: AssistantTone;
  suggestions: string[];
}

export const SUGGESTIONS = [
  "¿Cuál es mi utilidad total?",
  "¿Cuánto he gastado en total?",
  "¿Cuánto dinero me queda?",
  "¿Cuánto me deben mis clientes?",
  "¿Voy por encima del presupuesto?",
  "¿Hay gastos atípicos?",
  "¿Cómo van los tiempos de mis obras?",
];

const STOPWORDS = new Set([
  "cuanto",
  "cuanto",
  "que",
  "he",
  "ha",
  "hay",
  "ten",
  "tengo",
  "esta",
  "estan",
  "mis",
  "mi",
  "en",
  "el",
  "la",
  "los",
  "las",
  "de",
  "del",
  "por",
  "para",
  "con",
  "sin",
  "sobre",
  "segun",
  "total",
  "general",
  "me",
  "te",
  "hacer",
  "hazme",
  "dime",
  "ponme",
  "como",
  "hasta",
  "ahora",
]);

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function allExpenses(ctx: AssistantContext) {
  return ctx.projects.flatMap((p) => p.expenses ?? []);
}

function allWorkerPayments(ctx: AssistantContext) {
  return ctx.projects.flatMap((p) => p.worker_payments ?? []);
}

function line(label: string, value: string): string {
  return `• ${label}: ${value}`;
}

function buildSummary(ctx: AssistantContext): AssistantAnswer {
  const t = ctx.totals;
  const criticas = ctx.alerts.filter((a) => a.severity === "critical").length;
  const lines: string[] = [];

  if (ctx.rows.length === 0) {
    lines.push(
      "Aún no tienes obras registradas. Crea una obra y agrega sus contratos, presupuestos y gastos para que pueda darte números reales."
    );
    return { text: lines.join("\n"), tone: "neutral", suggestions: SUGGESTIONS };
  }

  lines.push(
    `Tienes ${t.activeProjects} obra${t.activeProjects === 1 ? "" : "s"} en curso de ${ctx.rows.length} en total.`
  );
  lines.push(line("Contratado", formatCOP(t.totalContractValue)));
  lines.push(line("Recibido", formatCOP(t.totalReceived)));
  lines.push(line("Pendiente por cobrar", formatCOP(t.totalPending)));
  lines.push(line("Costos totales", formatCOP(t.totalCosts)));
  lines.push(line("Utilidad actual", formatCOP(t.totalProfit)));

  const tooMany = ctx.rows.filter((r) => r.summary.budgetUsed > 100).length;
  if (tooMany > 0) {
    lines.push(`⚠ ${tooMany} obra${tooMany === 1 ? "" : "s"} por encima del presupuesto.`);
  }
  if (criticas > 0) {
    lines.push(`⚠ ${criticas} alerta${criticas === 1 ? "" : "s"} crítica${criticas === 1 ? "" : "s"} activa${criticas === 1 ? "" : "s"}.`);
  }
  lines.push("Pregúntame por gastos, pagos a trabajadores, caja o utilidad.");

  return { text: lines.join("\n"), tone: criticas > 0 ? "warning" : "info", suggestions: SUGGESTIONS };
}

function answerProfit(ctx: AssistantContext): AssistantAnswer {
  const t = ctx.totals;
  const tone: AssistantTone = t.totalProfit >= 0 ? "success" : "danger";
  const lines = [
    `${tone === "success" ? "Tu utilidad actual es" : "Vas en pérdida:"} ${formatCOP(t.totalProfit)} (margen ${t.weightedProfitMargin}%).`,
  ];
  const mejores = [...ctx.rows]
    .filter((r) => r.project.status !== "cancelado")
    .sort((a, b) => b.summary.profit - a.summary.profit);
  if (mejores[0]) {
    lines.push(line("Mejor obra", `${mejores[0].project.name} (${formatCOP(mejores[0].summary.profit)})`));
  }
  if (mejores[1]) {
    lines.push(line("2.ª obra", `${mejores[1].project.name} (${formatCOP(mejores[1].summary.profit)})`));
  }
  lines.push(`Utilidad prevista (según presupuesto): ${formatCOP(t.expectedProfit)}.`);
  lines.push(`Utilidad proyectada a hoy: ${formatCOP(t.projectedProfit)}.`);
  return { text: lines.join("\n"), tone, suggestions: SUGGESTIONS };
}

function answerBudget(ctx: AssistantContext): AssistantAnswer {
  const over = ctx.rows.filter((r) => r.summary.budgetUsed > 100);
  if (over.length === 0) {
    const high = ctx.rows.filter((r) => r.summary.budgetUsed > 80);
    if (high.length === 0) {
      return {
        text: "Estás dentro del presupuesto en todas las obras. ¡Bien!",
        tone: "success",
        suggestions: SUGGESTIONS,
      };
    }
    const lines = [
      "Ninguna obra supera el presupuesto, pero estas van por encima del 80%:",
      ...high.map((r) =>
        line(r.project.name, `${r.summary.budgetUsed}% usado (${formatCOP(r.summary.totalCosts)} de ${formatCOP(r.summary.totalBudget)})`)
      ),
    ];
    return { text: lines.join("\n"), tone: "warning", suggestions: SUGGESTIONS };
  }

  const lines = [`⚠ Obras por encima del presupuesto:`];
  const maxDetail = 3;
  for (const r of over.slice(0, maxDetail)) {
    const exceso = r.summary.totalCosts - r.summary.totalBudget;
    const spentById = new Map<string, number>();
    for (const e of r.project.expenses ?? []) {
      if (!e.category_id) continue;
      spentById.set(e.category_id, (spentById.get(e.category_id) ?? 0) + Number(e.amount));
    }
    const cats = findOverbudgetCategories(r.project.budgets ?? [], spentById);
    lines.push(
      line(
        r.project.name,
        `${r.summary.budgetUsed}% del presupuesto (exceso ${formatCOPShort(Math.max(0, exceso))})`
      )
    );
    for (const c of cats.slice(0, 2)) {
      lines.push(`   · ${c.name}: ${c.percent}% (${formatCOPShort(c.over)} sobre)`);
    }
  }
  if (over.length > maxDetail) {
    lines.push(`...y ${over.length - maxDetail} obra(s) más con sobrecosto.`);
  }
  return { text: lines.join("\n"), tone: "danger", suggestions: SUGGESTIONS };
}

function answerCash(ctx: AssistantContext): AssistantAnswer {
  const t = ctx.totals;
  const lines = [
    `Te quedan ${formatCOP(t.availableCash)} en caja (recibido ${formatCOP(t.totalReceived)} − costos ${formatCOP(t.totalCosts)} ${t.totalWithdrawals > 0 ? `− retiros ${formatCOP(t.totalWithdrawals)}` : ""}).`,
  ];
  if (t.totalPending > 0) {
    lines.push(`Falta por cobrar: ${formatCOP(t.totalPending)} a tus clientes.`);
  } else {
    lines.push("No hay montos pendientes por cobrar.");
  }
  return {
    text: lines.join("\n"),
    tone: t.availableCash < 0 ? "danger" : "success",
    suggestions: SUGGESTIONS,
  };
}

function answerReceived(ctx: AssistantContext): AssistantAnswer {
  const t = ctx.totals;
  const lines = [
    `Has recibido en total ${formatCOP(t.totalReceived)} de ${formatCOP(t.totalContractValue)} contratados.`,
  ];
  const withIncome = ctx.rows
    .filter((r) => r.summary.receivedAmount > 0)
    .sort((a, b) => b.summary.receivedAmount - a.summary.receivedAmount)
    .slice(0, 3);
  for (const r of withIncome) {
    lines.push(line(r.project.name, formatCOP(r.summary.receivedAmount)));
  }
  lines.push(
    t.totalPending > 0
      ? `Pendiente por cobrar: ${formatCOP(t.totalPending)}.`
      : "Ya tienes todo el contrato cobrado."
  );
  return {
    text: lines.join("\n"),
    tone: t.totalPending > 0 ? "info" : "success",
    suggestions: SUGGESTIONS,
  };
}

function answerSpend(ctx: AssistantContext, q: string): AssistantAnswer {
  const expenses = allExpenses(ctx);
  const t = ctx.totals;

  const keyword = findExpenseKeyword(q, expenses);
  if (keyword) {
    const filtered = expenses.filter((e) => expenseMatches(e, keyword));
    const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
    if (filtered.length > 0) {
      return {
        text: `Has gastado ${formatCOPShort(total)} en "${keyword.keyword}" por ${filtered.length} registro${filtered.length === 1 ? "" : "s"}.`,
        tone: "info",
        suggestions: SUGGESTIONS,
      };
    }
  }

  const lines = [
    `Gastos registrados: ${formatCOP(t.totalExpenses)}.`,
    `Mano de obra (pagos a trabajadores): ${formatCOP(t.totalLabor)}.`,
    `Costo total: ${formatCOP(t.totalCosts)} (uso del presupuesto ${t.weightedBudgetUsed}%).`,
  ];
  const byMonth = groupExpensesByMonth(expenses);
  const last = byMonth[byMonth.length - 1];
  if (last) {
    lines.push(`${last.label.toUpperCase()}: ${formatCOP(last.total)} en gastos.`);
  }
  return { text: lines.join("\n"), tone: "info", suggestions: SUGGESTIONS };
}

function expenseMatches(
  e: { description: string; category_id: string | null; category?: { name: string } | null; supplier?: { name: string } | null },
  kw: { keyword: string }
): boolean {
  const norm = stripAccents(kw.keyword.toLowerCase());
  const haystack = stripAccents(
    `${e.description} ${e.category?.name ?? ""} ${e.supplier?.name ?? ""}`.toLowerCase()
  );
  return haystack.includes(norm);
}

export function findExpenseKeyword(
  q: string,
  expenses: { description: string; category_id: string | null; category?: { name: string } | null; supplier?: { name: string } | null }[]
): { keyword: string; detail: string | null } | null {
  const won = new Set(["gastado", "gastos", "gasto", "costos", "costo", "cuanto", "total", "tengo", "he", "registrado", "actual", "estoy", "menos", "mas"]);
  const candidateTokens = q
    .replace(/[¿?.,!¡]/g, " ")
    .split(/\s+/)
    .map(stripAccents)
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 2 && !STOPWORDS.has(s) && !won.has(s) && !monthNames.includes(s));

  let best: { token: string; matches: number } | null = null;
  for (const token of candidateTokens) {
    const matches = expenses.filter((e) => expenseMatches(e, { keyword: token })).length;
    if (matches > 0 && (!best || matches > best.matches)) {
      best = { token, matches };
    }
  }
  if (!best) return null;

  return { keyword: best.token, detail: null };
}

function answerWorkers(ctx: AssistantContext, q: string): AssistantAnswer {
  const payments = allWorkerPayments(ctx);
  const t = ctx.totals;

  const workerNames = new Set<string>();
  for (const p of payments) {
    if (p.worker?.name) workerNames.add(p.worker.name);
  }
  const normNames = [...workerNames].map((n) => ({ name: n, norm: stripAccents(n.toLowerCase()) }));

  const words = q
    .replace(/[¿?.,!¡]/g, " ")
    .split(/\s+/)
    .map((s) => stripAccents(s.toLowerCase()))
    .filter((s) => s.length >= 3);

  let match: { name: string } | null = null;
  for (const mn of normNames) {
    const hits = words.filter((w) => mn.norm.includes(w) || w.includes(mn.norm));
    if (hits.length > 0) {
      match = mn;
      break;
    }
  }
  const conceptKw = [...wonConcept(q, payments)].join(" ");

  if (match) {
    const p = payments.filter((x) => x.worker?.name === match.name);
    const total = p.reduce((s, x) => s + Number(x.amount), 0);
    const last = p.reduce((a, b) => (b.payment_date > a.payment_date ? b : a), p[0]);
    return {
      text: `Le has pagado a ${match.name} ${formatCOP(total)} en ${p.length} pago${p.length === 1 ? "" : "s"}${last ? ` (último el ${formatDate(last.payment_date)})` : ""}.`,
      tone: "info",
      suggestions: SUGGESTIONS,
    };
  }

  if (conceptKw) {
    const p = payments.filter((x) =>
      stripAccents(`${x.concept} ${x.payment_method ?? ""}`.toLowerCase()).includes(conceptKw)
    );
    const total = p.reduce((s, x) => s + Number(x.amount), 0);
    if (p.length > 0) {
      return {
        text: `Pagos por "${conceptKw}": ${formatCOP(total)} en ${p.length} registro${p.length === 1 ? "" : "s"}.`,
        tone: "info",
        suggestions: SUGGESTIONS,
      };
    }
  }

  const byWorker = new Map<string, number>();
  for (const p of payments) {
    const name = p.worker?.name ?? "Sin asignar";
    byWorker.set(name, (byWorker.get(name) ?? 0) + Number(p.amount));
  }
  const top = [...byWorker.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const lines = [`Total pagado a trabajadores: ${formatCOP(t.totalLabor)}.`];
  for (const [name, total] of top) {
    lines.push(line(name, formatCOP(total)));
  }
  return { text: lines.join("\n"), tone: "info", suggestions: SUGGESTIONS };
}

function wonConcept(q: string, payments: { concept: string }[]): Set<string> {
  const out = new Set<string>();
  const words = q
    .replace(/[¿?.,!¡]/g, " ")
    .split(/\s+/)
    .map((s) => stripAccents(s.toLowerCase()))
    .filter((s) => s.length >= 4 && !STOPWORDS.has(s));
  for (const p of payments) {
    const concept = stripAccents(p.concept.toLowerCase());
    for (const w of words) {
      if (concept.includes(w)) out.add(w);
    }
  }
  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function answerSchedule(ctx: AssistantContext): AssistantAnswer {
  const active = ctx.rows.filter(
    (r) => r.project.status !== "finalizado" && r.project.status !== "cancelado"
  );
  if (active.length === 0) {
    return {
      text: "No hay obras en curso. Veo solo obras finalizadas o canceladas.",
      tone: "neutral",
      suggestions: SUGGESTIONS,
    };
  }
  const lines: string[] = [];
  for (const r of active) {
    const v = r.summary.scheduleVariance;
    let extra: string;
    if (v > 0) extra = `adelantado +${v} día${v === 1 ? "" : "s"}`;
    else if (v < 0) extra = `retrasado ${v} día${v === -1 ? "" : "s"}`;
    else extra = "al día";
    lines.push(
      `${r.project.name}: ${extra}, restan ${r.summary.daysRemaining} día${r.summary.daysRemaining === 1 ? "" : "s"}.`
    );
  }
  return { text: lines.join("\n"), tone: "info", suggestions: SUGGESTIONS };
}

function answerAnomalies(ctx: AssistantContext): AssistantAnswer {
  const expenses = allExpenses(ctx);
  const anomalies = detectExpenseAnomalies(expenses).slice(0, 5);
  const criticas = ctx.alerts.filter((a) => a.severity === "critical");

  if (anomalies.length === 0 && criticas.length === 0) {
    return {
      text: "No detecté gastos atípicos ni alertas críticas. Todo se ve normal.",
      tone: "success",
      suggestions: SUGGESTIONS,
    };
  }
  const lines: string[] = [];
  if (anomalies.length > 0) {
    lines.push("Gastos atípicos detectados (comparados con el resto de tus registros):");
    for (const a of anomalies) {
      const project = ctx.projects.find((p) => p.id === a.item.project_id);
      lines.push(
        `• ${a.item.description || "Gasto"} de ${formatCOP(a.amount)}${project ? ` en ${project.name}` : ""} (${formatDate(a.item.expense_date)}).`
      );
    }
  }
  for (const a of criticas.slice(0, 3)) {
    lines.push(`• ⚠ ${a.title} · ${a.message}`);
  }
  return { text: lines.join("\n"), tone: "warning", suggestions: SUGGESTIONS };
}

function answerMonthly(ctx: AssistantContext): AssistantAnswer {
  const expenses = allExpenses(ctx);
  const byMonth = groupExpensesByMonth(expenses);
  if (byMonth.length === 0) {
    return { text: "No hay gastos registrados por mes todavía.", tone: "neutral", suggestions: SUGGESTIONS };
  }
  const last = byMonth[byMonth.length - 1];
  const prev = byMonth[byMonth.length - 2];
  const lines = [`Gasto total por mes:`];
  for (const m of byMonth.slice(-6)) {
    lines.push(`• ${m.label}: ${formatCOP(m.total)} (${m.count} registro${m.count === 1 ? "" : "s"})`);
  }
  if (prev && last) {
    const delta = last.total - prev.total;
    lines.push(
      delta > 0
        ? `Este mes ${last.label} gastaste ${formatCOPShort(delta)} más que ${prev.label}.`
        : delta < 0
          ? `Este mes ${last.label} gastaste ${formatCOPShort(Math.abs(delta))} menos que ${prev.label}.`
          : `Este mes gastaste lo mismo que ${prev.label}.`
    );
  }
  return { text: lines.join("\n"), tone: "info", suggestions: SUGGESTIONS };
}

function answerCounts(ctx: AssistantContext): AssistantAnswer {
  const t = ctx.totals;
  const finalizadas = ctx.rows.filter((r) => r.project.status === "finalizado").length;
  const canceladas = ctx.rows.filter((r) => r.project.status === "cancelado").length;
  return {
    text: `Tienes ${ctx.rows.length} obra${ctx.rows.length === 1 ? "" : "s"} en total: ${t.activeProjects} en curso, ${finalizadas} finalizada${finalizadas === 1 ? "" : "s"}${canceladas > 0 ? ` y ${canceladas} cancelada${canceladas === 1 ? "" : "s"}` : ""}.`,
    tone: "info",
    suggestions: SUGGESTIONS,
  };
}

const normalized = (s: string) => stripAccents(s.toLowerCase());

export function answerQuestion(question: string, ctx: AssistantContext): AssistantAnswer {
  const q = ` ${normalized(question.trim())} `;

  if (/(hola|buenas|buenos dias|buenas tardes|hey|que tal)/.test(q) && !/(cuanto|cual)/.test(q)) {
    return {
      text: `Hola 👋 Soy tu asistente de BuildControl. Te respondo solo con los datos que tienes registrados: gastos, pagos, ingresos, presupuestos y tiempos de tus obras.`,
      tone: "neutral",
      suggestions: SUGGESTIONS,
    };
  }

  if (/(cuantas|cuantos)\s+(obras?|proyectos?)/.test(q)) {
    return answerCounts(ctx);
  }

  if (/(anomali|atipic|sospechos|alertas?|raro|sospecha)/.test(q)) {
    return answerAnomalies(ctx);
  }

  if (/(mes|mensual|tendencia|historico|estadistico)/.test(q)) {
    return answerMonthly(ctx);
  }

  if (/(adelant|retras|plazo|tiempo|dias)/.test(q)) {
    return answerSchedule(ctx);
  }

  if (/(gastad|gasto|gastos|costos|costo)/.test(q)) {
    return answerSpend(ctx, q);
  }

  if (/(pagad|pagos?|salario|jornal|trabajadores?|mano de obra)/.test(q)) {
    return answerWorkers(ctx, q);
  }

  if (/(utilidad|ganancia|rentabil|margen|beneficio|perdiendo|perdida)/.test(q)) {
    return answerProfit(ctx);
  }

  if (/(presupuesto|sobrecost|por encima|superar|exceder)/.test(q)) {
    return answerBudget(ctx);
  }

  if (/(recibid|ingres|cobrad|clientes?|me deben|deben)/.test(q)) {
    return answerReceived(ctx);
  }

  if (/(me queda|queda|quedan|resta|sobra|disponible|caja|dispon|falta|faltan|efectivo)/.test(q)) {
    return answerCash(ctx);
  }

  return buildSummary(ctx);
}