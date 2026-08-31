import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDailyRecords,
  createDailyRecord,
  updateDailyRecord,
  deleteDailyRecord,
  type DailyRecordInput,
} from "./dailyRecords";

export const dailyRecordKeys = {
  all: ["daily-records"] as const,
  list: (projectId: string) => [...dailyRecordKeys.all, "list", projectId] as const,
};

export function useDailyRecords(projectId: string) {
  return useQuery({
    queryKey: dailyRecordKeys.list(projectId),
    queryFn: () => fetchDailyRecords(projectId),
  });
}

export function useCreateDailyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DailyRecordInput) => createDailyRecord(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dailyRecordKeys.list(variables.project_id) });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", variables.project_id] });
    },
  });
}

export function useUpdateDailyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DailyRecordInput }) =>
      updateDailyRecord(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dailyRecordKeys.list(variables.input.project_id) });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", variables.input.project_id] });
    },
  });
}

export function useDeleteDailyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDailyRecord(id),
    onMutate: () => queryClient.invalidateQueries({ queryKey: dailyRecordKeys.all }),
  });
}
