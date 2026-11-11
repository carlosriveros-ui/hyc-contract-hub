import type { AgendaSettings, Interval } from "./types.js";
import { addDays, dateKey, minutesOf, timeOfMinutes, weekdayOf, zonedToUtc } from "./time.js";

export interface SlotInput {
  settings: Pick<
    AgendaSettings,
    "timezone" | "weeklyHours" | "bufferMinutes" | "minNoticeMinutes" | "maxDaysAhead" | "dailyLimit" | "slotStepMinutes" | "blockedDates"
  >;
  durationMinutes: number;
  /** Ocupado en Google, Samsung/ICS y reservas confirmadas. */
  busy: Interval[];
  /** Reservas confirmadas (para el límite diario). */
  bookings: Interval[];
  now: number;
  /** Rango opcional de fechas locales del dueño (inclusive). */
  from?: string;
  to?: string;
}

const MIN = 60_000;

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Calcula los inicios (ms UTC) de los horarios libres. */
export function computeSlots(input: SlotInput): number[] {
  const { settings, durationMinutes, busy, bookings, now } = input;
  const tz = settings.timezone;
  const buffer = Math.max(0, settings.bufferMinutes) * MIN;
  const step = Math.max(5, settings.slotStepMinutes || durationMinutes) * MIN;
  const duration = durationMinutes * MIN;
  const earliest = now + Math.max(0, settings.minNoticeMinutes) * MIN;

  const today = dateKey(now, tz);
  const lastDay = addDays(today, Math.max(0, settings.maxDaysAhead));
  const first = input.from && input.from > today ? input.from : today;
  const last = input.to && input.to < lastDay ? input.to : lastDay;

  const blocked = new Set(settings.blockedDates ?? []);
  // Ocupado ampliado con el colchón entre reuniones.
  const padded = busy.map((b) => ({ start: b.start - buffer, end: b.end + buffer }));

  const perDay = new Map<string, number>();
  for (const b of bookings) {
    const k = dateKey(b.start, tz);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const out: number[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) {
    if (blocked.has(day)) continue;
    if (settings.dailyLimit > 0 && (perDay.get(day) ?? 0) >= settings.dailyLimit) continue;
    const windows = settings.weeklyHours[String(weekdayOf(day))] ?? [];
    for (const w of windows) {
      const wStart = zonedToUtc(day, w.start, tz);
      const wEnd = zonedToUtc(day, w.end, tz);
      for (let s = wStart; s + duration <= wEnd; s += step) {
        if (s < earliest) continue;
        const slot = { start: s, end: s + duration };
        if (padded.some((b) => overlaps(slot, b))) continue;
        out.push(s);
      }
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/** Valida que un horario puntual siga libre (se usa al confirmar para evitar choques). */
export function isSlotAvailable(input: SlotInput, start: number): boolean {
  const day = dateKey(start, input.settings.timezone);
  return computeSlots({ ...input, from: day, to: day }).includes(start);
}

/** Normaliza ventanas de horario: ordena, descarta inválidas. */
export function normalizeWindows(windows: { start: string; end: string }[]) {
  return windows
    .filter((w) => /^\d{2}:\d{2}$/.test(w.start) && /^\d{2}:\d{2}$/.test(w.end) && minutesOf(w.end) > minutesOf(w.start))
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
    .map((w) => ({ start: timeOfMinutes(minutesOf(w.start)), end: timeOfMinutes(minutesOf(w.end)) }));
}
