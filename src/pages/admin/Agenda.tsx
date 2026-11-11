import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays, CalendarCheck2, Copy, ExternalLink, KeyRound, Mail, MessageCircle, Plus, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Link2, Save,
} from "lucide-react";
import { toast } from "sonner";
import { agendaApi, getAdminKey, setAdminKey, type AdminBooking, type IntegrationStatus } from "@/lib/agenda/client";
import type { AgendaEventType, AgendaSettings, LocationType, TimeWindow } from "@/lib/agenda/types";
import { LOCATION_LABELS, STATUS_LABELS } from "@/lib/agenda/types";
import { formatHuman } from "@/lib/agenda/time";
import { waMeLink } from "@/lib/agenda/messages";
import { themeFor } from "@/pages/agendar/theme";
import { cn } from "@/lib/utils";

const DAYS: [string, string][] = [["1", "Lunes"], ["2", "Martes"], ["3", "Miércoles"], ["4", "Jueves"], ["5", "Viernes"], ["6", "Sábado"], ["0", "Domingo"]];

function KeyGate({ onSaved, message }: { onSaved: () => void; message?: string }) {
  const [key, setKey] = useState(getAdminKey());
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-6">
      <div className="mb-3 flex items-center gap-2 font-semibold"><KeyRound className="h-5 w-5 text-primary" />Clave de la agenda</div>
      <p className="mb-4 text-sm text-muted-foreground">
        Escribe el valor de <code className="rounded bg-muted px-1">AGENDA_ADMIN_KEY</code> que configuraste en Vercel. Se guarda solo en este navegador.
      </p>
      {message && <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}
      <form onSubmit={(e) => { e.preventDefault(); setAdminKey(key.trim()); onSaved(); }} className="flex gap-2">
        <Input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Clave" autoFocus />
        <Button type="submit">Entrar</Button>
      </form>
    </div>
  );
}

