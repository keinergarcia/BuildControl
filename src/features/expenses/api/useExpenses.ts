import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancial } from "@/lib/query";
import { supabase } from "@/lib/supabase";
import { deleteDocumentFile } from "@/features/documents/api/documents";
import { fetchBudgetCategories } from "@/features/budgets/api/budgets";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseWithRelations,
  type ExpenseInput,
  type ExpenseCategoryInput,
} from "./expenses";
import type { BudgetCategory, ExpenseCategory } from "@/types";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (projectId?: string) => [...expenseKeys.lists(), projectId ?? "all"] as const,
};

export function useExpenses(projectId?: string) {
  return useQuery<ExpenseWithRelations[]>({
    queryKey: expenseKeys.list(projectId),
    queryFn: () => fetchExpenses(projectId),
  });
}

export function useBudgetCategories() {
  return useQuery<BudgetCategory[]>({
    queryKey: ["budget-categories"],
    queryFn: fetchBudgetCategories,
  });
}

export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ["expense-categories"],
    queryFn: fetchExpenseCategories,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      invalidateFinancial(queryClient, variables.project_id);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      updateExpense(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      invalidateFinancial(queryClient, variables.input.project_id);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: docs, error: docErr } = await supabase
        .from("documents")
        .select("id, file_url")
        .eq("related_entity", "expense")
        .eq("related_entity_id", id);
      if (docErr) throw docErr;
      await deleteExpense(id);
      for (const doc of docs ?? []) {
        await supabase.from("documents").delete().eq("id", doc.id);
        try {
          await deleteDocumentFile(doc.file_url);
        } catch {
          // el registro de documento ya se eliminó; el objeto de storage huérfano se limpia aparte
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      invalidateFinancial(queryClient);
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseCategoryInput) => createExpenseCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseCategoryInput }) =>
      updateExpenseCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}
