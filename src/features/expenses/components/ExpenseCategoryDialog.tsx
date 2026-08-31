import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from "@/features/expenses/api/useExpenses";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6b7280",
];

export function ExpenseCategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: categories = [], isLoading, isError } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Escribe un nombre");
      return;
    }
    setError("");
    createMutation.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          toast.success("Categoría creada");
        },
        onError: () => toast.error("No se pudo crear la categoría"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorías de gasto</DialogTitle>
          <DialogDescription>
            Crea categorías propias además de los rubros estándar del presupuesto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2 rounded-xl border border-border/60 p-4">
            <Label htmlFor="new-cat-name">Nueva categoría</Label>
            <div className="space-y-3">
              <Input
                id="new-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Ej. Acabados, Pintura, Alquiler"
              />
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      color === c ? "ring-2 ring-foreground scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                variant="glow"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Agregar categoría
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> No se pudieron cargar las categorías.
            </p>
          )}

          {!isLoading && !isError && categories.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no has creado categorías propias.
            </p>
          )}

          <div className="space-y-1.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: c.color ?? "#6b7280" }}
                  />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteMutation.mutate(c.id, {
                      onSuccess: () => toast.success("Categoría eliminada"),
                      onError: () =>
                        toast.error("No se pudo eliminar la categoría", {
                          description:
                            "Está en uso por algún gasto o es un rubro del presupuesto.",
                        }),
                    });
                  }}
                  aria-label={`Eliminar categoría ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
