import { AppShell } from "@/components/AppShell";
import { useParams, useNavigate } from "react-router-dom";
import { contracts, sites, getUser, costEntries } from "@/data/mock";
import { formatCOP, formatDate, timeProgress } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { ArrowLeft, Plus, Search, FileText } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contract = contracts.find((c) => c.id === id);
  if (!contract) return <AppShell title="Contrato no encontrado"><p>No existe</p></AppShell>;

  const contractSites = sites.filter((s) => s.contractId === contract.id);
  const progress = timeProgress(contract.startDate, contract.endDate);

  // Monthly cost line data
  const monthlyData = [
    { month: "Nov", value: 42_500_000 },
    { month: "Dic", value: 51_200_000 },
    { month: "Ene", value: 47_800_000 },
    { month: "Feb", value: 53_100_000 },
    { month: "Mar", value: 49_400_000 },
    { month: "Abr", value: 48_200_000 },
  ];

  return (
    <AppShell
      title={contract.clientName}
      subtitle={`NIT ${contract.nit} · ${contract.sitesCount} sedes`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => navigate("/contratos")}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Activo</Badge>
        <Badge variant="outline">Coordinador: {getUser(contract.coordinatorId)?.name}</Badge>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="sedes">Sedes ({contractSites.length})</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg border border-border shadow-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Datos del contrato</h3>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Valor total</dt>
                <dd className="font-semibold tabular-nums text-right">{formatCOP(contract.totalValue)}</dd>
                <dt className="text-muted-foreground">Presupuesto mensual</dt>
                <dd className="font-semibold tabular-nums text-right">{formatCOP(contract.monthlyBudget)}</dd>
                <dt className="text-muted-foreground">Fecha de inicio</dt>
                <dd className="text-right">{formatDate(contract.startDate)}</dd>
                <dt className="text-muted-foreground">Fecha de fin</dt>
                <dd className="text-right">{formatDate(contract.endDate)}</dd>
                <dt className="text-muted-foreground">Coordinador</dt>
                <dd className="text-right">{getUser(contract.coordinatorId)?.name}</dd>
              </dl>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">% tiempo transcurrido</span>
                  <span className="font-semibold tabular-nums">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border shadow-card p-5">
              <h3 className="font-semibold text-foreground mb-3">Costos mensuales</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCOP(v, { compact: true })} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [formatCOP(v), "Costo"]}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sedes" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar sede..." className="pl-9" />
            </div>
            <Button variant="outline-brand" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Agregar Sede
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contractSites.map((s) => {
              const tech = s.technicianId ? getUser(s.technicianId) : undefined;
              return (
                <div key={s.id} className="bg-surface rounded-lg border border-border shadow-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-sm">{s.name}</h4>
                    <Badge className={s.status === "activa" ? "bg-success/15 text-success border-success/30 hover:bg-success/15" : "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15"}>
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.address}</p>
                  {tech && (
                    <div className="mt-3 flex items-center gap-2">
                      <Avatar name={tech.name} className="w-6 h-6 text-[10px]" />
                      <span className="text-xs text-muted-foreground">{tech.name}</span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="mt-3 w-full text-primary hover:text-primary hover:bg-primary/5">
                    Ver actividades →
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <div className="bg-surface rounded-lg border border-border p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Equipo asignado al contrato — próximamente</p>
          </div>
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <div className="bg-surface rounded-lg border border-border p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Documentos del contrato — próximamente</p>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
