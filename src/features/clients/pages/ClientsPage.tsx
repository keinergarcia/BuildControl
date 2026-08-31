import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PageTransition, FadeInUp, StaggerContainer } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/features/clients/api/useClients";
import { ClientForm } from "@/features/clients/components/ClientForm";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  FolderKanban,
  AlertTriangle,
  User,
} from "lucide-react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    open: boolean;
  }>({ id: "", name: "", open: false });

  const { data: clients = [], isLoading, isError, refetch } = useClients(search);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const { data: projectRows = [] } = useQuery({
    queryKey: ["clients-project-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("client_id");
      if (error) throw error;
      return data as Array<{ client_id: string | null }>;
    },
  });

  const projectCountByClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projectRows) {
      if (p.client_id) map.set(p.client_id, (map.get(p.client_id) ?? 0) + 1);
    }
    return map;
  }, [projectRows]);

  const activeClient = editing && selected.id ? clients.find((c) => c.id === selected.id) ?? null : null;

  const openCreate = () => {
    setSelected({ id: "", name: "", open: true });
    setEditing("create");
    setFormOpen(true);
  };

  const openEdit = (client: { id: string; name: string }) => {
    setSelected({ ...client, open: true });
    setEditing("edit");
    setFormOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        setSelected((s) => ({ ...s, open: false }));
        toast.success("Cliente eliminado");
      },
      onError: () => toast.error("No se pudo eliminar el cliente"),
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Personas y empresas para las que construyes
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa o email"
            className="pl-9"
          />
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-40 animate-pulse bg-secondary/60" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los clientes</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && clients.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {search ? "Sin resultados" : "Aún no tienes clientes"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Prueba con otros términos de búsqueda."
                  : "Registra los clientes de tus proyectos para asociarlos a cada obra."}
              </p>
            </div>
            {!search && (
              <Button variant="glow" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            )}
          </Card>
        )}

        {!isLoading && !isError && clients.length > 0 && (
          <StaggerContainer>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <FadeInUp key={client.id}>
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/40">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-sm font-bold text-white">
                            {initials(client.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{client.name}</h3>
                            {client.company && (
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {client.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <FolderKanban className="mr-1 h-3 w-3" />
                          {projectCountByClient.get(client.id) ?? 0} proyectos
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        {client.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </p>
                        )}
                        {client.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {client.phone}
                          </p>
                        )}
                        {client.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Desde {formatDate(client.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(client)}
                            aria-label="Editar cliente"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setSelected({ id: client.id, name: client.name, open: true })}
                            aria-label="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInUp>
              ))}
            </div>
          </StaggerContainer>
        )}

        <ClientForm
          open={formOpen}
          onOpenChange={setFormOpen}
          client={editing === "edit" ? activeClient : null}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input) => {
            if (editing === "edit" && selected.id) {
              updateMutation.mutate(
                { id: selected.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Cliente actualizado");
                  },
                  onError: () => toast.error("No se pudo actualizar el cliente"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Cliente creado");
                },
                onError: () => toast.error("No se pudo crear el cliente"),
              });
            }
          }}
          title={editing === "edit" ? "Editar cliente" : "Nuevo cliente"}
          description={
            editing === "edit"
              ? "Actualiza la información de este cliente."
              : "Registra un nuevo cliente para asociarlo a tus proyectos."
          }
        />

        <ConfirmDeleteDialog
          open={selected.open && !formOpen}
          title="Eliminar cliente"
          name={selected.name}
          prefix="¿Eliminar a "
          suffix="? Los proyectos asociados quedarán sin cliente (no se eliminarán)."
          isPending={deleteMutation.isPending}
          onCancel={() => setSelected((s) => ({ ...s, open: false }))}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PageTransition>
  );
}
