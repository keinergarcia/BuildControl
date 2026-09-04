import { useMemo, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/money";
import { formatDate } from "@/utils/date";
import { exportXlsx } from "@/lib/xlsx";
import { exportReportPdf } from "@/lib/pdf";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { useDashboard } from "@/features/dashboard/api/useDashboard";
import { useWorkers } from "@/features/workers/api/useWorkers";
import {
  buildProjectRows,
  sumRows,
  exportFinancialReport,
  exportTransactions,
} from "@/features/reports/api/reports";
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Printer,
  Receipt,
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function ReportsPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const { projects, isLoading, isError, refetch } = useDashboard({ withActivity: false });
  const { data: workers = [] } = useWorkers();

  const rows = useMemo(
    () => buildProjectRows(projectFilter === "all" ? projects : projects.filter((p) => p.id === projectFilter)),
    [projects, projectFilter]
  );

  const totals = useMemo(() => sumRows(rows), [rows]);

  const workerName = useMemo(() => {
    const map = new Map(workers.map((w) => [w.id, w.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [workers]);

  const exportGastos = () => {
    exportTransactions(
      "reporte-gastos.csv",
      ["Fecha", "Obra", "Descripción", "Categoría", "Método", "Valor"],
      rows.flatMap((r) =>
        (r.project.expenses ?? []).map((e) => [
          e.expense_date,
          r.project.name,
          e.description,
          e.category?.name ?? "",
          e.payment_method ? PAYMENT_METHOD_LABELS[e.payment_method] : "",
          Number(e.amount),
        ])
      )
    );
  };

  const exportPagos = () => {
    exportTransactions(
      "reporte-pagos.csv",
      ["Fecha", "Obra", "Trabajador", "Concepto", "Método", "Valor"],
      rows.flatMap((r) =>
        (r.project.worker_payments ?? []).map((p) => [
          p.payment_date,
          r.project.name,
          workerName(p.worker_id),
          p.concept,
          p.payment_method ? PAYMENT_METHOD_LABELS[p.payment_method] : "",
          Number(p.amount),
        ])
      )
    );
  };

  const exportIngresos = () => {
    exportTransactions(
      "reporte-ingresos.csv",
      ["Fecha", "Obra", "Concepto", "Método", "Valor"],
      rows.flatMap((r) =>
        (r.project.income_payments ?? []).map((i) => [
          i.payment_date,
          r.project.name,
          i.concept,
          i.payment_method ? PAYMENT_METHOD_LABELS[i.payment_method] : "",
          Number(i.amount),
        ])
      )
    );
  };

  const exportRetiros = () => {
    exportTransactions(
      "reporte-retiros.csv",
      ["Fecha", "Obra", "Motivo", "Valor"],
      rows.flatMap((r) =>
        (r.project.personal_withdrawals ?? []).map((w) => [
          w.withdrawal_date,
          r.project.name,
          w.reason,
          Number(w.amount),
        ])
      )
    );
  };

  const exportExcel = () => {
    const single: unknown[][] = [];

    const pushSection = (title: string, subtitle?: string, table?: { header: string[]; body: unknown[][] }) => {
      single.push([title]);
      if (subtitle) single.push([subtitle]);
      if (table) {
        single.push(table.header);
        for (const row of table.body) single.push(row);
      }
      single.push([]);
    };

    // Bloque de KPIs por obra (igual que la pantalla).
    rows.forEach((r) => {
      const s = r.summary;
      single.push(["Obra", r.project.name]);
      single.push(["Contratado", formatCOP(s.contractValue)]);
      single.push(["Recibido", formatCOP(s.receivedAmount)]);
      single.push(["Pendiente", formatCOP(s.pendingAmount)]);
      single.push(["Costos", formatCOP(s.totalCosts)]);
      single.push(["Utilidad", formatCOP(s.profit)]);
      single.push([]);
    });

    // Resumen financiero por obra (valores formateados en COP).
    pushSection(
      "Resumen financiero por obra",
      "Contrato, flujo de dinero, costos y rentabilidad",
      {
        header: ["Obra", "Contrato", "Recibido", "Pendiente", "Gastos", "Mano de obra", "Retiros", "Caja", "Utilidad", "Margen"],
        body: rows.map((r) => [
          r.project.name,
          formatCOP(r.summary.contractValue),
          formatCOP(r.summary.receivedAmount),
          formatCOP(r.summary.pendingAmount),
          formatCOP(r.summary.totalExpenses),
          formatCOP(r.summary.laborCost),
          formatCOP(r.summary.totalWithdrawals),
          formatCOP(r.summary.availableCash),
          formatCOP(r.summary.profit),
          `${r.summary.profitMargin.toFixed(1)}%`,
        ]),
      }
    );

    // Gastos.
    pushSection("Gastos", undefined, {
      header: ["Fecha", "Obra", "Descripción", "Valor"],
      body: rows.flatMap((r) =>
        (r.project.expenses ?? []).map((e) => [
          formatDate(e.expense_date), r.project.name, e.description, formatCOP(Number(e.amount)),
        ])
      ),
    });

    // Pagos a trabajadores.
    pushSection("Pagos a trabajadores", undefined, {
      header: ["Fecha", "Obra", "Trabajador", "Concepto", "Valor"],
      body: rows.flatMap((r) =>
        (r.project.worker_payments ?? []).map((p) => [
          formatDate(p.payment_date), r.project.name, workerName(p.worker_id), p.concept, formatCOP(Number(p.amount)),
        ])
      ),
    });

    // Ingresos.
    pushSection("Ingresos", undefined, {
      header: ["Fecha", "Obra", "Concepto", "Valor"],
      body: rows.flatMap((r) =>
        (r.project.income_payments ?? []).map((i) => [
          formatDate(i.payment_date), r.project.name, i.concept, formatCOP(Number(i.amount)),
        ])
      ),
    });

    // Retiros personales.
    pushSection("Retiros personales", undefined, {
      header: ["Fecha", "Obra", "Motivo", "Valor"],
      body: rows.flatMap((r) =>
        (r.project.personal_withdrawals ?? []).map((w) => [
          formatDate(w.withdrawal_date), r.project.name, w.reason, formatCOP(Number(w.amount)),
        ])
      ),
    });

    void exportXlsx("reporte-financiero.xlsx", [
      { name: "Reporte financiero", header: [], rows: single },
    ]);
  };

  const exportPdf = () => {
    exportReportPdf(rows, { workerName });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground">
              Informe financiero, exportación CSV e impresión
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="glow" onClick={() => exportFinancialReport(rows)}>
              <FileDown className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Obra</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-72">
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
            <p className="font-semibold">No se pudieron cargar los datos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <p className="font-semibold">Sin datos para el reporte</p>
            <p className="text-sm text-muted-foreground">Crea proyectos para ver reportes.</p>
          </Card>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Contratado</p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {formatCOP(totals.contractValue)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Recibido</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-success">
                  {formatCOP(totals.receivedAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Pendiente</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-warning">
                  {formatCOP(totals.pendingAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Costos</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-destructive">
                  {formatCOP(totals.totalCosts)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Utilidad</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-success">
                  {formatCOP(totals.profit)}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen financiero por obra</CardTitle>
                <CardDescription>
                  Contrato, flujo de dinero, costos y rentabilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Obra</th>
                        <th className="px-5 py-3 text-right font-medium">Contrato</th>
                        <th className="px-5 py-3 text-right font-medium">Recibido</th>
                        <th className="px-5 py-3 text-right font-medium">Pendiente</th>
                        <th className="px-5 py-3 text-right font-medium">Gastos</th>
                        <th className="px-5 py-3 text-right font-medium">Mano de obra</th>
                        <th className="px-5 py-3 text-right font-medium">Retiros</th>
                        <th className="px-5 py-3 text-right font-medium">Caja</th>
                        <th className="px-5 py-3 text-right font-medium">Utilidad</th>
                        <th className="px-5 py-3 text-right font-medium">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.project.id} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-3 font-medium">{r.project.name}</td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.contractValue)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.receivedAmount)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-warning">
                            {formatCOP(r.summary.pendingAmount)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.totalExpenses)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.laborCost)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.totalWithdrawals)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCOP(r.summary.availableCash)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-semibold text-success">
                            {formatCOP(r.summary.profit)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {r.summary.profitMargin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Gastos
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportGastos}>
                  <FileDown className="h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Fecha</th>
                        <th className="px-5 py-3 font-medium">Obra</th>
                        <th className="px-5 py-3 font-medium">Descripción</th>
                        <th className="px-5 py-3 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.flatMap((r) =>
                        (r.project.expenses ?? []).map((e) => (
                          <tr key={e.id} className="border-b border-border/60 last:border-0">
                            <td className="px-5 py-2.5 text-muted-foreground">{formatDate(e.expense_date)}</td>
                            <td className="px-5 py-2.5">{r.project.name}</td>
                            <td className="px-5 py-2.5">{e.description}</td>
                            <td className="px-5 py-2.5 text-right tabular-nums">{formatCOP(Number(e.amount))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Pagos a trabajadores
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportPagos}>
                  <FileDown className="h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Fecha</th>
                        <th className="px-5 py-3 font-medium">Obra</th>
                        <th className="px-5 py-3 font-medium">Trabajador</th>
                        <th className="px-5 py-3 font-medium">Concepto</th>
                        <th className="px-5 py-3 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.flatMap((r) =>
                        (r.project.worker_payments ?? []).map((p) => (
                          <tr key={p.id} className="border-b border-border/60 last:border-0">
                            <td className="px-5 py-2.5 text-muted-foreground">{formatDate(p.payment_date)}</td>
                            <td className="px-5 py-2.5">{r.project.name}</td>
                            <td className="px-5 py-2.5">{workerName(p.worker_id)}</td>
                            <td className="px-5 py-2.5">{p.concept}</td>
                            <td className="px-5 py-2.5 text-right tabular-nums">{formatCOP(Number(p.amount))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Ingresos
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportIngresos}>
                    <FileDown className="h-4 w-4" />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-5 py-3 font-medium">Fecha</th>
                          <th className="px-5 py-3 font-medium">Obra</th>
                          <th className="px-5 py-3 font-medium">Concepto</th>
                          <th className="px-5 py-3 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.flatMap((r) =>
                          (r.project.income_payments ?? []).map((i) => (
                            <tr key={i.id} className="border-b border-border/60 last:border-0">
                              <td className="px-5 py-2.5 text-muted-foreground">{formatDate(i.payment_date)}</td>
                              <td className="px-5 py-2.5">{r.project.name}</td>
                              <td className="px-5 py-2.5">{i.concept}</td>
                              <td className="px-5 py-2.5 text-right tabular-nums text-success">{formatCOP(Number(i.amount))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                    Retiros personales
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportRetiros}>
                    <FileDown className="h-4 w-4" />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-5 py-3 font-medium">Fecha</th>
                          <th className="px-5 py-3 font-medium">Obra</th>
                          <th className="px-5 py-3 font-medium">Motivo</th>
                          <th className="px-5 py-3 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.flatMap((r) =>
                          (r.project.personal_withdrawals ?? []).map((w) => (
                            <tr key={w.id} className="border-b border-border/60 last:border-0">
                              <td className="px-5 py-2.5 text-muted-foreground">{formatDate(w.withdrawal_date)}</td>
                              <td className="px-5 py-2.5">{r.project.name}</td>
                              <td className="px-5 py-2.5">{w.reason}</td>
                              <td className="px-5 py-2.5 text-right tabular-nums text-warning">{formatCOP(Number(w.amount))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}