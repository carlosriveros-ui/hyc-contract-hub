import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { usersApi, attendanceApi, sitesApi } from "@/lib/dataService";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { User, AttendanceEntry, Site } from "@/types";

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState(today);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersApi.list(),
      attendanceApi.list({ date: dateFilter }),
      sitesApi.list(),
    ])
      .then(([u, a, s]) => { setUsers(u); setAttendance(a); setSites(s); })
      .catch(() => toast.error("Error al cargar asistencia"))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  const techs = users.filter((u) => u.role === "tecnico");
  const getSite = (id: string) => sites.find((s) => s.id === id);

  return (
    <AppShell title="Asistencia" subtitle="Control de marcaciones del día">
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
          <span className="text-sm text-muted-foreground">{techs.length} técnicos</span>
        </div>
        {loading ? (
          <ul className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </li>
            ))}
          </ul>
        ) : (
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
        )}
      </div>
    </AppShell>
  );
}
