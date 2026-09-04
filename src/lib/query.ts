import type { QueryClient } from "@tanstack/react-query";

/** Invalida la lista de proyectos y, si se da, el detalle de un proyecto concreto. */
export function invalidateProjects(queryClient: QueryClient, projectId?: string) {
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ["projects", "detail", projectId] });
  }
  queryClient.invalidateQueries({ queryKey: ["projects"] });
}

/** Invalida proyectos + dashboard tras mutaciones financieras. */
export function invalidateFinancial(queryClient: QueryClient, projectId?: string) {
  invalidateProjects(queryClient, projectId);
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}
