const CURRENCY_CODE = "COP";
const CURRENCY_LOCALE = "es-CO";

// Muestra pesos enteros exactos (COP no usa centavos). El valor se
// formatea sin decimales para que coincida con lo que escribe el usuario.
export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
}

// Interpreta una cadena escrita por el usuario como un monto en pesos.
// Acepta tanto el formato colombiano (puntos como miles, coma decimal:
// "1.250.000", "1250,50", "2.000.000,50") como el formato US (comas como
// miles, punto decimal: "1,250,000", "1250.50"). Nunca inventa dinero: la
// parte fraccionaria de un peso se TRUNCA (COP no usa centavos), de modo
// que jamás se guarda más de lo que el usuario escribió.
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(cleaned)) return 0;

  const isNegative = cleaned.startsWith("-");
  const num = cleaned.replace(/-/g, "");

  if (!/[.,]/.test(num)) {
    return isNegative ? -parseInt(num, 10) : parseInt(num, 10);
  }

  let decSep = "";
  // Si hay punto y coma a la vez, el último es el decimal.
  if (num.includes(".") && num.includes(",")) {
    decSep = num.lastIndexOf(",") > num.lastIndexOf(".") ? "," : ".";
  } else {
    // Un único separador: si aparece una sola vez y le siguen 1-2 dígitos,
    // es decimal; si aparece varias veces o con 3+ dígitos, es miles.
    const sep = num.includes(".") ? "." : ",";
    const count = (num.match(/[.,]/g) ?? []).length;
    const lastIdx = num.lastIndexOf(sep);
    const lenAfter = num.length - lastIdx - 1;
    decSep = count === 1 && (lenAfter === 1 || lenAfter === 2) ? sep : "";
  }

  const decIndex = decSep ? num.lastIndexOf(decSep) : -1;
  const intPart = decSep ? num.slice(0, decIndex) : num;
  const rawDec = decSep ? num.slice(decIndex + 1) : "";

  const intValue = parseInt(intPart.replace(/[.,]/g, "") || "0", 10);
  // COP no tiene centavos: se toma solo el primero/todos los dígitos decimales
  // como fracción y se TRUNCA (nunca se redondea hacia arriba).
  const decValue = rawDec ? parseInt(rawDec.slice(0, 2).padEnd(2, "0"), 10) / 100 : 0;
  const total = intValue + Math.floor(decValue * 100) / 100;
  const pesos = Math.floor(total);
  return isNegative ? -pesos : pesos;
}

export function safeAdd(...values: number[]): number {
  const sum = values.reduce((acc, val) => acc + Number(val), 0);
  return Math.round(sum);
}

export function safePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

// Muestra un porcentaje de utilización evitando números astronómicos
// cuando el gasto supera ampliamente el presupuesto definido.
export function formatPercentageDisplay(pct: number): string {
  if (pct > 999) return ">999%";
  return `${pct}%`;
}
