import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";

describe("StatusBadge", () => {
  it("muestra la etiqueta del estado", () => {
    render(<StatusBadge status="activo" label="Activo" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("aplica la clase de color correspondiente al estado", () => {
    const { container } = render(<StatusBadge status="activo" label="Activo" />);
    expect(container.firstElementChild?.className).toContain("text-success");
  });
});

describe("ProgressBar", () => {
  it("renderiza el rail contenedor", () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.firstElementChild?.className).toContain("rounded-full");
  });

  it("no se rompe con valores fuera de rango", () => {
    const { container } = render(<ProgressBar value={250} />);
    expect(container.firstElementChild).toBeTruthy();
  });
});
