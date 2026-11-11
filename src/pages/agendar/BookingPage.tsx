import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Clock, Download, MapPin, MessageCircle, Phone, Video, Loader2 } from "lucide-react";
import { agendaApi, type PublicBooking } from "@/lib/agenda/client";
import type { AgendaEventType, LocationType, PublicAgenda } from "@/lib/agenda/types";
import { LOCATION_LABELS } from "@/lib/agenda/types";
import { buildIcs, googleCalendarLink } from "@/lib/agenda/ics";
import { formatHuman, tzLabel } from "@/lib/agenda/time";
import { waMeLink, whereText } from "@/lib/agenda/messages";
import { AgendaFrame, Pill, initials } from "./theme";
import { SlotPicker, guessTimeZone, formatTime } from "./SlotPicker";
import { cn } from "@/lib/utils";

const LOCATION_ICON: Record<LocationType, typeof Video> = { meet: Video, telefono: Phone, whatsapp: MessageCircle, presencial: MapPin };

export const COUNTRY_CODES = [
  ["57", "🇨🇴 +57"], ["52", "🇲🇽 +52"], ["51", "🇵🇪 +51"], ["593", "🇪🇨 +593"], ["507", "🇵🇦 +507"], ["56", "🇨🇱 +56"],
  ["54", "🇦🇷 +54"], ["58", "🇻🇪 +58"], ["1", "🇺🇸 +1"], ["34", "🇪🇸 +34"],
] as const;

type Step = 1 | 2 | 3 | 4;
const STEP_LABELS = ["Reunión", "Día y hora", "Tus datos", "¡Listo!"];

export function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function OwnerHeader({ settings, compact }: { settings: PublicAgenda["settings"]; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "" : "mb-2")}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--ink)] font-semibold text-[var(--on-ink)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--paper)]">
        {initials(settings.ownerName)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{settings.ownerName}</p>
        <p className="truncate text-sm text-[var(--muted)]">{settings.ownerTitle}</p>
      </div>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Pasos">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as Step;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={active ? "step" : undefined}>
            <span className={cn("h-1 rounded-full", done || active ? "bg-[var(--ink)]" : "bg-[var(--line)]", active && "bg-[var(--accent)]")} />
            <span className={cn("truncate font-mono text-[10px] uppercase tracking-[0.16em]", active ? "text-[var(--ink)]" : "hidden text-[var(--muted)] sm:block")}>
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ et, start, tz, onChange }: { et: AgendaEventType; start?: string | null; tz: string; onChange?: () => void }) {
  const Icon = LOCATION_ICON[et.locationType];
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{et.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{et.durationMinutes} min</span>
            <span className="inline-flex items-center gap-1.5"><Icon className="h-4 w-4" />{et.locationType === "presencial" && et.locationDetail ? et.locationDetail : LOCATION_LABELS[et.locationType]}</span>
          </div>
          {start && <p className="mt-2 text-sm font-medium first-letter:uppercase">{formatHuman(Date.parse(start), tz)} · <span className="text-[var(--muted)]">{tzLabel(tz)}</span></p>}
        </div>
        {onChange && <button type="button" onClick={onChange} className="shrink-0 text-sm font-medium underline underline-offset-4">Cambiar</button>}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--accent)]";
