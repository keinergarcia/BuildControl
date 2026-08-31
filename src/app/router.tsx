import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";

function RouteFallback() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("@/features/projects/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() =>
  import("@/features/projects/pages/ProjectDetailPage")
);
const ClientsPage = lazy(() => import("@/features/clients/pages/ClientsPage"));
const ContractsPage = lazy(() => import("@/features/contracts/pages/ContractsPage"));
const BudgetsPage = lazy(() => import("@/features/budgets/pages/BudgetsPage"));
const ExpensesPage = lazy(() => import("@/features/expenses/pages/ExpensesPage"));
const IncomePage = lazy(() => import("@/features/income/pages/IncomePage"));
const WithdrawalsPage = lazy(() =>
  import("@/features/withdrawals/pages/WithdrawalsPage")
);
const SuppliersPage = lazy(() => import("@/features/suppliers/pages/SuppliersPage"));
const WorkersPage = lazy(() => import("@/features/workers/pages/WorkersPage"));
const WorkerPaymentsPage = lazy(() =>
  import("@/features/worker-payments/pages/WorkerPaymentsPage")
);
const DocumentsPage = lazy(() => import("@/features/documents/pages/DocumentsPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const AssistantPage = lazy(() => import("@/features/assistant/pages/AssistantPage"));
const ActivityPage = lazy(() => import("@/features/activity/pages/ActivityPage"));
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Page element={<DashboardPage />} /> },
      { path: "projects", element: <Page element={<ProjectsPage />} /> },
      { path: "projects/:id", element: <Page element={<ProjectDetailPage />} /> },
      { path: "clients", element: <Page element={<ClientsPage />} /> },
      { path: "contracts", element: <Page element={<ContractsPage />} /> },
      { path: "budgets", element: <Page element={<BudgetsPage />} /> },
      { path: "expenses", element: <Page element={<ExpensesPage />} /> },
      { path: "workers", element: <Page element={<WorkersPage />} /> },
      { path: "worker-payments", element: <Page element={<WorkerPaymentsPage />} /> },
      { path: "income", element: <Page element={<IncomePage />} /> },
      { path: "withdrawals", element: <Page element={<WithdrawalsPage />} /> },
      { path: "suppliers", element: <Page element={<SuppliersPage />} /> },
      { path: "documents", element: <Page element={<DocumentsPage />} /> },
      { path: "reports", element: <Page element={<ReportsPage />} /> },
      { path: "assistant", element: <Page element={<AssistantPage />} /> },
      { path: "historial", element: <Page element={<ActivityPage />} /> },
      { path: "settings", element: <Page element={<SettingsPage />} /> },
    ],
  },
]);

function Page({ element }: { element: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}