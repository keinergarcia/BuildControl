import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  /** Texto antes del nombre resaltado. */
  prefix?: string;
  name: string;
  /** Texto después del nombre resaltado. */
  suffix?: string;
  confirmText?: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal reutilizable de confirmación de borrado (usado por varias páginas).
 * Recibe un nombre a resaltar entre prefix y suffix para replicar el patrón visual.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  prefix = "¿Eliminar el ",
  name,
  suffix = "?",
  confirmText = "Eliminar",
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mt-3 text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {prefix}
            <span className="font-medium text-foreground">{name}</span>
            {suffix}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
              {isPending ? "Eliminando..." : confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
