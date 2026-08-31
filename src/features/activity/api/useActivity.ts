import { useQuery } from "@tanstack/react-query";
import { fetchActivity, type ActivityItem } from "./activity";

export const activityKeys = {
  all: ["activity", "historial"] as const,
  list: (projectIds: string[]) => [...activityKeys.all, projectIds] as const,
};

export function useActivity(projectIds: string[]) {
  return useQuery<ActivityItem[]>({
    queryKey: activityKeys.list(projectIds),
    queryFn: () => fetchActivity(projectIds),
    enabled: projectIds.length > 0,
  });
}