const labelCls = "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]";
export const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-[15px] font-semibold text-[var(--on-ink)] transition hover:opacity-90 disabled:opacity-50";
export const secondaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]";

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<PublicAgenda | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [et, setEt] = useState<AgendaEventType | null>(null);
  const [tz, setTz] = useState(guessTimeZone);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [start, setStart] = useState<string | null>(null);
  const [form, setForm] = useState({ guestName: "", guestEmail: "", cc: "57", phone: "", guestCompany: "", guestNotes: "", whatsappOptIn: true, website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ booking: PublicBooking; eventType: AgendaEventType } | null>(null);

  useEffect(() => {
    agendaApi.public()
      .then((a) => {
        setAgenda(a);
        document.title = `Agenda · ${a.settings.ownerName}`;
        const pre = slug ? a.eventTypes.find((e) => e.slug === slug) : a.eventTypes.length === 1 ? a.eventTypes[0] : undefined;
        if (pre) { setEt(pre); setStep(2); }
      })
      .catch((e) => setLoadError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!et) return;
    setSlotsLoading(true);
    setSlots([]);
    agendaApi.slots(et.id)
      .then((r) => setSlots(r.slots))
      .catch((e) => setError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [et]);

  const needsPhone = et?.locationType === "telefono" || et?.locationType === "whatsapp";
  const valid = form.guestName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.guestEmail.trim()) && (!needsPhone || form.phone.replace(/\D/g, "").length >= 7);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!et || !start || !valid) return;
    setSending(true);
    setError("");
    const digits = form.phone.replace(/\D/g, "");
    try {
      const r = await agendaApi.book({
        eventTypeId: et.id,
        startAt: start,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: digits ? `+${form.cc}${digits.replace(new RegExp(`^${form.cc}`), "")}` : "",
        guestCompany: form.guestCompany.trim(),
        guestNotes: form.guestNotes.trim(),
        guestTimezone: tz,
        whatsappOptIn: form.whatsappOptIn,
        website: form.website,
      });
      setDone(r);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError((err as Error).message);
      if (status === 409) {
        setStart(null);
        setStep(2);
        agendaApi.slots(et.id).then((r) => setSlots(r.slots)).catch(() => undefined);
      }
    } finally {
      setSending(false);
    }
  };

  if (loadError) {
    return (
      <AgendaFrame brand="carlos-riveros">
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="font-serif text-3xl">La agenda no está disponible</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{loadError}</p>
        </div>
      </AgendaFrame>
    );
  }
  if (!agenda) {
    return (
      <AgendaFrame brand="carlos-riveros">
        <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" /></div>
      </AgendaFrame>
    );
  }

  const s = agenda.settings;
  const [first, ...rest] = s.headline.split(" ");

  return (
    <AgendaFrame brand={s.brand}>
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:pt-12">
        <header className="mb-8 flex flex-col items-center text-center">
          <Pill>Agenda</Pill>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {first} <span className="font-serif font-normal italic text-[var(--accent)]">{rest.join(" ")}</span>
          </h1>
          <div className="mt-5"><OwnerHeader settings={s} /></div>
        </header>

        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_20px_60px_-30px_var(--ink)] backdrop-blur sm:p-8">
          <Steps step={step} />
          {error && <p role="alert" className="mb-4 rounded-xl bg-[var(--soft)] px-4 py-3 text-sm font-medium">{error}</p>}

          {step === 1 && (
            <div>
              <p className="mb-5 text-[15px] leading-relaxed text-[var(--muted)]">{s.welcome}</p>
              <div className="grid gap-3">
                {agenda.eventTypes.map((e) => {
                  const Icon = LOCATION_ICON[e.locationType];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => { setEt(e); setStart(null); setError(""); setStep(2); navigate(`/agendar/${e.slug}`, { replace: true }); }}
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-left transition hover:border-[var(--ink)]"
                    >
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--soft)]">
                        <span className="text-lg font-bold leading-none">{e.durationMinutes}<span className="block text-center font-mono text-[9px] tracking-widest text-[var(--muted)]">MIN</span></span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{e.title}</span>
                        {e.description && <span className="mt-0.5 block text-sm text-[var(--muted)]">{e.description}</span>}
                        <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[var(--muted)]"><Icon className="h-3.5 w-3.5" />{e.locationType === "presencial" && e.locationDetail ? e.locationDetail : LOCATION_LABELS[e.locationType]}</span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
                    </button>
                  );
                })}
                {!agenda.eventTypes.length && <p className="text-sm text-[var(--muted)]">Aún no hay tipos de reunión activos.</p>}
              </div>
            </div>
          )}

          {step === 2 && et && (
            <div className="grid gap-5">
              <Summary et={et} tz={tz} onChange={agenda.eventTypes.length > 1 ? () => { setStep(1); navigate("/agendar", { replace: true }); } : undefined} />
              <SlotPicker slots={slots} loading={slotsLoading} timezone={tz} onTimezoneChange={setTz} selected={start} onSelect={(iso) => { setStart(iso); setError(""); }} />
              <div className="flex justify-end">
                <button type="button" disabled={!start} onClick={() => setStep(3)} className={primaryBtn}>
                  {start ? `Continuar con ${formatTime(Date.parse(start), tz)}` : "Elige una hora"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && et && start && (
            <form onSubmit={submit} className="grid gap-4" noValidate>
              <Summary et={et} start={start} tz={tz} onChange={() => setStep(2)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelCls}>Nombre *</span>
                  <input className={inputCls} autoComplete="name" required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
                </label>
                <label>
                  <span className={labelCls}>Correo *</span>
                  <input className={inputCls} type="email" autoComplete="email" inputMode="email" required value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
                </label>
                <div>
                  <span className={labelCls}>WhatsApp {needsPhone ? "*" : ""}</span>
                  <div className="flex gap-2">
                    <select aria-label="Indicativo" className={cn(inputCls, "w-[104px] shrink-0 px-2")} value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })}>
                      {COUNTRY_CODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input aria-label="Número de WhatsApp" className={inputCls} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="300 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <label className="sm:col-span-2">
                  <span className={labelCls}>Empresa</span>
                  <input className={inputCls} autoComplete="organization" value={form.guestCompany} onChange={(e) => setForm({ ...form, guestCompany: e.target.value })} />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelCls}>¿De qué quieres hablar?</span>
                  <textarea className={cn(inputCls, "min-h-[96px] resize-y")} value={form.guestNotes} onChange={(e) => setForm({ ...form, guestNotes: e.target.value })} placeholder="Cuéntame brevemente tu proyecto o pregunta para llegar preparado." />
                </label>
                <label className="hidden" aria-hidden>
                  Sitio web <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-xl bg-[var(--soft)] p-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--ink)]" checked={form.whatsappOptIn} onChange={(e) => setForm({ ...form, whatsappOptIn: e.target.checked })} />
                <span>Quiero recibir la confirmación y los recordatorios por WhatsApp (además del correo).</span>
              </label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep(2)} className={secondaryBtn}><ArrowLeft className="h-4 w-4" />Atrás</button>
                <button type="submit" disabled={!valid || sending} className={primaryBtn}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {sending ? "Confirmando…" : "Confirmar reserva"}
                </button>
              </div>
            </form>
          )}

          {step === 4 && done && <Confirmation agenda={agenda} done={done} tz={tz} />}
        </section>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Horarios sincronizados con el calendario de {s.ownerName.split(" ")[0]} · sin cruces
        </p>
      </main>
    </AgendaFrame>
  );
}

