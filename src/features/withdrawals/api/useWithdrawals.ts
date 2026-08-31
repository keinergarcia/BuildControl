import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancial } from "@/lib/query";
import {
  fetchWithdrawals,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
  type WithdrawalWithProject,
  type WithdrawalInput,
} from "./withdrawals";

export const withdrawalKeys = {
  all: ["withdrawals"] as const,
  lists: () => [...withdrawalKeys.all, "list"] as const,
  list: (projectId?: string) => [...withdrawalKeys.lists(), projectId ?? "all"] as const,
};

export function useWithdrawals(projectId?: string) {
  return useQuery<WithdrawalWithProject[]>({
    queryKey: withdrawalKeys.list(projectId),
    queryFn: () => fetchWithdrawals(projectId),
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WithdrawalInput) => createWithdrawal(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      invalidateFinancial(queryClient, variables.project_id);
    },
  });
}

export function useUpdateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WithdrawalInput }) =>
      updateWithdrawal(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      invalidateFinancial(queryClient, variables.input.project_id);
    },
  });
}

export function useDeleteWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      invalidateFinancial(queryClient);
    },
  });
}
