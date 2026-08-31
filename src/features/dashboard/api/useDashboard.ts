import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData, fetchRecentActivity } from "./dashboard";
import { buildFinancialSummary, buildAlerts, type FinancialAlert } from "@/engine/calculations";
import type { FinancialSummary, ProjectWithDetails } from "@/types";

export interface DashboardTotals {
  activeProjects: number;
  totalContractValue: number;
  totalReceived: number;
  totalPending: number;
  totalCosts: number;
  totalExpenses: number;
  totalLabor: number;
  totalWithdrawals: number;
  availableCash: number;
  totalProfit: number;
  expectedProfit: number;
  projectedProfit: number;
  weightedBudgetUsed: number;
  totalBudget: number;
  weightedProfitMargin: number;
  totalDailyCost: number;
  avgDaysElapsed: number;
  avgDaysRemaining: number;
}

const emptyTotals: DashboardTotals = {
  activeProjects: 0,
  totalContractValue: 0,
  totalReceived: 0,
  totalPending: 0,
  totalCosts: 0,
  totalExpenses: 0,
  totalLabor: 0,
  totalWithdrawals: 0,
  availableCash: 0,
  totalProfit: 0,
  expectedProfit: 0,
  projectedProfit: 0,
  weightedBudgetUsed: 0,
  totalBudget: 0,
  weightedProfitMargin: 0,
  totalDailyCost: 0,
  avgDaysElapsed: 0,
  avgDaysRemaining: 0,
};

export interface ProjectRow {
  project: ProjectWithDetails;
  summary: FinancialSummary;
}

export function useDashboard(options: { withActivity?: boolean } = {}) {
  const withActivity = options.withActivity ?? true;
  const projectsQuery = useQuery<ProjectWithDetails[]>({
    queryKey: ["dashboard", "projects"],
    queryFn: fetchDashboardData,
  });

  const projectIds = useMemo(
    () => (projectsQuery.data ?? []).map((p) => p.id),
    [projectsQuery.data]
  );

  const activityQuery = useQuery({
    queryKey: ["dashboard", "activity", projectIds],
    queryFn: () => fetchRecentActivity(projectIds),
    enabled: withActivity && projectIds.length > 0,
  });

  const projectRows = useMemo<ProjectRow[]>(() => {
    const projects = projectsQuery.data ?? [];
    return projects.map((p) => ({
      project: p,
      summary: buildFinancialSummary(
        p.contracts?.[0],
        p.expenses ?? [],
        p.worker_payments ?? [],
        p.income_payments ?? [],
        p.personal_withdrawals ?? [],
        p.budgets ?? [],
        p.start_date,
        p.planned_end_date,
        p.actual_end_date
      ),
    }));
  }, [projectsQuery.data]);

  const alerts = useMemo<FinancialAlert[]>(() => {
    return projectRows.flatMap(({ project, summary }) =>
      buildAlerts(
        { id: project.id, name: project.name, status: project.status },
        summary
      )
    );
  }, [projectRows]);

  const totals = useMemo<DashboardTotals>(() => {
    const projects = projectsQuery.data ?? [];
    if (projects.length === 0) return emptyTotals;

    const summaries = projectRows.map((r) => r.summary);

    const active = projects.filter((p) => p.status === "activo").length;
    const totalContractValue = summaries.reduce((s, x) => s + x.contractValue, 0);
    const totalReceived = summaries.reduce((s, x) => s + x.receivedAmount, 0);
    const totalCosts = summaries.reduce((s, x) => s + x.totalCosts, 0);
    const totalExpenses = summaries.reduce((s, x) => s + x.totalExpenses, 0);
    const totalLabor = summaries.reduce((s, x) => s + x.laborCost, 0);
    const totalWithdrawals = summaries.reduce((s, x) => s + x.totalWithdrawals, 0);
    const totalBudget = summaries.reduce((s, x) => s + x.remainingBudget + x.totalCosts, 0);
    const totalProfit = summaries.reduce((s, x) => s + x.profit, 0);
    const expectedProfit = summaries.reduce((s, x) => s + x.expectedProfit, 0);
    const projectedProfit = summaries.reduce((s, x) => s + x.projectedProfit, 0);
    const totalPending = summaries.reduce((s, x) => s + x.pendingAmount, 0);
    const totalDailyCost = projectRows
      .filter((r) => r.project.status !== "finalizado" && r.project.status !== "cancelado")
      .reduce((s, x) => s + x.summary.dailyCost, 0);

    const weightedBudgetUsed =
      totalBudget > 0 ? Math.round((totalCosts / totalBudget) * 10000) / 100 : 0;
    const weightedProfitMargin =
      totalContractValue > 0
        ? Math.round((totalProfit / totalContractValue) * 10000) / 100
        : 0;

    return {
      activeProjects: active,
      totalContractValue,
      totalReceived,
      totalPending,
      totalCosts,
      totalExpenses,
      totalLabor,
      totalWithdrawals,
      availableCash: totalReceived - totalCosts - totalWithdrawals,
      totalProfit,
      expectedProfit,
      projectedProfit,
      weightedBudgetUsed,
      totalBudget,
      weightedProfitMargin,
      totalDailyCost,
      avgDaysElapsed: Math.round(
        summaries.reduce((s, x) => s + x.daysElapsed, 0) / projects.length
      ),
      avgDaysRemaining: Math.round(
        summaries.reduce((s, x) => s + x.daysRemaining, 0) / projects.length
      ),
    };
  }, [projectRows, projectsQuery.data]);

  return {
    projects: projectsQuery.data ?? [],
    projectRows,
    alerts,
    activity: activityQuery.data ?? [],
    totals,
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    refetch: projectsQuery.refetch,
    refetchActivity: activityQuery.refetch,
  };
}
