import { useEffect, useRef } from "react";
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
 * Incluye: Escape, focus trap (Tab/Shift+Tab), restauración del foco al abrir,
 * bloqueo del scroll del body y atributos de accesibilidad (role=dialog, aria-modal).
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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, isPending, onCancel]);

  if (!open) return null;
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
    >
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h3 id="confirm-delete-title" className="mt-3 text-lg font-semibold">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {prefix}
            <span className="font-medium text-foreground">{name}</span>
            {suffix}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button ref={cancelRef} variant="outline" onClick={onCancel} disabled={isPending}>
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
