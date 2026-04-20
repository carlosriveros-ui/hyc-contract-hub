import { AppShell } from "@/components/AppShell";
import { contractors } from "@/data/mock";
import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const statusCfg: Record<string, { label: string; className: string }> = {
  proceso: { label: "En proceso", className: "bg-info/15 text-info border-info/30" },
  completado: { label: "Completado", className: "bg-success/15 text-success border-success/30" },
  observacion: { label: "Con observación", className: "bg-destructive/15 text-destructive border-destructive/30" },
  esperando_recibo: { label: "Esperando recibo", className: "bg-warning/15 text-warning border-warning/30" },
};

export default function Contractors() {
  return (
    <AppShell title="Contratistas" subtitle="Gestión y avance de obras tercerizadas"
      actions={<Button variant="brand" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nuevo contratista</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractors.map((c) => {
          const cfg = statusCfg[c.status];
          const paidPct = Math.round((c.paid / c.totalValue) * 100);
          return (
            <div key={c.id} className="bg-surface rounded-lg border border-border shadow-card p-5">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <Badge variant="outline" className="mt-1">{c.workType}</Badge>
                </div>
                <Badge className={cfg.className + " hover:" + cfg.className}>{cfg.label}</Badge>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Avance general</span>
                  <span className="font-semibold tabular-nums">{c.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${c.progress}%` }} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Pagado</p>
                  <p className="font-semibold tabular-nums">{formatCOP(c.paid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor contrato</p>
                  <p className="font-semibold tabular-nums">{formatCOP(c.totalValue)}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
              </div>

              <p className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Próximo:</span> {c.nextMilestone}
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
