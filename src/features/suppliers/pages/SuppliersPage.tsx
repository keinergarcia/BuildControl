import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, FadeInUp, StaggerContainer } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import type { Supplier } from "@/types";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/features/suppliers/api/useSuppliers";
import { SupplierForm } from "@/features/suppliers/components/SupplierForm";
import type { SupplierInput } from "@/features/suppliers/api/suppliers";
import {
  UserCog,
  Search,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Store,
} from "lucide-react";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: suppliers = [], isLoading, isError, refetch } = useSuppliers(search);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFormOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-muted-foreground">
              Ferreterías, materiales y servicios que abastecen tus obras
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email"
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
            <p className="font-semibold">No se pudieron cargar los proveedores</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && suppliers.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <UserCog className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {search ? "Sin resultados" : "Aún no tienes proveedores"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Prueba con otros términos de búsqueda."
                  : "Registra tus proveedores para asociarlos a los gastos de cada obra."}
              </p>
            </div>
            {!search && (
              <Button variant="glow" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo proveedor
              </Button>
            )}
          </Card>
        )}

        {!isLoading && !isError && suppliers.length > 0 && (
          <StaggerContainer>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <FadeInUp key={supplier.id}>
                  <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/40">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white">
                            {initials(supplier.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{supplier.name}</h3>
                            <Badge variant="secondary" className="mt-0.5">
                              <Store className="mr-1 h-3 w-3" />
                              Proveedor
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        {supplier.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </p>
                        )}
                        {supplier.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {supplier.phone}
                          </p>
                        )}
                        {supplier.address && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          Desde {formatDate(supplier.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(supplier)}
                            aria-label="Editar proveedor"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({ id: supplier.id, name: supplier.name })
                            }
                            aria-label="Eliminar proveedor"
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

        <SupplierForm
          open={formOpen}
          onOpenChange={setFormOpen}
          supplier={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSave={(input: SupplierInput) => {
            if (editing) {
              updateMutation.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    toast.success("Proveedor actualizado");
                  },
                  onError: () => toast.error("No se pudo actualizar el proveedor"),
                }
              );
            } else {
              createMutation.mutate(input, {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Proveedor creado");
                },
                onError: () => toast.error("No se pudo crear el proveedor"),
              });
            }
          }}
          title={editing ? "Editar proveedor" : "Nuevo proveedor"}
          description={
            editing
              ? "Actualiza la información de este proveedor."
              : "Registra un nuevo proveedor para asociarlo a tus gastos."
          }
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar proveedor"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar a "
          suffix="? Esta acción no se puede deshacer."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Proveedor eliminado");
              },
              onError: () => toast.error("No se pudo eliminar el proveedor"),
            });
          }}
        />
      </div>
    </PageTransition>
  );
}
