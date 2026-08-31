import { jsPDF } from "jspdf";
import { formatCOP, formatCOPShort } from "@/lib/money";
import { formatDate } from "@/utils/date";
import type { ProjectReportRow } from "@/features/reports/api/reports";

interface PdfColumn<T> {
  title: string;
  align: "left" | "right";
  width: number;
  value: (row: T) => string;
}

const COLOR_BG = "#10182a";
const COLOR_ROW_ALT = "#f8fafc";
const COLOR_HEADER_BG = "#eceff4";
const COLOR_TEXT = "#141a26";
const COLOR_MUTED = "#526073";

function marginFormat(v: number): string {
  return `${v.toFixed(1)}%`;
}

/**
 * Dibuja una tabla genérica en el PDF manejando saltos de página.
 * Usa layout en retrato para acomodar todas las columnas y el detalle.
 */
function drawTable<T>(
  doc: jsPDF,
  opts: {
    columns: PdfColumn<T>[];
    rows: T[];
    margin: number;
    rowHeight: number;
    y?: number;
  }
): { y: number } {
  const { columns, rows, margin } = opts;
  const rowHeight = opts.rowHeight;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const tableWidth = pageWidth - margin * 2;
  const headHeight = 20;
  // Escalar columnas si sobrepasan el ancho útil.
  const scale = tableWidth / columns.reduce((sum, c) => sum + c.width, 0);
  const widths = columns.map((c) => c.width * scale);

  const colStart: number[] = [];
  let x = margin;
  for (const w of widths) {
    colStart.push(x);
    x += w;
  }

  let y = opts.y ?? margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Cabecera de columna (paginar si no hay espacio al menos 2 filas + cabecera).
  const drawHead = () => {
    ensureSpace(headHeight + rowHeight * 2);
    doc.setFillColor(...hexToRgb(COLOR_HEADER_BG));
    doc.rect(margin, y, tableWidth, headHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb("#283040"));
    columns.forEach((c, i) => {
      doc.text(c.title, colStart[i] + 6, y + 14, { align: "left" });
    });
    y += headHeight;
  };

  drawHead();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  rows.forEach((row, ri) => {
    // Si no cabe ni una fila más, cortar página y repetir cabecera.
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHead();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
    }

    if (ri % 2 === 1) {
      doc.setFillColor(...hexToRgb(COLOR_ROW_ALT));
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    doc.setTextColor(...hexToRgb(COLOR_TEXT));
    columns.forEach((c, i) => {
      const txt = c.value(row);
      const maxChars = Math.max(1, Math.floor((widths[i] - 14) / 4.2));
      const display = txt.length > maxChars ? txt.slice(0, maxChars - 1) + "…" : txt;
      if (c.align === "right") {
        doc.text(display, colStart[i] + widths[i] - 6, y + 14, { align: "right" });
      } else {
        doc.text(display, colStart[i] + 6, y + 14, { align: "left" });
      }
    });
    y += rowHeight;
  });

  y += 12;
  return { y };
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  const margin = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb("#16243f"));
  doc.text(text, margin, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  return y + 14;
}

