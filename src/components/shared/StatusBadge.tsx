import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        planificacion: "bg-info/15 text-info",
        activo: "bg-success/15 text-success",
        pausado: "bg-warning/15 text-warning",
        finalizado: "bg-muted text-muted-foreground",
        cancelado: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      status: "activo",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusVariants({ status }), className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
