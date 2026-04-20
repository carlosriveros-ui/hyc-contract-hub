import { cn } from "@/lib/utils";
import type { ActivityStatus } from "@/types";

const statusConfig: Record<ActivityStatus, { label: string; className: string }> = {
  solicitada:   { label: "Solicitada",     className: "bg-status-requested/15 text-status-requested border-status-requested/30" },
  programada:   { label: "Programada",     className: "bg-status-scheduled/15 text-status-scheduled border-status-scheduled/30" },
  ejecucion:    { label: "En ejecución",   className: "bg-status-progress/15 text-status-progress border-status-progress/30" },
  completada:   { label: "Completada",     className: "bg-status-done/15 text-status-done border-status-done/30" },
  recibida:     { label: "Recibida",       className: "bg-status-received/15 text-status-received border-status-received/30" },
  observacion:  { label: "Con observación", className: "bg-status-issue/15 text-status-issue border-status-issue/30" },
};

export function StatusBadge({ status, className }: { status: ActivityStatus; className?: string }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium",
      cfg.className,
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
