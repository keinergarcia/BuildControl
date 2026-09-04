import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronDown, Check, Lock } from "lucide-react";
import { PROJECT_STATUS_LABELS } from "@/types";
import type { ProjectStatus } from "@/types/enums";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useUpdateProject } from "@/features/projects/api/useProjects";
import { STATUS_TRANSITIONS } from "@/features/projects/constants";

interface ProjectStatusSelectProps {
  projectId: string;
  status: ProjectStatus;
}

interface Anchor {
  left: number;
  top: number;
}

const ALL_STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];
const MENU_WIDTH = 176;
const MENU_HEIGHT = ALL_STATUSES.length * 32 + 8;
const GAP = 6;

export function ProjectStatusSelect({ projectId, status }: ProjectStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const updateMutation = useUpdateProject();

  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setAnchor(null);
      return;
    }
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_HEIGHT && rect.top > MENU_HEIGHT;
    const openLeft = rect.right > window.innerWidth - MENU_WIDTH;
    setAnchor({
      left: openLeft ? Math.max(8, window.innerWidth - rect.right - MENU_WIDTH) : rect.left,
      top: openUp ? rect.top - MENU_HEIGHT - GAP : rect.bottom + GAP,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const trigger = triggerRef.current;
      if (
        trigger &&
        !trigger.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-status-menu]")
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(next: ProjectStatus) {
    setOpen(false);
    if (next === status) return;
    if (!STATUS_TRANSITIONS[status]?.includes(next)) {
      toast.error("Transición de estado no permitida");
      return;
    }
    updateMutation.mutate(
      { id: projectId, input: { status: next } },
      {
        onSuccess: () => toast.success(`Estado cambiado a ${PROJECT_STATUS_LABELS[next]}`),
        onError: () => toast.error("No se pudo cambiar el estado del proyecto"),
      }
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Cambiar estado del proyecto"
      >
        <StatusBadge status={status} label={PROJECT_STATUS_LABELS[status]} />
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && anchor && (
        <div
          data-status-menu
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed z-50 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
          style={{ left: anchor.left, top: anchor.top }}
        >
          {ALL_STATUSES.map((s) => {
            const allowed = STATUS_TRANSITIONS[status]?.includes(s) ?? false;
            const isCurrent = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(s);
                }}
                disabled={updateMutation.isPending || (!allowed && !isCurrent)}
                title={
                  !allowed && !isCurrent
                    ? "Transición no permitida desde el estado actual"
                    : undefined
                }
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-popover-foreground"
              >
                <StatusBadge status={s} label={PROJECT_STATUS_LABELS[s]} />
                {isCurrent ? (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                ) : !allowed ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}