/** Genera un PDF completo (resumen + gastos + pagos + ingresos + retiros) y descarga. */
export function exportReportPdf(
  rows: ProjectReportRow[],
  opts: { workerName?: (id: string) => string } = {},
  filename = "reporte-financiero.pdf"
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const workerName = opts.workerName ?? (() => "—");
  let y = 70;

  // ---------- Encabezado ----------
  doc.setFillColor(...hexToRgb(COLOR_BG));
  doc.rect(0, 0, pageWidth, 54, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BUILDControl - Reporte financiero", margin, 34);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const today = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.text(`Generado: ${today}`, pageWidth - margin, 34, { align: "right" });

  // ---------- 0. Bloques de KPIs por obra ----------
  for (const r of rows) {
    const s = r.summary;
    const kpis: Array<[string, string]> = [
      ["Contratado", formatCOPShort(s.contractValue)],
      ["Recibido", formatCOPShort(s.receivedAmount)],
      ["Pendiente", formatCOPShort(s.pendingAmount)],
      ["Costos", formatCOPShort(s.totalCosts)],
      ["Utilidad", formatCOPShort(s.profit)],
    ];
    const blockH = 62;
    if (y + blockH > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb("#16243f"));
    doc.text("Obra", margin, y);
    doc.text(r.project.name, margin + 30, y);
    y += 18;
    const kpiWidth = (pageWidth - margin * 2) / kpis.length;
    kpis.forEach(([label, val], i) => {
      const boxX = margin + i * kpiWidth;
      doc.setDrawColor(...hexToRgb("#e2e8f0"));
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(boxX + 2, y, kpiWidth - 4, 34, 3, 3, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb(COLOR_MUTED));
      doc.text(label, boxX + 8, y + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...hexToRgb("#141a26"));
      doc.text(val, boxX + 8, y + 27);
    });
    y += blockH + 6;
  }

  // ---------- 1. Resumen financiero por obra ----------
  doc.setTextColor(...hexToRgb("#16243f"));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Resumen financiero por obra", margin, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRgb(COLOR_MUTED));
  doc.text("Contrato, flujo de dinero, costos y rentabilidad", margin, y + 12);
  y += 24;

  const resumenResult = drawTable(
    doc,
    {
      columns: [
        { title: "Obra", align: "left", width: 120, value: (r) => r.project.name },
        { title: "Contrato", align: "right", width: 82, value: (r) => formatCOP(r.summary.contractValue) },
        { title: "Recibido", align: "right", width: 82, value: (r) => formatCOP(r.summary.receivedAmount) },
        { title: "Pendiente", align: "right", width: 82, value: (r) => formatCOP(r.summary.pendingAmount) },
        { title: "Gastos", align: "right", width: 82, value: (r) => formatCOP(r.summary.totalExpenses) },
        { title: "Mano de obra", align: "right", width: 90, value: (r) => formatCOP(r.summary.laborCost) },
        { title: "Retiros", align: "right", width: 78, value: (r) => formatCOP(r.summary.totalWithdrawals) },
        { title: "Caja", align: "right", width: 82, value: (r) => formatCOP(r.summary.availableCash) },
        { title: "Utilidad", align: "right", width: 86, value: (r) => formatCOP(r.summary.profit) },
        { title: "Margen", align: "right", width: 60, value: (r) => marginFormat(r.summary.profitMargin) },
      ],
      rows,
      margin,
      rowHeight: 20,
    }
  );
  y = resumenResult.y;
  if (y > pageHeight - 40) {
    doc.addPage();
    y = margin;
  }

  // ---------- 2. Gastos ----------
  const gastosRows = rows.flatMap((r) =>
    (r.project.expenses ?? []).map((e) => ({ name: r.project.name, e }))
  );
  if (gastosRows.length > 0) {
    y = sectionTitle(doc, "2. Gastos", y);
    const r = drawTable(
      doc,
      {
        columns: [
          { title: "Fecha", align: "left", width: 90, value: (x) => formatDate(x.e.expense_date) },
          { title: "Obra", align: "left", width: 130, value: (x) => x.name },
          { title: "Descripción", align: "left", width: 250, value: (x) => x.e.description },
          { title: "Valor", align: "right", width: 100, value: (x) => formatCOP(Number(x.e.amount)) },
        ],
        rows: gastosRows,
        margin,
        rowHeight: 18,
      }
    );
    y = r.y;
  }

  // ---------- 3. Pagos a trabajadores ----------
  const pagosRows = rows.flatMap((r) =>
    (r.project.worker_payments ?? []).map((p) => ({ name: r.project.name, p }))
  );
  if (pagosRows.length > 0) {
    y = sectionTitle(doc, "3. Pagos a trabajadores", y);
    const r = drawTable(
      doc,
      {
        columns: [
          { title: "Fecha", align: "left", width: 90, value: (x) => formatDate(x.p.payment_date) },
          { title: "Obra", align: "left", width: 120, value: (x) => x.name },
          { title: "Trabajador", align: "left", width: 130, value: (x) => workerName(x.p.worker_id) },
          { title: "Concepto", align: "left", width: 130, value: (x) => x.p.concept ?? "" },
          { title: "Valor", align: "right", width: 100, value: (x) => formatCOP(Number(x.p.amount)) },
        ],
        rows: pagosRows,
        margin,
        rowHeight: 18,
      }
    );
    y = r.y;
  }

  // ---------- 4. Ingresos ----------
  const ingresosRows = rows.flatMap((r) =>
    (r.project.income_payments ?? []).map((i) => ({ name: r.project.name, i }))
  );
  if (ingresosRows.length > 0) {
    y = sectionTitle(doc, "4. Ingresos", y);
    const r = drawTable(
      doc,
      {
        columns: [
          { title: "Fecha", align: "left", width: 90, value: (x) => formatDate(x.i.payment_date) },
          { title: "Obra", align: "left", width: 180, value: (x) => x.name },
          { title: "Concepto", align: "left", width: 200, value: (x) => x.i.concept ?? "" },
          { title: "Valor", align: "right", width: 100, value: (x) => formatCOP(Number(x.i.amount)) },
        ],
        rows: ingresosRows,
        margin,
        rowHeight: 18,
      }
    );
    y = r.y;
  }

  // ---------- 5. Retiros personales ----------
  const retirosRows = rows.flatMap((r) =>
    (r.project.personal_withdrawals ?? []).map((w) => ({ name: r.project.name, w }))
  );
  if (retirosRows.length > 0) {
    y = sectionTitle(doc, "5. Retiros personales", y);
    drawTable(
      doc,
      {
        columns: [
          { title: "Fecha", align: "left", width: 100, value: (x) => formatDate(x.w.withdrawal_date) },
          { title: "Obra", align: "left", width: 190, value: (x) => x.name },
          { title: "Motivo", align: "left", width: 180, value: (x) => x.w.reason ?? "" },
          { title: "Valor", align: "right", width: 100, value: (x) => formatCOP(Number(x.w.amount)) },
        ],
        rows: retirosRows,
        margin,
        rowHeight: 18,
      }
    );
  }

  doc.save(filename);
}
