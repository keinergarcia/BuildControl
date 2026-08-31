import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAssignment,
  deleteAssignment,
  fetchWorkerAssignments,
  type AssignmentInput,
} from "./assignments";
import { workerKeys } from "./useWorkers";

export const assignmentKeys = {
  all: ["worker-assignments"] as const,
  list: () => [...assignmentKeys.all, "list"] as const,
};

export function useWorkerAssignments() {
  return useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: fetchWorkerAssignments,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentInput) => createAssignment(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["worker-assignment-count"] });
      queryClient.invalidateQueries({ queryKey: workerKeys.all });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["worker-assignment-count"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}