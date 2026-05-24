import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { useState, useEffect } from "react";
import { materialsApi, movementsApi, usersApi } from "@/lib/dataService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ArrowDown, ArrowRight, ArrowUp, CheckCircle2, AlertTriangle, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Material, Movement, User } from "@/types";

const movementIcons = {
  entrada: { icon: ArrowDown, color: "text-success bg-success/10", label: "Entrada" },
  despacho: { icon: ArrowRight, color: "text-info bg-info/10", label: "Despacho" },
  entrega: { icon: CheckCircle2, color: "text-success bg-success/10", label: "Entrega" },
  devolucion: { icon: ArrowUp, color: "text-muted-foreground bg-muted", label: "Devolución" },
};

export default function MaterialsWarehouse() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([materialsApi.list(), movementsApi.list(), usersApi.list()])
      .then(([m, mv, u]) => { setMaterials(m); setMovements(mv); setUsers(u); })
      .catch(() => toast.error("Error al cargar materiales"))
      .finally(() => setLoading(false));
  }, []);

  const getMaterial = (id: string) => materials.find((m) => m.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  const totalStock = materials.reduce((s, m) => s + m.stock, 0);
  const lowStock = materials.filter((m) => m.stock <= m.minStock).length;
  const filtered = materials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <AppShell title="Materiales & Bodega" subtitle="Inventario y movimientos">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Materiales & Bodega" subtitle="Inventario y movimientos">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Stock total" value={totalStock} icon={Package} accent="info" />
        <KpiCard label="Movimientos registrados" value={movements.length} icon={ArrowDown} accent="success" />
        <KpiCard label="Bajo stock mínimo" value={<span className="text-destructive">{lowStock}</span>} icon={AlertTriangle} accent="destructive" />
      </div>

      <Tabs defaultValue="inventario">
        <TabsList>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="despachos">Despachos pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="mt-4">
          <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar material..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="todas">
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    <SelectItem value="Pinturas">Pinturas</SelectItem>
                    <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Herramientas">Herramientas</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="brand" size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Registrar Entrada
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold text-right">Stock</th>
                    <th className="px-4 py-3 font-semibold text-right">Mínimo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const status = m.stock === 0 ? "agotado" : m.stock <= m.minStock ? "bajo" : "ok";
                    const cfg = {
                      ok: { label: "OK", className: "bg-success/15 text-success border-success/30" },
                      bajo: { label: "Bajo", className: "bg-warning/15 text-warning border-warning/30" },
                      agotado: { label: "Agotado", className: "bg-destructive/15 text-destructive border-destructive/30" },
                    }[status];
                    return (
                      <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{m.category}</Badge></td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{m.stock} {m.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.minStock}</td>
                        <td className="px-4 py-3"><Badge className={cfg.className + " hover:" + cfg.className}>{cfg.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4">
          <div className="bg-surface rounded-lg border border-border shadow-card p-5">
            <h3 className="font-semibold mb-4">Timeline de movimientos</h3>
            <ol className="space-y-3">
              {movements.map((mv) => {
                const cfg = movementIcons[mv.type as keyof typeof movementIcons];
                if (!cfg) return null;
                const Icon = cfg.icon;
                const mat = getMaterial(mv.materialId);
                const user = getUser(mv.userId);
                return (
                  <li key={mv.id} className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pb-3 border-b border-border">
                      <div className="flex justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{cfg.label} · {mat?.name ?? mv.materialId}</p>
                        <span className="text-xs text-muted-foreground">{mv.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mv.qty} {mat?.unit ?? ""} · {mv.origin} → {mv.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">por {user?.name ?? mv.userId}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="despachos" className="mt-4">
          <div className="bg-surface rounded-lg border border-border p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay despachos pendientes</p>
            <Button variant="outline-brand" size="sm" className="mt-3 gap-1.5">
              <Plus className="w-4 h-4" /> Nuevo despacho
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
