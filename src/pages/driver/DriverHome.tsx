import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Package, MapPin, CheckCircle2 } from "lucide-react";
import { materials } from "@/data/mock";
import { toast } from "sonner";

const dispatches = [
  { id: "d1", site: "Torre A — Apto 101", receiver: "Alexander Espinosa", items: 3, eta: "09:30 AM" },
  { id: "d2", site: "Torre B — Apto 401", receiver: "Harold Castro", items: 5, eta: "11:00 AM" },
  { id: "d3", site: "Zonas Comunes — Lobby", receiver: "Nicolás Rodríguez", items: 2, eta: "02:15 PM" },
];

export default function DriverHome() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary text-secondary-foreground p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <BrandLogo variant="light" size="sm" />
          <button onClick={logout} className="p-2 -mr-2 rounded-md hover:bg-white/10"><LogOut className="w-5 h-5" /></button>
        </div>
        <p className="mt-3 text-xl font-bold">Despachos pendientes</p>
        <p className="text-sm opacity-80">{dispatches.length} entregas programadas hoy</p>
      </header>

      <main className="p-4 space-y-3 pb-8">
        {dispatches.map((d) => (
          <div key={d.id} className="bg-surface rounded-xl border border-border shadow-card p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <Badge variant="outline">{d.items} ítems</Badge>
              </div>
              <span className="text-xs font-mono font-semibold">{d.eta}</span>
            </div>
            <p className="font-semibold text-sm">{d.site}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> Recibe: {d.receiver}
            </p>
            <ul className="mt-3 space-y-1 text-xs">
              {materials.slice(0, d.items).map((m) => (
                <li key={m.id} className="flex justify-between p-2 bg-muted/40 rounded">
                  <span>{m.name}</span>
                  <span className="font-mono">2 {m.unit}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="success"
              className="w-full mt-3 h-11 gap-1.5 font-bold"
              onClick={() => toast.success("Entrega confirmada — receptor firmó")}
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar entrega
            </Button>
          </div>
        ))}
      </main>
    </div>
  );
}
