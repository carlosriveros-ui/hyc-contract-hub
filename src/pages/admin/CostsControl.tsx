import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useState, useEffect, useMemo } from "react";
import { costsApi } from "@/lib/dataService";
import { formatCOP, formatDateShort } from "@/lib/format";
import { Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";
import type { CostEntry } from "@/types";

export default function CostsControl() {
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    costsApi.list()
      .then(setCostEntries)
      .catch(() => toast.error("Error al cargar costos"))
      .finally(() => setLoading(false));
  }, []);

  const total = costEntries.reduce((s, c) => s + c.value, 0);
  const budget = 55_000_000;
  const pct = Math.round((total / budget) * 100);

  // Prev month vs current — prev month simulated as 85-115% of actual per category
  const cats = useMemo(() => ["Nómina", "Pintura", "Fachada", "Materiales", "Transportes", "Caja Menor", "Otros"], []);
  const chartData = useMemo(() => cats.map((cat, i) => {
    const actual = costEntries.filter((c) => c.category === cat).reduce((s, c) => s + c.value, 0);
    const prevRatios = [0.87, 1.12, 0.93, 1.05, 0.88, 0.97, 1.15];
    return { categoria: cat, Marzo: Math.round(actual * prevRatios[i]), Abril: actual };
  }), [cats, costEntries]);

  if (loading) {
    return (
      <AppShell title="Control de Costos" subtitle="Cargando...">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg mb-6" />
        <Skeleton className="h-48 rounded-lg" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Control de Costos" subtitle="Abril 2026"
      actions={<Button variant="brand" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Registrar costo</Button>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total del mes" value={formatCOP(total, { compact: true })} icon={Wallet} accent="primary" />
        <KpiCard label="Presupuesto" value={formatCOP(budget, { compact: true })} icon={TrendingUp} accent="info" />
        <KpiCard
          label="% ejecutado"
          value={<span className={pct < 80 ? "text-success" : pct < 95 ? "text-warning" : "text-destructive"}>{pct}%</span>}
          accent={pct < 80 ? "success" : pct < 95 ? "warning" : "destructive"}
          icon={TrendingUp}
        />
        <KpiCard
          label="Diferencia"
          value={<span className="text-success">{formatCOP(budget - total, { compact: true })}</span>}
          icon={TrendingDown}
          accent="success"
        />
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-card p-5 mb-6">
        <h3 className="font-bold mb-4">Costos por categoría · Marzo vs Abril</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatCOP(v, { compact: true })} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => formatCOP(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Marzo" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Abril" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold">Registros del mes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Tipo pago</th>
                <th className="px-4 py-3 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {costEntries.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatDateShort(c.date)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{c.category}</Badge></td>
                  <td className="px-4 py-3 font-medium">{c.provider}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{c.paymentType}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCOP(c.value)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-muted/40 font-bold">
                <td colSpan={5} className="px-4 py-3 text-right">TOTAL</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
