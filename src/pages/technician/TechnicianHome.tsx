import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { activities, materials, getSite, attendance } from "@/data/mock";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, MapPin, Camera, CheckCircle2, XCircle, Plus, Package } from "lucide-react";
import { toast } from "sonner";

export default function TechnicianHome() {
  const { user, logout } = useAuth();
  const [checkedIn, setCheckedIn] = useState(true);
  const [completeOpen, setCompleteOpen] = useState<string | null>(null);

  if (!user) return null;

  const myActivities = activities.filter((a) => a.technicianId === user.id && a.status !== "completada" && a.status !== "recibida").slice(0, 5);
  const initialFallback = myActivities.length === 0 ? activities.filter(a => a.status !== "completada" && a.status !== "recibida").slice(0, 4) : myActivities;
  
  const [myActList, setMyActList] = useState<typeof activities>(initialFallback);

  const myAttendance = attendance.find((a) => a.technicianId === user.id);
  const currentSite = myAttendance ? getSite(myAttendance.siteId) : getSite("s1");

  const handleComplete = (id: string) => {
    setMyActList(prev => prev.filter(a => a.id !== id));
    toast.success("Actividad completada (prototipo)");
    setCompleteOpen(null);
  };

  const handleCancel = (id: string) => {
    setMyActList(prev => prev.filter(a => a.id !== id));
    toast.warning("Actividad reportada como no realizada (prototipo)");
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <BrandLogo variant="light" size="sm" />
          <button onClick={logout} className="p-2 -mr-2 rounded-md hover:bg-white/10" aria-label="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3">
          <p className="text-sm opacity-80">{greeting},</p>
          <p className="text-xl font-bold">{user.name.split(" ")[0]}</p>
          {currentSite && (
            <p className="text-xs opacity-75 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {currentSite.name}
            </p>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Attendance card */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Asistencia</p>
          {!checkedIn ? (
            <Button
              variant="success"
              className="w-full mt-3 h-16 text-base font-bold gap-2"
              onClick={() => { setCheckedIn(true); toast.success("Llegada registrada a las 08:14 AM"); }}
            >
              <MapPin className="w-5 h-5" /> MARCAR LLEGADA
            </Button>
          ) : (
            <>
              <p className="mt-2 text-sm">
                En sede desde <span className="font-bold text-success">08:14 AM</span>
              </p>
              <Button
                variant="destructive"
                className="w-full mt-3 h-14 text-base font-bold"
                onClick={() => { setCheckedIn(false); toast.success("Salida registrada"); }}
              >
                MARCAR SALIDA
              </Button>
            </>
          )}
        </div>

        {/* Activities of the day */}
        <div>
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wide mb-2 px-1">
            Mis actividades de hoy ({myActList.length})
          </h2>
          {myActList.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border shadow-card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-success/50 mx-auto mb-3" />
              <p className="font-semibold text-foreground">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground">Has completado todas tus actividades.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {myActList.map((a) => (
                <li key={a.id} className="bg-surface rounded-xl border border-border shadow-card p-4">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <p className="font-semibold text-sm flex-1">{a.description}</p>
                    <Badge variant="outline" className="shrink-0">{a.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{getSite(a.siteId)?.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="success"
                      className="h-12 font-bold gap-1.5"
                      onClick={() => setCompleteOpen(a.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Completar
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 font-bold gap-1.5"
                      onClick={() => handleCancel(a.id)}
                    >
                      <XCircle className="w-4 h-4" /> No realizada
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Materials received */}
        <div>
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wide mb-2 px-1">
            Materiales entregados hoy
          </h2>
          <ul className="bg-surface rounded-xl border border-border shadow-card divide-y divide-border">
            {materials.slice(0, 3).map((m) => (
              <li key={m.id} className="p-3 flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm">{m.name}</span>
                <span className="text-sm font-mono font-semibold">2 {m.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* FAB */}
      <Button
        variant="brand"
        className="fixed bottom-5 right-5 h-14 px-5 rounded-full shadow-elevated gap-2 font-bold"
        onClick={() => toast.info("Reportar novedad — próximamente")}
      >
        <Camera className="w-5 h-5" /> Reportar novedad
      </Button>

      {/* Complete modal */}
      <Dialog open={!!completeOpen} onOpenChange={(o) => !o && setCompleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar actividad</DialogTitle>
            <DialogDescription>Sube una foto de evidencia y agrega observaciones.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <button className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/70 border-2 border-dashed border-border">
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Tomar foto</span>
            </button>
            <Textarea placeholder="Observaciones (opcional)" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteOpen(null)}>Cancelar</Button>
            <Button variant="success" onClick={() => completeOpen && handleComplete(completeOpen)}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
