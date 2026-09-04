import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  type WorkerInput,
} from "./workers";
import type { Worker } from "@/types";

export const workerKeys = {
  all: ["workers"] as const,
  lists: () => [...workerKeys.all, "list"] as const,
  list: (search: string) => [...workerKeys.lists(), search] as const,
};

export function useWorkers(search = "") {
  return useQuery<Worker[]>({
    queryKey: workerKeys.list(search),
    queryFn: () => fetchWorkers(search),
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkerInput) => createWorker(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkerInput }) =>
      updateWorker(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      queryClient.invalidateQueries({ queryKey: ["worker-payments"] });
      queryClient.invalidateQueries({ queryKey: ["worker-assignment-count"] });
      queryClient.invalidateQueries({ queryKey: ["worker-assignments"] });
    },
  });
}
