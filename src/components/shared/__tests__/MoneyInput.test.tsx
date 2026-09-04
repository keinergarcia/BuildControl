import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MoneyInput } from "@/components/shared/MoneyInput";

describe("MoneyInput", () => {
  it("interpreta separadores de miles y entrega un número entero", () => {
    const onChange = vi.fn();
    render(<MoneyInput id="m" value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1,250,000" } });
    expect(onChange).toHaveBeenLastCalledWith(1250000);
  });

  it("interpreta formato colombiano con coma decimal y trunca centavos", () => {
    const onChange = vi.fn();
    render(<MoneyInput id="m" value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2.000.000,50" } });
    expect(onChange).toHaveBeenLastCalledWith(2000000);
  });

  it("entrega null cuando el campo está vacío", () => {
    const onChange = vi.fn();
    render(<MoneyInput id="m" value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "   " } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("refleja un valor numérico inicial", () => {
    render(<MoneyInput id="m" value={1250000} onChange={() => {}} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("1250000");
  });
});