// Utilidades de zona horaria sin dependencias (sirven en el navegador y en Vercel).
// Todas las horas se guardan en UTC (ms o ISO) y se convierten con Intl.

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = domingo … 6 = sábado
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(ms: number, tz: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of formatter(tz).formatToParts(new Date(ms))) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/** Diferencia (ms) entre la hora local de `tz` y UTC en el instante `ms`. */
export function tzOffsetMs(ms: number, tz: string): number {
  const p = zonedParts(ms, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(ms / 60000) * 60000;
}

/** Convierte una fecha/hora "de pared" en `tz` a milisegundos UTC. */
export function zonedToUtc(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - tzOffsetMs(guess, tz);
  // Segunda pasada para cruces de horario de verano.
  const second = guess - tzOffsetMs(result, tz);
  if (second !== result) result = second;
  return result;
}

export const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" del instante `ms` visto en `tz`. */
export function dateKey(ms: number, tz: string): string {
  const p = zonedParts(ms, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "HH:MM" del instante `ms` visto en `tz`. */
export function timeKey(ms: number, tz: string): string {
  const p = zonedParts(ms, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeOfMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Texto legible en español: "martes 18 de noviembre, 2:30 p. m." */
export function formatHuman(ms: number, tz: string, opts: { withDate?: boolean; withTime?: boolean } = {}): string {
  const { withDate = true, withTime = true } = opts;
  const o: Intl.DateTimeFormatOptions = { timeZone: tz };
  if (withDate) Object.assign(o, { weekday: "long", day: "numeric", month: "long" });
  if (withTime) Object.assign(o, { hour: "numeric", minute: "2-digit", hour12: true });
  return new Intl.DateTimeFormat("es-CO", o).format(new Date(ms));
}

/** Nombre corto de la zona: "hora de Colombia" / "GMT-5". */
export function tzLabel(tz: string, ms = Date.now()): string {
  try {
    const name = new Intl.DateTimeFormat("es-CO", { timeZone: tz, timeZoneName: "long" })
      .formatToParts(new Date(ms))
      .find((p) => p.type === "timeZoneName")?.value;
    return name ?? tz;
  } catch {
    return tz;
  }
}
