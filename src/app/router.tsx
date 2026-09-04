// oxlint-disable react/only-export-components
// -- Code-splitting con lazy(): el archivo exporta el objeto `router`
// (createBrowserRouter, no es un componente) y define los const lazy de cada
// página. React Fast Refresh no aplica a configuraciones de ruta con lazy de
// todos modos; separar cada página en su archivo añade fricción sin beneficio.
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Loader2 } from "lucide-react";

function RouteFallback() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const RouteErrorFallback = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
    <h2 className="text-lg font-semibold">Algo salió mal</h2>
    <p className="text-sm text-muted-foreground">
      Ocurrió un error inesperado al cargar esta vista.
    </p>
    <a
      href="/"
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Volver al inicio
    </a>
  </div>
);

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const LandingPage = lazy(() =>
  import("@/features/landing/pages/LandingPage").then((m) => ({ default: m.LandingPage }))
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
    path: "/landing",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LandingPage />
      </Suspense>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/reset-password",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <ResetPasswordPage />
      </Suspense>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteErrorFallback />,
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
  return (
    <ErrorBoundary fallback={<RouteErrorFallback />}>
      <Suspense fallback={<RouteFallback />}>{element}</Suspense>
    </ErrorBoundary>
  );
}