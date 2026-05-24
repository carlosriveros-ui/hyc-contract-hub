import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { contractsApi, usersApi } from "@/lib/dataService";
import { formatCOP, formatDate, timeProgress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ArrowRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Contract, User } from "@/types";

export default function ContractsList() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([contractsApi.list(), usersApi.list()])
      .then(([c, u]) => { setContracts(c); setUsers(u); })
      .catch(() => toast.error("Error al cargar contratos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contracts.filter((c) =>
    c.clientName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const coordinators = users.filter((u) => u.role === "coordinador");

  return (
    <AppShell title="Contratos & Sedes" subtitle="Gestión integral de contratos de mantenimiento"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="brand" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo Contrato</span>
            </Button>
          </DialogTrigger>
          <NewContractDialog
            coordinators={coordinators}
            onClose={() => setOpen(false)}
            onCreated={() => { setOpen(false); load(); }}
          />
        </Dialog>
      }
    >
      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contrato o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="todos">
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="2026">
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Sedes</th>
                    <th className="px-4 py-3 font-semibold">Valor total</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Fin</th>
                    <th className="px-4 py-3 font-semibold">% Tiempo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const progress = timeProgress(c.startDate, c.endDate);
                    return (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/contratos/${c.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/contratos/${c.id}`); }
                          }}>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground">{c.clientName}</p>
                          <p className="text-xs text-muted-foreground">NIT {c.nit}</p>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">{c.sitesCount}</td>
                        <td className="px-4 py-3.5 font-semibold tabular-nums">{formatCOP(c.totalValue)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatDate(c.startDate)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatDate(c.endDate)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-warning" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">Activo</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ArrowRight className="w-4 h-4 text-muted-foreground inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border">
              {filtered.map((c) => {
                const progress = timeProgress(c.startDate, c.endDate);
                return (
                  <button key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}
                    className="w-full text-left p-4 hover:bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold">{c.clientName}</p>
                      <Badge className="bg-success/15 text-success border-success/30">Activo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.sitesCount} sedes · {formatCOP(c.totalValue)}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-warning" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums">{progress}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div className="p-4 border-t border-border flex justify-center">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            {filtered.length} contrato{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

const contractSchema = z.object({
  clientName: z.string().min(1, "El nombre es obligatorio"),
  nit: z.string().min(1, "El NIT es obligatorio"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  totalValue: z.coerce.number().min(1, "El valor debe ser mayor a 0"),
  monthlyBudget: z.coerce.number().min(1, "El presupuesto debe ser mayor a 0"),
  startDate: z.string().min(1, "Requerido"),
  endDate: z.string().min(1, "Requerido"),
  coordinatorId: z.string().min(1, "Requerido"),
  status: z.string().min(1, "Requerido"),
});

function NewContractDialog({
  coordinators,
  onClose,
  onCreated,
}: {
  coordinators: User[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      coordinatorId: coordinators[0]?.id ?? "u2",
      status: "activo",
    }
  });

  const onSubmit = async (data: z.infer<typeof contractSchema>) => {
    setIsSubmitting(true);
    try {
      await contractsApi.create({
        clientName: data.clientName,
        nit: data.nit,
        contactName: data.contactName ?? "",
        contactPhone: data.contactPhone ?? "",
        totalValue: data.totalValue,
        monthlyBudget: data.monthlyBudget,
        startDate: data.startDate,
        endDate: data.endDate,
        coordinatorId: data.coordinatorId,
        status: data.status as "activo" | "negociacion" | "vencido",
        sitesCount: 0,
      });
      toast.success("Contrato creado exitosamente");
      onCreated();
    } catch {
      toast.error("Error al crear el contrato");
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nuevo Contrato</DialogTitle>
        <DialogDescription>Registra un nuevo contrato de mantenimiento.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Nombre del cliente</Label>
          <Input placeholder="Ej: Conjunto Residencial Bella Vista" {...register("clientName")} />
          {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>NIT</Label>
          <Input placeholder="900.000.000-0" {...register("nit")} />
          {errors.nit && <p className="text-xs text-destructive">{errors.nit.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Contacto</Label>
          <Input placeholder="Nombre del contacto" {...register("contactName")} />
        </div>
        <div className="space-y-1.5">
          <Label>Valor total (COP)</Label>
          <Input type="number" placeholder="1480000000" {...register("totalValue")} />
          {errors.totalValue && <p className="text-xs text-destructive">{errors.totalValue.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Presupuesto mensual (COP)</Label>
          <Input type="number" placeholder="55000000" {...register("monthlyBudget")} />
          {errors.monthlyBudget && <p className="text-xs text-destructive">{errors.monthlyBudget.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Fecha de inicio</Label>
          <Input type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Fecha de fin</Label>
          <Input type="date" {...register("endDate")} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Coordinador</Label>
          <Select defaultValue={coordinators[0]?.id ?? "u2"} onValueChange={(v) => setValue("coordinatorId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {coordinators.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select defaultValue="activo" onValueChange={(v) => setValue("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="negociacion">En negociación</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : "Guardar contrato"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