function StatusRow({ ok, warn, label, detail }: { ok: boolean; warn?: boolean; label: string; detail: string }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ok ? "text-success" : warn ? "text-warning" : "text-muted-foreground")} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default function Agenda() {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [eventTypes, setEventTypes] = useState<AgendaEventType[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [newBlocked, setNewBlocked] = useState("");

  const load = useCallback(() => {
    if (!getAdminKey()) { setAuthError(""); setLoading(false); return; }
    setLoading(true);
    agendaApi.admin()
      .then((d) => { setSettings(d.settings); setEventTypes(d.eventTypes); setBookings(d.bookings); setStatus(d.status); setAuthError(null); })
      .catch((e) => {
        if (e.status === 401 || e.status === 503) setAuthError(e.message);
        else toast.error(`Error al cargar la agenda: ${e.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    if (params.get("google") === "ok") {
      toast.success("Google Calendar conectado");
      params.delete("google");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const publicUrl = `${window.location.origin}/agendar`;
  const now = Date.now();
  const upcoming = useMemo(() => bookings.filter((b) => b.status === "confirmada" && Date.parse(b.endAt) > now), [bookings, now]);
  const past = useMemo(() => bookings.filter((b) => !(b.status === "confirmada" && Date.parse(b.endAt) > now)).reverse(), [bookings, now]);
  const thisWeek = upcoming.filter((b) => Date.parse(b.startAt) < now + 7 * 86_400_000).length;
  const etById = (id: string) => eventTypes.find((e) => e.id === id);

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast.success("Enlace copiado"), () => toast.error("No se pudo copiar"));

  const saveSettings = async (patch?: Partial<AgendaSettings>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await agendaApi.saveSettings(patch ?? settings);
      setSettings({ ...settings, ...saved });
      toast.success("Cambios guardados");
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const setWindows = (day: string, windows: TimeWindow[]) => {
    if (!settings) return;
    const wh = { ...settings.weeklyHours };
    if (windows.length) wh[day] = windows; else delete wh[day];
    setSettings({ ...settings, weeklyHours: wh });
  };

  const saveEventType = async (e: Partial<AgendaEventType>) => {
    try {
      const saved = await agendaApi.saveEventType(e);
      setEventTypes((prev) => {
        const i = prev.findIndex((x) => x.id === saved.id);
        return i >= 0 ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
      });
      toast.success("Tipo de reunión guardado");
    } catch (err) { toast.error((err as Error).message); }
  };

  const changeStatus = async (b: AdminBooking, st: string) => {
    let reason: string | undefined;
    if (st === "cancelada") {
      const r = window.prompt(`¿Cancelar la reunión con ${b.guestName}? Se le avisará por correo y WhatsApp.\n\nMotivo (opcional):`);
      if (r === null) return;
      reason = r;
    }
    try {
      await agendaApi.setBookingStatus(b.id, st, reason);
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: st as AdminBooking["status"], cancelReason: reason ?? x.cancelReason } : x)));
      toast.success(`Reserva: ${STATUS_LABELS[st as AdminBooking["status"]]}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const shareActions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => copy(publicUrl)}><Copy className="mr-1.5 h-4 w-4" />Copiar enlace</Button>
      <Button size="sm" asChild><a href="/agendar" target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" />Ver página</a></Button>
    </div>
  );

  if (authError !== null && !loading) {
    return (
      <AppShell title="Agenda" subtitle="Reservas de reuniones con tu marca">
        <KeyGate onSaved={load} message={authError || undefined} />
      </AppShell>
    );
  }

  if (loading || !settings || !status) {
    return (
      <AppShell title="Agenda" subtitle="Reservas de reuniones con tu marca">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        <Skeleton className="h-64 rounded-lg" />
      </AppShell>
    );
  }

  const brandPreview = (["carlos-riveros", "hyc"] as const).map((b) => ({ b, t: themeFor(b) }));

  return (
    <AppShell title="Agenda" subtitle="Reservas de reuniones con tu marca" actions={shareActions}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Próximas reuniones" value={String(upcoming.length)} icon={CalendarDays} />
        <KpiCard label="Próximos 7 días" value={String(thisWeek)} icon={CalendarCheck2} />
        <KpiCard label="Google Calendar" value={status.google === "conectado" ? "Conectado" : "Pendiente"} icon={Link2} />
      </div>

      <Tabs defaultValue="reservas">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="horario">Disponibilidad</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de reunión</TabsTrigger>
          <TabsTrigger value="marca">Marca y textos</TabsTrigger>
          <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
        </TabsList>

        {/* ── Reservas ─────────────────────────────────────────────── */}
        <TabsContent value="reservas" className="space-y-6">
          {[["Próximas", upcoming], ["Historial (últimos 60 días)", past]].map(([title, list]) => (
            <div key={title as string} className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3 font-semibold">{title as string}</div>
              {(list as AdminBooking[]).length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Sin reuniones.</p>}
              <ul className="divide-y">
                {(list as AdminBooking[]).map((b) => {
                  const et = etById(b.eventTypeId);
                  const failed = (b.notifyLog ?? []).filter((n) => !n.ok);
                  return (
                    <li key={b.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                      <div className="w-full shrink-0 md:w-56">
                        <p className="text-sm font-semibold first-letter:uppercase">{formatHuman(Date.parse(b.startAt), settings.timezone, { withTime: false })}</p>
                        <p className="text-sm text-muted-foreground">{formatHuman(Date.parse(b.startAt), settings.timezone, { withDate: false })} · {et?.durationMinutes ?? "?"} min</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{b.guestName}{b.guestCompany && <span className="text-muted-foreground"> · {b.guestCompany}</span>}</p>
                        <p className="truncate text-sm text-muted-foreground">{et?.title ?? "—"}{b.guestNotes && ` — ${b.guestNotes}`}</p>
                        {failed.length > 0 && <p className="mt-1 text-xs text-destructive">{failed.length} aviso(s) no se enviaron: {failed[failed.length - 1].error}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={b.status === "confirmada" ? "default" : "secondary"}>{STATUS_LABELS[b.status]}</Badge>
                        {b.meetUrl && <Button variant="ghost" size="icon" asChild title="Google Meet"><a href={b.meetUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                        <Button variant="ghost" size="icon" asChild title="Correo"><a href={`mailto:${b.guestEmail}`}><Mail className="h-4 w-4" /></a></Button>
                        {b.guestPhone && <Button variant="ghost" size="icon" asChild title="WhatsApp"><a href={waMeLink(b.guestPhone, `Hola ${b.guestName.split(" ")[0]}, `)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>}
                        <select
                          aria-label="Cambiar estado"
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value=""
                          onChange={(e) => e.target.value && changeStatus(b, e.target.value)}
                        >
                          <option value="">Acción…</option>
                          {b.status === "confirmada" && Date.parse(b.startAt) > now && <option value="cancelada">Cancelar y avisar</option>}
                          {Date.parse(b.startAt) <= now && <option value="asistio">Asistió</option>}
                          {Date.parse(b.startAt) <= now && <option value="no_asistio">No asistió</option>}
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </TabsContent>

        {/* ── Disponibilidad ───────────────────────────────────────── */}
        <TabsContent value="horario" className="space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-1 font-semibold">Horario semanal</p>
            <p className="mb-4 text-sm text-muted-foreground">Solo se ofrecen horas dentro de estas franjas y que estén libres en Google, Samsung y tus otras reservas.</p>
            <div className="divide-y">
              {DAYS.map(([d, label]) => {
                const windows = settings.weeklyHours[d] ?? [];
                return (
                  <div key={d} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                    <div className="flex w-36 shrink-0 items-center gap-3 pt-1.5">
                      <Switch checked={windows.length > 0} onCheckedChange={(on) => setWindows(d, on ? [{ start: "09:00", end: "17:00" }] : [])} aria-label={label} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {windows.length === 0 && <span className="pt-1.5 text-sm text-muted-foreground">No disponible</span>}
                      {windows.map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input type="time" className="w-32" value={w.start} onChange={(e) => setWindows(d, windows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                          <span className="text-muted-foreground">–</span>
                          <Input type="time" className="w-32" value={w.end} onChange={(e) => setWindows(d, windows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
                          <Button variant="ghost" size="icon" title="Quitar franja" onClick={() => setWindows(d, windows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                          {i === windows.length - 1 && <Button variant="ghost" size="icon" title="Agregar franja" onClick={() => setWindows(d, [...windows, { start: "14:00", end: "17:00" }])}><Plus className="h-4 w-4" /></Button>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["bufferMinutes", "Descanso entre reuniones (min)", "Libre antes y después de cada evento."],
              ["minNoticeMinutes", "Anticipación mínima (min)", "1440 = 24 horas."],
              ["maxDaysAhead", "Días hacia adelante", "Hasta cuándo se puede agendar."],
              ["dailyLimit", "Máximo de reuniones por día", "0 = sin límite."],
              ["slotStepMinutes", "Intervalo entre horarios (min)", "Cada cuánto empieza un horario."],
            ] as const).map(([k, label, help]) => (
              <div key={k}>
                <Label htmlFor={k}>{label}</Label>
                <Input id={k} type="number" min={0} className="mt-1.5" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} />
                <p className="mt-1 text-xs text-muted-foreground">{help}</p>
              </div>
            ))}
            <div>
              <Label htmlFor="tz">Zona horaria</Label>
              <Input id="tz" className="mt-1.5" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">Ej.: America/Bogota</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-1 font-semibold">Días bloqueados</p>
            <p className="mb-3 text-sm text-muted-foreground">Vacaciones, festivos o días de obra sin agenda.</p>
            <div className="mb-3 flex gap-2">
              <Input type="date" className="w-48" value={newBlocked} onChange={(e) => setNewBlocked(e.target.value)} />
              <Button variant="outline" disabled={!newBlocked} onClick={() => { setSettings({ ...settings, blockedDates: Array.from(new Set([...settings.blockedDates, newBlocked])).sort() }); setNewBlocked(""); }}>
                <Plus className="mr-1.5 h-4 w-4" />Bloquear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.blockedDates.map((d) => (
                <Badge key={d} variant="secondary" className="gap-1.5 py-1">
                  {d}
                  <button aria-label={`Desbloquear ${d}`} onClick={() => setSettings({ ...settings, blockedDates: settings.blockedDates.filter((x) => x !== d) })}><XCircle className="h-3.5 w-3.5" /></button>
                </Badge>
              ))}
              {!settings.blockedDates.length && <span className="text-sm text-muted-foreground">Ninguno.</span>}
            </div>
          </div>
          <Button onClick={() => saveSettings()} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Guardar disponibilidad</Button>
        </TabsContent>

        {/* ── Tipos de reunión ─────────────────────────────────────── */}
        <TabsContent value="tipos" className="space-y-4">
          {eventTypes.map((e) => <EventTypeEditor key={e.id} value={e} onSave={saveEventType} onCopy={() => copy(`${publicUrl}/${e.slug}`)} />)}
          <EventTypeEditor
            key={`nuevo-${eventTypes.length}`}
            isNew
            value={{ id: "", slug: "", title: "", description: "", durationMinutes: 30, locationType: "meet", locationDetail: "", active: true, sortOrder: eventTypes.length + 1 }}
            onSave={saveEventType}
          />
        </TabsContent>

        {/* ── Marca y textos ───────────────────────────────────────── */}
        <TabsContent value="marca" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {brandPreview.map(({ b, t }) => (
              <button
                key={b}
                type="button"
                onClick={() => setSettings({ ...settings, brand: b })}
                className={cn("overflow-hidden rounded-xl border-2 text-left transition", settings.brand === b ? "border-primary" : "border-transparent")}
              >
                <div className="p-4" style={{ background: t.paper, color: t.ink }}>
                  <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest" style={{ background: t.ink, color: t.onInk }}>Agenda</span>
                  <p className="mt-2 text-xl font-bold">Agenda una <span className="font-serif font-normal italic" style={{ color: t.accent }}>reunión</span></p>
                  <div className="mt-3 flex gap-1.5">
                    {[t.ink, t.accent, t.soft, t.paper].map((c) => <span key={c} className="h-5 w-5 rounded-full border" style={{ background: c, borderColor: t.line }} />)}
                  </div>
                </div>
                <div className="bg-card px-4 py-2 text-sm font-medium">{t.brandName}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Los colores salen de <code>videos/marcas.json</code>.</p>
          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
            {([["ownerName", "Nombre"], ["ownerTitle", "Cargo / subtítulo"], ["headline", "Título de la página"], ["ownerEmail", "Correo para avisos de nuevas reservas"], ["ownerWhatsapp", "Tu WhatsApp (con indicativo)"]] as const).map(([k, label]) => (
              <div key={k}>
                <Label htmlFor={k}>{label}</Label>
                <Input id={k} className="mt-1.5" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="welcome">Mensaje de bienvenida</Label>
              <Textarea id="welcome" className="mt-1.5" value={settings.welcome} onChange={(e) => setSettings({ ...settings, welcome: e.target.value })} />
            </div>
          </div>
          <Button onClick={() => saveSettings()} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Guardar marca y textos</Button>
        </TabsContent>

        {/* ── Conexiones ───────────────────────────────────────────── */}
        <TabsContent value="conexiones">
          <div className="rounded-xl border bg-card px-4">
            <div className="divide-y">
              <StatusRow
                ok={status.google === "conectado"}
                warn={status.google === "sin_conectar" || status.google === "error"}
                label="Google Calendar (lee ocupados y crea el evento con Meet)"
                detail={{
                  conectado: `Conectado. Calendarios revisados: ${status.googleCalendars.join(", ")}.`,
                  sin_conectar: "Credenciales listas. Falta autorizar tu cuenta de Google.",
                  error: "Google rechazó el acceso. Vuelve a conectar.",
                  no_configurado: "Falta GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel.",
                }[status.google]}
              />
              {status.google !== "no_configurado" && (
                <div className="py-3">
                  <Button asChild variant={status.google === "conectado" ? "outline" : "default"}>
                    <a href={agendaApi.googleConnectUrl()}>{status.google === "conectado" ? "Reconectar Google" : "Conectar Google Calendar"}</a>
                  </Button>
                </div>
              )}
              <StatusRow ok={status.icsCount > 0} warn label="Samsung / Outlook / otros calendarios (ICS)" detail={status.icsCount ? `${status.icsCount} calendario(s) en AGENDA_ICS_URLS.` : "Opcional. Si tu Samsung Calendar sincroniza con Google no hace falta. Ver docs/AGENDA.md."} />
              <StatusRow ok={status.email} label="Correos (Resend)" detail={status.email ? "Confirmaciones y recordatorios por correo activos." : "Falta RESEND_API_KEY y AGENDA_EMAIL_FROM."} />
              <StatusRow ok={status.whatsapp} warn label="WhatsApp (Meta Cloud API)" detail={status.whatsapp ? "Mensajes por WhatsApp activos (requiere plantillas aprobadas)." : "Falta WHATSAPP_TOKEN y WHATSAPP_PHONE_ID. Mientras tanto, el invitado ve un botón para escribirte."} />
              <StatusRow ok={status.cronSecret} warn label="Recordatorios automáticos" detail={status.cronSecret ? "CRON_SECRET configurado." : "Configura CRON_SECRET y la tarea cada 10 min (ver docs/AGENDA.md)."} />
            </div>
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => { setAdminKey(""); setAuthError(""); }}>Cerrar sesión de la agenda</Button>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function EventTypeEditor({ value, onSave, onCopy, isNew }: { value: AgendaEventType; onSave: (e: Partial<AgendaEventType>) => Promise<void>; onCopy?: () => void; isNew?: boolean }) {
  const [v, setV] = useState(value);
  const [open, setOpen] = useState(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(value);
  if (isNew && !open) {
    return <Button variant="outline" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Nuevo tipo de reunión</Button>;
  }
  return (
    <div className={cn("rounded-xl border bg-card p-4", !v.active && "opacity-70")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{isNew ? "Nuevo tipo de reunión" : v.title}</p>
        <div className="flex items-center gap-3">
          {onCopy && <Button variant="ghost" size="sm" onClick={onCopy}><Copy className="mr-1.5 h-4 w-4" />/agendar/{value.slug}</Button>}
          <label className="flex items-center gap-2 text-sm"><Switch checked={v.active} onCheckedChange={(active) => setV({ ...v, active })} />Activo</label>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><Label>Nombre</Label><Input className="mt-1.5" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value, slug: isNew && !value.slug ? e.target.value : v.slug })} /></div>
        <div><Label>Enlace corto</Label><Input className="mt-1.5" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} /></div>
        <div><Label>Duración (min)</Label><Input className="mt-1.5" type="number" min={5} max={480} value={v.durationMinutes} onChange={(e) => setV({ ...v, durationMinutes: Number(e.target.value) })} /></div>
        <div>
          <Label>Modalidad</Label>
          <select className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm" value={v.locationType} onChange={(e) => setV({ ...v, locationType: e.target.value as LocationType })}>
            {(Object.keys(LOCATION_LABELS) as LocationType[]).map((k) => <option key={k} value={k}>{LOCATION_LABELS[k]}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2"><Label>{v.locationType === "presencial" ? "Dirección" : "Detalle (opcional)"}</Label><Input className="mt-1.5" value={v.locationDetail} onChange={(e) => setV({ ...v, locationDetail: e.target.value })} /></div>
        <div><Label>Orden</Label><Input className="mt-1.5" type="number" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })} /></div>
        <div className="sm:col-span-2 lg:col-span-4"><Label>Descripción</Label><Textarea className="mt-1.5" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={!dirty || !v.title || !v.slug} onClick={() => onSave(isNew ? { ...v, id: undefined } : v).then(() => isNew && setOpen(false))}><Save className="mr-1.5 h-4 w-4" />Guardar</Button>
        {isNew && <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>}
      </div>
    </div>
  );
}
