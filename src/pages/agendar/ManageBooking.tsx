import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock, Check, Loader2, Video, X } from "lucide-react";
import { agendaApi, type PublicBooking } from "@/lib/agenda/client";
import type { AgendaEventType, PublicAgenda } from "@/lib/agenda/types";
import { STATUS_LABELS } from "@/lib/agenda/types";
import { formatHuman, tzLabel } from "@/lib/agenda/time";
import { whereText } from "@/lib/agenda/messages";
import { AgendaFrame, Pill } from "./theme";
import { SlotPicker, guessTimeZone, formatTime } from "./SlotPicker";
import { OwnerHeader, primaryBtn, secondaryBtn } from "./BookingPage";
import { cn } from "@/lib/utils";

type Mode = "ver" | "reprogramar" | "cancelar";

export default function ManageBooking() {
  const { token = "" } = useParams();
  const [data, setData] = useState<{ booking: PublicBooking; eventType: AgendaEventType; settings: PublicAgenda["settings"] } | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("ver");
  const [tz, setTz] = useState(guessTimeZone);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [start, setStart] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    agendaApi.booking(token)
      .then((d) => { setData(d); setTz(d.booking.guestTimezone || guessTimeZone()); document.title = `Tu reunión · ${d.settings.ownerName}`; })
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (mode !== "reprogramar" || !data) return;
    setSlotsLoading(true);
    agendaApi.slots(data.eventType.id, token)
      .then((r) => setSlots(r.slots))
      .catch((e) => setError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [mode, data, token]);

  if (error && !data) {
    return (
      <AgendaFrame brand="carlos-riveros">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="font-serif text-3xl">No encontramos esta reserva</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
          <Link to="/agendar" className={cn(primaryBtn, "mt-6")}>Agendar una reunión</Link>
        </div>
      </AgendaFrame>
    );
  }
  if (!data) {
    return <AgendaFrame brand="carlos-riveros"><div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" /></div></AgendaFrame>;
  }

  const { booking: b, eventType: et, settings: s } = data;
  const startMs = Date.parse(b.startAt);
  const active = b.status === "confirmada" && startMs > Date.now();
  const where = whereText({ eventType: et, booking: b, settings: { ownerName: s.ownerName, timezone: s.timezone } });

  const doReschedule = async () => {
    if (!start) return;
    setBusy(true); setError("");
    try {
      const r = await agendaApi.reschedule(token, start);
      setData({ ...data, booking: { ...b, ...r.booking } });
      setMode("ver"); setStart(null);
      setNotice("Listo: la reunión quedó con la nueva fecha. Te enviamos la confirmación.");
    } catch (e) {
      setError((e as Error).message);
      if ((e as { status?: number }).status === 409) agendaApi.slots(et.id, token).then((r) => setSlots(r.slots)).catch(() => undefined);
    } finally { setBusy(false); }
  };

  const doCancel = async () => {
    setBusy(true); setError("");
    try {
      const r = await agendaApi.cancel(token, reason);
      setData({ ...data, booking: { ...b, ...r.booking } });
      setMode("ver");
      setNotice("La reunión fue cancelada y el horario quedó libre.");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <AgendaFrame brand={s.brand}>
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:pt-12">
        <header className="mb-8 flex flex-col items-center text-center">
          <Pill>Tu reunión</Pill>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {et.title.split(" ")[0]} <span className="font-serif font-normal italic text-[var(--accent)]">{et.title.split(" ").slice(1).join(" ")}</span>
          </h1>
          <div className="mt-5"><OwnerHeader settings={s} /></div>
        </header>

        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_20px_60px_-30px_var(--ink)] sm:p-8">
          {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--soft)] px-4 py-3 text-sm font-medium"><Check className="h-4 w-4 shrink-0" />{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-[var(--soft)] px-4 py-3 text-sm font-medium">{error}</p>}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold first-letter:uppercase">{formatHuman(startMs, tz)}</p>
              <p className="text-sm text-[var(--muted)]">{et.durationMinutes} min · {tzLabel(tz, startMs)}</p>
              <p className="mt-1 text-sm">{where}</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest",
              b.status === "confirmada" ? "bg-[var(--ink)] text-[var(--on-ink)]" : "bg-[var(--soft)] text-[var(--ink)]")}>
              {STATUS_LABELS[b.status]}
            </span>
          </div>

          {mode === "ver" && (
            <div className="grid gap-2 sm:grid-cols-3">
              {active && b.meetUrl && <a href={b.meetUrl} target="_blank" rel="noreferrer" className={primaryBtn}><Video className="h-4 w-4" />Unirme</a>}
              {active && <button type="button" className={secondaryBtn} onClick={() => { setMode("reprogramar"); setNotice(""); }}><CalendarClock className="h-4 w-4" />Reprogramar</button>}
              {active && <button type="button" className={secondaryBtn} onClick={() => { setMode("cancelar"); setNotice(""); }}><X className="h-4 w-4" />Cancelar</button>}
              {!active && <Link to={`/agendar/${et.slug}`} className={cn(primaryBtn, "sm:col-span-3")}>Agendar una nueva reunión</Link>}
            </div>
          )}

          {mode === "reprogramar" && (
            <div className="grid gap-5">
              <SlotPicker slots={slots} loading={slotsLoading} timezone={tz} onTimezoneChange={setTz} selected={start} onSelect={setStart} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" className={secondaryBtn} onClick={() => setMode("ver")}>Volver</button>
                <button type="button" className={primaryBtn} disabled={!start || busy} onClick={doReschedule}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {start ? `Mover a ${formatHuman(Date.parse(start), tz, { withTime: false })}, ${formatTime(Date.parse(start), tz)}` : "Elige la nueva hora"}
                </button>
              </div>
            </div>
          )}

          {mode === "cancelar" && (
            <div className="grid gap-4">
              <label>
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Motivo (opcional)</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[96px] w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-[15px] outline-none focus:border-[var(--ink)]" />
              </label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" className={secondaryBtn} onClick={() => setMode("ver")}>No, mantener</button>
                <button type="button" className={primaryBtn} disabled={busy} onClick={doCancel}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sí, cancelar reunión
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </AgendaFrame>
  );
}
