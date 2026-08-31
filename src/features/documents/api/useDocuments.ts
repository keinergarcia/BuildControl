import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments,
  createDocument,
  deleteDocumentRow,
  deleteDocumentFile,
  uploadDocumentFile,
  type DocumentInput,
  type DocumentWithProject,
} from "./documents";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (projectId?: string) => [...documentKeys.lists(), projectId ?? "all"] as const,
};

export function useDocuments(projectId?: string) {
  return useQuery<DocumentWithProject[]>({
    queryKey: documentKeys.list(projectId),
    queryFn: () => fetchDocuments(projectId),
  });
}

export function useUploadDocument(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      input,
    }: {
      file: File;
      input: Omit<DocumentInput, "file_url">;
    }) => {
      if (!userId) throw new Error("Sesión no válida");
      return uploadDocumentFile(file, userId).then((file_url) =>
        createDocument({ ...input, file_url, file_size: file.size })
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      if (variables.input.project_id) {
        queryClient.invalidateQueries({
          queryKey: ["projects", "detail", variables.input.project_id],
        });
      }
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const row = await deleteDocumentRow(id);
      try {
        await deleteDocumentFile(row.file_url);
      } catch {
        // el registro ya se eliminó; el objeto huérfano se puede limpiar aparte
      }
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}