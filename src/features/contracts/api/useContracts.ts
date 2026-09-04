import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancial } from "@/lib/query";
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
  type ContractWithProject,
  type ContractInput,
} from "./contracts";

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (projectId?: string) => [...contractKeys.lists(), projectId ?? "all"] as const,
};

export function useContracts(projectId?: string) {
  return useQuery<ContractWithProject[]>({
    queryKey: contractKeys.list(projectId),
    queryFn: () => fetchContracts(projectId),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractInput) => createContract(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      invalidateFinancial(queryClient, variables.project_id);
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContractInput }) =>
      updateContract(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      invalidateFinancial(queryClient, variables.input.project_id);
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      invalidateFinancial(queryClient);
    },
  });
}
