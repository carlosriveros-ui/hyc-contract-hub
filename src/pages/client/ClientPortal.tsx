import { AppShell } from "@/components/AppShell";
import { sites, activities } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

export default function ClientPortal() {
  const mySites = sites.slice(0, 8);
  const myActivities = activities.slice(0, 5);

  return (
    <AppShell title="Mis Sedes" subtitle="Conjunto Residencial Virrey Solís"
      actions={<Button variant="brand" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Solicitar actividad</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {mySites.map((s) => (
          <div key={s.id} className="bg-surface rounded-lg border border-border shadow-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">{s.name}</h4>
              </div>
              <Badge className={s.status === "activa" ? "bg-success/15 text-success border-success/30 hover:bg-success/15" : "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15"}>
                {s.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.address}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Estado de mis solicitudes
      </h2>
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <ul className="divide-y divide-border">
          {myActivities.map((a) => (
            <li key={a.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{a.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(a.scheduledDate)}</p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
