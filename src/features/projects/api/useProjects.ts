import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchProjects,
  fetchProject,
  fetchClients,
  createProject,
  updateProject,
  deleteProject,
  type ProjectListFilters,
  type ProjectInput,
} from "./projects";
import type { ProjectWithDetails, Client } from "@/types";

const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectListFilters) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export function useProjects(
  filters: ProjectListFilters = {},
  options?: UseQueryOptions<ProjectWithDetails[]>
) {
  return useQuery<ProjectWithDetails[]>({
    queryKey: projectKeys.list(filters),
    queryFn: () => fetchProjects(filters),
    ...options,
  });
}

export function useProject(
  id: string | undefined,
  options?: UseQueryOptions<ProjectWithDetails>
) {
  return useQuery<ProjectWithDetails>({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: () => fetchProject(id as string),
    enabled: !!id,
    ...options,
  });
}

export function useClients(options?: UseQueryOptions<Client[]>) {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
    ...options,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) =>
      updateProject(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
