import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  contracts, sites, users, attendance, costEntries, monthlyActivityCounts, getUser, getSite,
} from "@/data/mock";
import { formatCOP, formatDate, timeProgress } from "@/lib/format";
import { FileText, Building2, HardHat, Bell, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const techsToday = users.filter((u) => u.role === "tecnico");
  const techsCheckedIn = attendance.length;

  // Chart data: cost by category (April)
  const categoryColors: Record<string, string> = {
    Nómina: "hsl(var(--secondary))",
    Pintura: "hsl(var(--primary))",
    Fachada: "hsl(var(--info))",
    Materiales: "hsl(var(--success))",
    Transportes: "hsl(var(--warning))",
    "Caja Menor": "hsl(var(--pink))",
    Otros: "hsl(var(--muted-foreground))",
  };
  const aggCosts = costEntries.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + c.value;
    return acc;
  }, {});
  const chartData = Object.entries(aggCosts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <AppShell title="Dashboard" subtitle="Panel ejecutivo · Abril 2026">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Contratos activos"
          value={contracts.filter((c) => c.status === "activo").length}
          icon={FileText}
          accent="primary"
          trailing={<Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">activo</Badge>}
        />
        <KpiCard
          label="Sedes activas"
          value={sites.filter((s) => s.status === "activa").length}
          icon={Building2}
          accent="info"
        />
        <KpiCard
          label="Técnicos en campo"
          value={`${techsCheckedIn}/${techsToday.length}`}
          icon={HardHat}
          accent="success"
          trailing={<span className="text-xs text-muted-foreground">marcaron entrada hoy</span>}
        />
        <KpiCard
          label="Alertas pendientes"
          value={<span className="text-destructive">7</span>}
          icon={Bell}
          accent="destructive"
        />
      </div>

      {/* Contract cards */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Contratos en ejecución
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {contracts.map((c) => {
          const progress = timeProgress(c.startDate, c.endDate);
          const progressColor = progress < 60 ? "bg-success" : progress < 85 ? "bg-warning" : "bg-destructive";
          const monthSpent = 48_200_000;
          const budgetRatio = Math.round((monthSpent / c.monthlyBudget) * 100);

          return (
            <div key={c.id} className="bg-surface rounded-lg border border-border shadow-card p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground truncate">{c.clientName}</h3>
                    <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Activo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.sitesCount} sedes · Inicio {formatDate(c.startDate)} · Vence {formatDate(c.endDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Tiempo transcurrido</span>
                    <span className="font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${progressColor} transition-all`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">
                      Costo abril <span className="text-foreground font-semibold">{formatCOP(monthSpent)}</span> / {formatCOP(c.monthlyBudget)}
                    </span>
                    <span className="font-semibold tabular-nums text-warning">{budgetRatio}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-info" style={{ width: `${budgetRatio}%` }} />
                  </div>
                </div>
              </div>

              {/* Activities chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> {monthlyActivityCounts.completadas} Completadas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-info/10 text-info text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-info" /> {monthlyActivityCounts.enProceso} En proceso
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/15 text-warning text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" /> {monthlyActivityCounts.pendientes} Pendientes
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-received/10 text-status-received text-xs font-semibold">
                  ✓ {monthlyActivityCounts.recibidas} Recibidas
                </span>
              </div>

              {/* Alerts */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                  <AlertTriangle className="w-3 h-3" /> 3 materiales sin devolución
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                  <AlertTriangle className="w-3 h-3" /> 1 contratista sin recibo
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Coordinador: {getUser(c.coordinatorId)?.name}</span>
                <Button variant="outline-brand" size="sm" onClick={() => navigate(`/contratos/${c.id}`)}>
                  Ver contrato <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row: chart + technicians */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-surface rounded-lg border border-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Costos por categoría</h3>
              <p className="text-xs text-muted-foreground">Abril 2026 · Total {formatCOP(48_200_000)}</p>
            </div>
          </div>
          <div className="mt-4 h-[320px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCOP(v, { compact: true })}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  width={92} axisLine={false} tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [formatCOP(v), "Costo"]}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={categoryColors[entry.name] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface rounded-lg border border-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Técnicos activos hoy</h3>
            <span className="text-xs text-muted-foreground">{techsCheckedIn}/{techsToday.length}</span>
          </div>
          <ul className="mt-4 space-y-3">
            {techsToday.map((t) => {
              const att = attendance.find((a) => a.technicianId === t.id);
              const site = att ? getSite(att.siteId) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <Avatar name={t.name} className="w-9 h-9 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {site?.name ?? "Sin sede asignada"}
                    </p>
                  </div>
                  <div className="text-right">
                    {att?.checkIn ? (
                      <>
                        <p className="text-xs font-mono font-semibold tabular-nums">{att.checkIn} AM</p>
                        <Badge className="mt-0.5 bg-success/15 text-success border-success/30 hover:bg-success/15 text-[10px] px-1.5 py-0">En sede</Badge>
                      </>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-border text-[10px] px-1.5 py-0">Sin marcar</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
