import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { activities, getSite, getUser, materials, getMaterial } from "@/data/mock";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Activity } from "@/types";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export default function ActivitiesCoordinator() {
  const [selected, setSelected] = useState<Activity | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTech, setFilterTech] = useState("todos");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actList, setActList] = useState<Activity[]>(activities);
  const [actionLoading, setActionLoading] = useState<"recibida" | "correccion" | null>(null);

  const filtered = actList.filter((a) => {
    const matchesSearch = a.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = filterStatus === "todos" || a.status === filterStatus;
    const matchesTech = filterTech === "todos" || a.technicianId === filterTech;
    return matchesSearch && matchesStatus && matchesTech;
  });

  return (
    <AppShell title="Actividades" subtitle="Programación y seguimiento de mantenimiento"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="brand" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Actividad</span>
            </Button>
          </DialogTrigger>
          <NewActivityDialog onClose={() => setIsCreateOpen(false)} onAdd={(a) => setActList([a, ...actList])} />
        </Dialog>
      }
    >
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 border-b border-border">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar actividad..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="programada">Programadas</SelectItem>
              <SelectItem value="ejecucion">En ejecución</SelectItem>
              <SelectItem value="completada">Completadas</SelectItem>
              <SelectItem value="recibida">Recibidas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="u3">Alexander Espinosa</SelectItem>
              <SelectItem value="u4">Miguel Tejedor</SelectItem>
              <SelectItem value="u5">Harold Castro</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="hoy">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Sede</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Técnico</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const site = getSite(a.siteId);
                const tech = a.technicianId ? getUser(a.technicianId) : undefined;
                return (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelected(a)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(a);
                        }
                      }}>
                    <td className="px-4 py-3">{site?.name}</td>
                    <td className="px-4 py-3 font-medium">{a.description}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{a.type}</Badge></td>
                    <td className="px-4 py-3">
                      {tech && (
                        <div className="flex items-center gap-2">
                          <Avatar name={tech.name} className="w-6 h-6 text-[10px]" />
                          <span className="text-xs">{tech.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(a.scheduledDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((a) => {
            const site = getSite(a.siteId);
            const tech = a.technicianId ? getUser(a.technicianId) : undefined;
            return (
              <button key={a.id} className="w-full text-left p-4 hover:bg-muted/30" onClick={() => setSelected(a)}>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="font-semibold text-sm">{a.description}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-xs text-muted-foreground">{site?.name}</p>
                {tech && <p className="text-xs text-muted-foreground mt-1">👷 {tech.name}</p>}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-border flex justify-center">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Función de paginación simulada")}>
            Cargar más resultados
          </Button>
        </div>
      </div>

      {/* Side drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <StatusBadge status={selected.status} />
                  <Badge variant="outline">{selected.type}</Badge>
                </div>
                <SheetTitle className="text-left mt-2">{selected.description}</SheetTitle>
                <SheetDescription className="text-left">
                  {getSite(selected.siteId)?.name} · {formatDate(selected.scheduledDate)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <section>
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Técnico asignado</h4>
                  {selected.technicianId && (
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                      <Avatar name={getUser(selected.technicianId)!.name} className="w-10 h-10" />
                      <div>
                        <p className="font-semibold text-sm">{getUser(selected.technicianId)!.name}</p>
                        <p className="text-xs text-muted-foreground">{getUser(selected.technicianId)!.email}</p>
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Evidencia fotográfica</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="aspect-square rounded-md bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Materiales utilizados</h4>
                  <ul className="space-y-1.5 text-sm">
                    {materials.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex justify-between p-2 bg-muted/40 rounded">
                        <span>{m.name}</span>
                        <span className="font-mono text-muted-foreground">2 {m.unit}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Historial</h4>
                  <ol className="space-y-2 text-xs border-l-2 border-border pl-4 ml-2">
                    <li><span className="font-semibold">08:14</span> · Técnico marcó llegada</li>
                    <li><span className="font-semibold">08:30</span> · Inició actividad</li>
                    <li><span className="font-semibold">10:45</span> · Subió 3 fotos</li>
                    <li><span className="font-semibold">11:20</span> · Marcó completada</li>
                  </ol>
                </section>

                <div className="flex gap-2 pt-2">
                  <Button variant="success" className="flex-1 gap-1.5" disabled={!!actionLoading} onClick={() => {
                    setActionLoading("recibida");
                    setTimeout(() => {
                      toast.success("Actividad recibida");
                      setSelected(null);
                      setActionLoading(null);
                    }, 800);
                  }}>
                    {actionLoading === "recibida" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {actionLoading === "recibida" ? "Procesando..." : "Marcar Recibida"}
                  </Button>
                  <Button variant="outline" className="gap-1.5" disabled={!!actionLoading} onClick={() => {
                    setActionLoading("correccion");
                    setTimeout(() => {
                      toast.warning("Solicitud enviada");
                      setSelected(null);
                      setActionLoading(null);
                    }, 800);
                  }}>
                    {actionLoading === "correccion" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    {actionLoading === "correccion" ? "Enviando..." : "Corrección"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function NewActivityDialog({ onClose, onAdd }: { onClose: () => void, onAdd: (a: Activity) => void }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Nueva Actividad</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => { 
          e.preventDefault(); 
          const fd = new FormData(e.currentTarget);
          const newAct: Activity = {
            id: `a${Date.now()}`,
            contractId: "c1",
            siteId: fd.get("siteId") as string || "s1",
            description: fd.get("desc") as string,
            type: fd.get("type") as string || "General",
            technicianId: fd.get("techId") as string || "u3",
            scheduledDate: new Date().toISOString().slice(0, 10),
            status: "programada"
          };
          onAdd(newAct);
          toast.success("Actividad creada (prototipo)"); 
          onClose(); 
        }}
        className="grid gap-4"
      >
        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Input name="desc" placeholder="Ej: Cambio de luminaria" required />
        </div>
        <div className="space-y-1.5">
          <Label>Sede / Unidad</Label>
          <Select name="siteId" defaultValue="s1">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="s1">Torre A — Apto 101</SelectItem>
              <SelectItem value="s2">Torre A — Apto 201</SelectItem>
              <SelectItem value="s22">Zonas Comunes — Lobby</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de trabajo</Label>
          <Input name="type" placeholder="Pintura, Eléctrico, etc." defaultValue="Mantenimiento" />
        </div>
        <div className="space-y-1.5">
          <Label>Técnico asignado</Label>
          <Select name="techId" defaultValue="u3">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="u3">Alexander Espinosa</SelectItem>
              <SelectItem value="u4">Miguel Tejedor</SelectItem>
              <SelectItem value="u5">Harold Castro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="brand">Guardar actividad</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
