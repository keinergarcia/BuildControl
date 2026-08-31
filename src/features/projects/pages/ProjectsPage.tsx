import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition, FadeInUp, StaggerContainer } from "@/components/shared/PageTransition";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects, useClients } from "@/features/projects/api/useProjects";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { useCreateProject } from "@/features/projects/api/useProjects";
import { STATUS_OPTIONS } from "@/features/projects/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Search,
  Plus,
  FolderKanban,
  AlertTriangle,
  FilterX,
} from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading, isError, refetch } = useProjects({});
  const { data: clients = [] } = useClients();
  const createMutation = useCreateProject();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q) ||
          (p.project_type ?? "").toLowerCase().includes(q) ||
          (p.client?.name ?? "").toLowerCase().includes(q)
      );
    }
    if (status !== "all") {
      result = result.filter((p) => p.status === status);
    }
    if (clientId !== "all") {
      result = result.filter((p) => p.client_id === clientId);
    }
    return result;
  }, [projects, search, status, clientId]);

  const hasFilters = search.trim() !== "" || status !== "all" || clientId !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setClientId("all");
  };

  const setFormOpenSafe = (open: boolean) => {
    if (createMutation.isPending) return;
    setFormOpen(open);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-muted-foreground">
              Gestiona tus obras de construcción
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={() => setFormOpenSafe(true)}>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, ubicación, tipo o cliente"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company ? `${c.name} — ${c.company}` : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-44 animate-pulse bg-secondary/60" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-semibold">No se pudieron cargar los proyectos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa tu conexión o cierra sesión e inicia de nuevo.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              {hasFilters ? (
                <FilterX className="h-7 w-7 text-muted-foreground" />
              ) : (
                <FolderKanban className="h-7 w-7 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {hasFilters ? "Sin resultados" : "No hay proyectos todavía"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hasFilters
                  ? "Ajusta los filtros de búsqueda para encontrar proyectos."
                  : "Crea tu primer proyecto de construcción para empezar a controlar presupuestos, gastos y mano de obra."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <Button variant="glow" onClick={() => setFormOpenSafe(true)}>
                <Plus className="h-4 w-4" />
                Nuevo proyecto
              </Button>
            )}
          </Card>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <StaggerContainer>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <FadeInUp key={project.id}>
                  <ProjectCard project={project} />
                </FadeInUp>
              ))}
            </div>
          </StaggerContainer>
        )}

        <ProjectForm
          open={formOpen}
          onOpenChange={setFormOpenSafe}
          project={null}
          clients={clients}
          userId={user?.id ?? null}
          isSubmitting={createMutation.isPending}
          onSave={(input) => {
            createMutation.mutate(
              { ...input, user_id: user?.id ?? "" },
              {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Proyecto creado");
                },
                onError: () =>
                  toast.error("No se pudo crear el proyecto", {
                    description: "Revisa los datos e inténtalo de nuevo.",
                  }),
              }
            );
          }}
          title="Nuevo proyecto"
          description="Crea un proyecto para organizar su presupuesto, gastos y avance."
        />
      </div>
    </PageTransition>
  );
}
