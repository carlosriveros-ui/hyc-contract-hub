import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Globe2 } from "lucide-react";
import { dateKey, pad, tzLabel, weekdayOf } from "@/lib/agenda/time";
import { cn } from "@/lib/utils";

const COMMON_TZ = [
  "America/Bogota", "America/Mexico_City", "America/Lima", "America/Guayaquil", "America/Panama",
  "America/Caracas", "America/Santiago", "America/Argentina/Buenos_Aires", "America/Sao_Paulo",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/Madrid", "Europe/London", "UTC",
];

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DOW = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function guessTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Bogota"; } catch { return "America/Bogota"; }
}

function allTimeZones(current: string): string[] {
  let list: string[] = COMMON_TZ;
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (sv) list = [...COMMON_TZ, ...sv("timeZone").filter((z) => !COMMON_TZ.includes(z))];
  } catch { /* navegador antiguo */ }
  return list.includes(current) ? list : [current, ...list];
}

export function formatTime(ms: number, tz: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(ms));
}

export function SlotPicker({
  slots, loading, timezone, onTimezoneChange, selected, onSelect,
}: {
  slots: string[];
  loading: boolean;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const byDay = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const iso of slots) {
      const ms = Date.parse(iso);
      const k = dateKey(ms, timezone);
      (m.get(k) ?? m.set(k, []).get(k)!).push(ms);
    }
    return m;
  }, [slots, timezone]);

  const days = useMemo(() => Array.from(byDay.keys()).sort(), [byDay]);
  const [day, setDay] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(() => dateKey(Date.now(), timezone).slice(0, 7));

  // Al cargar, abre el primer día con horarios.
  useEffect(() => {
    if (!days.length) return;
    if (!day || !byDay.has(day)) {
      const preferred = selected ? dateKey(Date.parse(selected), timezone) : days[0];
      const first = byDay.has(preferred) ? preferred : days[0];
      setDay(first);
      setMonth(first.slice(0, 7));
    }
  }, [days, byDay, day, selected, timezone]);

  const [y, m] = month.split("-").map(Number);
  const firstOfMonth = `${month}-01`;
  const lead = (weekdayOf(firstOfMonth) + 6) % 7; // semana empieza el lunes
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`)];
  const minMonth = dateKey(Date.now(), timezone).slice(0, 7);
  const maxMonth = days.length ? days[days.length - 1].slice(0, 7) : minMonth;
  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };
  const today = dateKey(Date.now(), timezone);
  const times = day ? byDay.get(day) ?? [] : [];
  const tzOptions = useMemo(() => allTimeZones(timezone), [timezone]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-2xl capitalize">{MONTHS[m - 1]} <span className="text-[var(--muted)]">{y}</span></h3>
          <div className="flex gap-1">
            <button type="button" aria-label="Mes anterior" disabled={month <= minMonth} onClick={() => shiftMonth(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Mes siguiente" disabled={month >= maxMonth} onClick={() => shiftMonth(1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DOW.map((d) => <div key={d} className="pb-1 font-mono text-[10px] tracking-widest text-[var(--muted)]">{d}</div>)}
          {cells.map((c, i) => {
            if (!c) return <div key={`e${i}`} />;
            const has = byDay.has(c);
            const isSel = c === day;
            return (
              <button
                key={c}
                type="button"
                disabled={!has}
                onClick={() => setDay(c)}
                aria-pressed={isSel}
                aria-label={`${Number(c.slice(8))} de ${MONTHS[m - 1]}${has ? `, ${byDay.get(c)!.length} horarios` : ", sin horarios"}`}
                className={cn(
                  "relative aspect-square rounded-xl text-sm font-medium transition",
                  has ? "bg-[var(--soft)] text-[var(--ink)] hover:ring-2 hover:ring-[var(--accent)]" : "text-[var(--muted)] opacity-40",
                  isSel && "bg-[var(--ink)] text-[var(--on-ink)] hover:ring-0",
                )}
              >
                {Number(c.slice(8))}
                {c === today && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
        {loading && <p className="mt-4 text-sm text-[var(--muted)]">Buscando espacios libres en el calendario…</p>}
        {!loading && !days.length && (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
            No hay horarios disponibles en este momento. Escríbeme por WhatsApp y buscamos un espacio.
          </p>
        )}
        <label className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">
          <Globe2 className="h-4 w-4 shrink-0" />
          <span className="sr-only">Zona horaria</span>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="w-full max-w-xs truncate rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-[var(--ink)]"
          >
            {tzOptions.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")} · {tzLabel(z)}</option>)}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {day ? new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)) : "Elige un día"}
        </p>
        <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
          {times.map((ms) => {
            const iso = new Date(ms).toISOString();
            const isSel = iso === selected;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelect(iso)}
                aria-pressed={isSel}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                  isSel
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]"
                    : "border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:border-[var(--accent)]",
                )}
              >
                {formatTime(ms, timezone)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

