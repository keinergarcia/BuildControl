import type { QueryClient } from "@tanstack/react-query";

export function invalidateFinancial(queryClient: QueryClient, projectId?: string) {
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ["projects", "detail", projectId] });
  }
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}
