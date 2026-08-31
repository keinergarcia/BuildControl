import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBudgetCategories,
  saveProjectBudgets,
  type BudgetItemInput,
} from "@/features/budgets/api/budgets";

export function useBudgetCategories() {
  return useQuery({
    queryKey: ["budget-categories"],
    queryFn: fetchBudgetCategories,
  });
}

export function useSaveProjectBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      items,
    }: {
      projectId: string;
      userId: string;
      items: BudgetItemInput[];
    }) => saveProjectBudgets(projectId, userId, items),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "detail", variables.projectId],
      });
    },
  });
}
