import { AppShell } from "@/components/AppShell";
import { users, attendance, getSite } from "@/data/mock";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Attendance() {
  const techs = users.filter((u) => u.role === "tecnico");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell title="Asistencia" subtitle="Control de marcaciones del día">
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <Input type="date" defaultValue={today} className="w-auto" />
          <span className="text-sm text-muted-foreground">{techs.length} técnicos</span>
        </div>
        <ul className="divide-y divide-border">
          {techs.map((t) => {
            const att = attendance.find((a) => a.technicianId === t.id);
            const site = att ? getSite(att.siteId) : undefined;
            return (
              <li key={t.id} className="p-4 flex items-center gap-4">
                <Avatar name={t.name} className="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{site?.name ?? "Sin sede asignada"}</p>
                </div>
                <div className="text-right">
                  {att?.checkIn ? (
                    <>
                      <p className="text-sm font-mono tabular-nums">{att.checkIn}</p>
                      <Badge className="mt-0.5 bg-success/15 text-success border-success/30 hover:bg-success/15">En sede</Badge>
                    </>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-border">Sin marcar</Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
