import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info" | "destructive" | "secondary";
  trailing?: ReactNode;
  className?: string;
}

const accentClasses: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-secondary/10 text-secondary",
};

export function KpiCard({ label, value, icon: Icon, accent = "secondary", trailing, className }: KpiCardProps) {
  return (
    <div className={cn(
      "bg-surface rounded-lg border border-border p-5 shadow-card flex items-start justify-between gap-4 animate-fade-in",
      className,
    )}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{value}</p>
        {trailing && <div className="mt-2">{trailing}</div>}
      </div>
      {Icon && (
        <div className={cn("p-2.5 rounded-lg shrink-0", accentClasses[accent])}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
