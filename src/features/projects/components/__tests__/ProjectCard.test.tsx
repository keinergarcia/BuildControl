import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import type { ProjectWithDetails } from "@/types";

vi.mock("@/features/projects/api/useProjectCover", () => ({
  useProjectCover: () => null,
}));

const baseProject: ProjectWithDetails = {
  id: "p1",
  user_id: "u1",
  client_id: "c1",
  name: "Casa Campestre",
  description: null,
  location: "Bogotá",
  project_type: "Residencial",
  status: "activo",
  start_date: "2026-01-01",
  planned_end_date: null,
  actual_end_date: null,
  cover_image_url: null,
  notes: null,
  created_at: "",
  updated_at: "",
  client: { id: "c1", user_id: "u1", name: "Cliente Uno", company: null, phone: null, email: null, document_type: null, document_number: null, address: null, notes: null, created_at: "", updated_at: "" },
};

describe("ProjectCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el nombre y ubicación del proyecto", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={baseProject} />
      </MemoryRouter>
    );
    expect(screen.getByText("Casa Campestre")).toBeInTheDocument();
    expect(screen.getByText("Bogotá")).toBeInTheDocument();
  });

  it("muestra el estado Activo", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={baseProject} />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Activo").length).toBeGreaterThan(0);
  });

  it("enlaza a la página de detalle del proyecto", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={baseProject} />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/projects/p1");
  });
});