function Confirmation({ agenda, done, tz }: { agenda: PublicAgenda; done: { booking: PublicBooking; eventType: AgendaEventType }; tz: string }) {
  const { booking: b, eventType: et } = done;
  const s = agenda.settings;
  const start = Date.parse(b.startAt);
  const end = Date.parse(b.endAt);
  const manageUrl = `${window.location.origin}/agendar/reserva/${b.token}`;
  const where = whereText({ eventType: et, booking: b, settings: { ownerName: s.ownerName, timezone: s.timezone } });
  const title = `${et.title} con ${s.ownerName}`;
  const ev = { start, end, title, description: `${where}\n\nReprogramar o cancelar: ${manageUrl}`, location: where };
  const waText = `Hola ${s.ownerName.split(" ")[0]}, acabo de agendar "${et.title}" para el ${formatHuman(start, s.timezone)}. Soy ${b.guestName}.`;
  const items = useMemo(() => [
    ["Cuándo", `${formatHuman(start, tz)} (${tzLabel(tz, start)})`],
    ["Dónde", where],
    ["Confirmación", b.guestEmail + (b.guestPhone ? ` · WhatsApp +${b.guestPhone}` : "")],
  ], [start, tz, where, b.guestEmail, b.guestPhone]);

  return (
    <div className="text-center">
      <div className="mx-auto grid h-20 w-20 animate-in zoom-in-50 place-items-center rounded-full bg-[var(--ink)] text-[var(--on-ink)] ring-8 ring-[var(--soft)] duration-500">
        <Check className="h-10 w-10" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-3xl font-bold">¡Listo, <span className="font-serif font-normal italic text-[var(--accent)]">quedó agendada!</span></h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-[var(--muted)]">
        Te enviamos la confirmación{b.whatsappOptIn && b.guestPhone ? " por correo y WhatsApp" : " por correo"}. Te recordaremos un día antes y una hora antes.
      </p>
      <dl className="mx-auto mt-6 max-w-lg divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--card)] text-left">
        <div className="px-4 py-3"><dt className={labelCls}>Reunión</dt><dd className="font-semibold">{et.title} · {et.durationMinutes} min</dd></div>
        {items.map(([k, v]) => <div key={k} className="px-4 py-3"><dt className={labelCls}>{k}</dt><dd className={cn("break-words text-[15px]", k === "Cuándo" && "first-letter:uppercase")}>{v}</dd></div>)}
      </dl>
      <div className="mx-auto mt-6 grid max-w-lg gap-2 sm:grid-cols-2">
        {b.meetUrl && <a href={b.meetUrl} target="_blank" rel="noreferrer" className={cn(primaryBtn, "sm:col-span-2")}><Video className="h-4 w-4" />Enlace de Google Meet</a>}
        <a href={googleCalendarLink(ev)} target="_blank" rel="noreferrer" className={secondaryBtn}><CalendarPlus className="h-4 w-4" />Google Calendar</a>
        <button type="button" className={secondaryBtn} onClick={() => downloadIcs("reunion.ics", buildIcs({ uid: `${b.id}@agenda`, ...ev, organizerName: s.ownerName, url: manageUrl }))}>
          <Download className="h-4 w-4" />Samsung / Outlook / Apple
        </button>
        {s.ownerWhatsapp && <a href={waMeLink(s.ownerWhatsapp, waText)} target="_blank" rel="noreferrer" className={secondaryBtn}><MessageCircle className="h-4 w-4" />Escribir por WhatsApp</a>}
        <Link to={`/agendar/reserva/${b.token}`} className={cn(secondaryBtn, !s.ownerWhatsapp && "sm:col-span-2")}>Reprogramar o cancelar</Link>
      </div>
    </div>
  );
}
