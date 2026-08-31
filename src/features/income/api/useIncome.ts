import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancial } from "@/lib/query";
import {
  fetchIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  type IncomeWithRelations,
  type IncomeInput,
} from "./income";

export const incomeKeys = {
  all: ["income"] as const,
  lists: () => [...incomeKeys.all, "list"] as const,
  list: (projectId?: string) => [...incomeKeys.lists(), projectId ?? "all"] as const,
};

export function useIncome(projectId?: string) {
  return useQuery<IncomeWithRelations[]>({
    queryKey: incomeKeys.list(projectId),
    queryFn: () => fetchIncome(projectId),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncomeInput) => createIncome(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      invalidateFinancial(queryClient, variables.project_id);
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IncomeInput }) =>
      updateIncome(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      invalidateFinancial(queryClient, variables.input.project_id);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
      invalidateFinancial(queryClient);
    },
  });
}
