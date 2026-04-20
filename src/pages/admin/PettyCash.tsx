import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { pettyCash, getUser } from "@/data/mock";
import { formatCOP, formatDateShort } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CheckCircle2, XCircle, Camera } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--pink))"];

export default function PettyCash() {
  const approved = pettyCash.filter((p) => p.status === "aprobado").reduce((s, p) => s + p.amount, 0);
  const pending = pettyCash.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);

  // by user
  const byUser = pettyCash.reduce<Record<string, number>>((acc, p) => {
    const name = getUser(p.userId)?.name ?? "—";
    acc[name] = (acc[name] ?? 0) + p.amount;
    return acc;
  }, {});
  const pieData = Object.entries(byUser).map(([name, value]) => ({ name, value }));

  return (
    <AppShell title="Caja Menor" subtitle="Aprobación de gastos menores">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Aprobado del mes" value={formatCOP(approved, { compact: true })} icon={CheckCircle2} accent="success" />
        <KpiCard label="Pendiente de aprobación" value={formatCOP(pending, { compact: true })} icon={Coins} accent="warning" />
        <KpiCard label="Registros del mes" value={pettyCash.length} icon={Coins} accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-border shadow-card divide-y divide-border">
          <div className="p-4">
            <h3 className="font-bold">Solicitudes</h3>
          </div>
          {pettyCash.map((p) => {
            const user = getUser(p.userId);
            return (
              <div key={p.id} className="p-4 flex gap-3 items-start">
                <Avatar name={user?.name ?? "?"} className="w-9 h-9 text-xs shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="font-bold tabular-nums">{formatCOP(p.amount)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateShort(p.date)}</p>
                </div>
                <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </div>
                {p.status === "pendiente" ? (
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" variant="success" className="h-7 px-2" onClick={() => toast.success("Gasto aprobado")}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => toast.error("Gasto rechazado")}>
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Badge className={p.status === "aprobado" ? "bg-success/15 text-success border-success/30 hover:bg-success/15" : "bg-destructive/15 text-destructive border-destructive/30"}>
                    {p.status}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-surface rounded-lg border border-border shadow-card p-5">
          <h3 className="font-bold mb-2">Distribución por persona</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
