import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancial } from "@/lib/query";
import {
  fetchWorkerPayments,
  createWorkerPayment,
  updateWorkerPayment,
  deleteWorkerPayment,
  type WorkerPaymentWithRelations,
  type WorkerPaymentInput,
} from "./workerPayments";

export const workerPaymentKeys = {
  all: ["worker-payments"] as const,
  lists: () => [...workerPaymentKeys.all, "list"] as const,
  list: (projectId?: string) => [...workerPaymentKeys.lists(), projectId ?? "all"] as const,
};

export function useWorkerPayments(projectId?: string) {
  return useQuery<WorkerPaymentWithRelations[]>({
    queryKey: workerPaymentKeys.list(projectId),
    queryFn: () => fetchWorkerPayments(projectId),
  });
}

export function useCreateWorkerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkerPaymentInput) => createWorkerPayment(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workerPaymentKeys.all });
      invalidateFinancial(queryClient, variables.project_id);
    },
  });
}

export function useUpdateWorkerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkerPaymentInput }) =>
      updateWorkerPayment(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workerPaymentKeys.all });
      invalidateFinancial(queryClient, variables.input.project_id);
    },
  });
}

export function useDeleteWorkerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkerPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerPaymentKeys.all });
      invalidateFinancial(queryClient);
    },
  });
}