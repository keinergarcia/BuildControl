import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  height?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  height = "h-2",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let colorClass = "bg-primary";
  if (percentage > 90) colorClass = "bg-destructive";
  else if (percentage > 75) colorClass = "bg-warning";
  else if (percentage > 50) colorClass = "bg-info";

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-secondary", height, className)}
    >
      <motion.div
        className={cn("h-full rounded-full", colorClass, barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
