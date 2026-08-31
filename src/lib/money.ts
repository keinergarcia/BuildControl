const COP_DIVISOR = 1;
const CURRENCY_CODE = "COP";
const CURRENCY_LOCALE = "es-CO";

export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: COP_DIVISOR,
    maximumFractionDigits: COP_DIVISOR,
  }).format(rounded);
}

export function formatCOPShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return formatCOP(amount);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function safeAdd(...values: number[]): number {
  return values.reduce((acc, val) => acc + Math.round(val), 0);
}

export function safePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}
