import * as React from "react";
import { Input } from "@/components/ui/input";
import { parseCurrencyInput } from "@/lib/money";

interface MoneyInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  className?: string;
}

// Entrada monetaria unificada. Muestra un campo de texto que acepta separadores
// de miles ("1.250.000" o "1,250,000") y coma/punto decimal, y entrega SIEMPRE un
// número entero en pesos (COP no usa centavos). El valor vacío produce `null`.
export function MoneyInput({
  value,
  onChange,
  id,
  placeholder = "0",
  disabled,
  ariaInvalid,
  className,
}: MoneyInputProps) {
  const [text, setText] = React.useState(() => (value == null ? "" : String(value)));
  const lastExternal = React.useRef(value);

  // Sincroniza la caja de texto cuando el valor cambia desde afuera (p. ej. un
  // reset del formulario), sin pisar lo que el usuario está escribiendo.
  React.useEffect(() => {
    if (value === lastExternal.current) return;
    lastExternal.current = value;
    setText(value == null ? "" : String(value));
  }, [value]);

  const handleChange = (raw: string) => {
    setText(raw);
    const trimmed = raw.trim();
    const parsed = trimmed === "" ? null : parseCurrencyInput(raw);
    lastExternal.current = parsed;
    onChange(parsed);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={className}
    />
  );
}