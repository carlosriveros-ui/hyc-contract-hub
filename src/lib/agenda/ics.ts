// Lectura de calendarios ICS (Samsung vía Outlook/iCloud, calendarios secundarios, etc.)
// y generación del archivo .ics que recibe el invitado.

import type { Interval } from "./types.js";
import { addDays, pad, weekdayOf, zonedParts, zonedToUtc } from "./time.js";

interface RawEvent {
  props: Record<string, { value: string; params: Record<string, string> }[]>;
}

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function parseLine(line: string) {
  const colon = line.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  if (colon < 0) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...rawParams] = head.split(";");
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const [k, v = ""] = p.split("=");
    params[k.toUpperCase()] = v.replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), value, params };
}

function parseEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  let depth = 0;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") {
      current = { props: {} };
      depth = 0;
      continue;
    }
    if (!current) continue;
    if (line.startsWith("BEGIN:")) { depth++; continue; } // VALARM, etc.
    if (line.startsWith("END:") && depth > 0) { depth--; continue; }
    if (line === "END:VEVENT") {
      events.push(current);
      current = null;
      continue;
    }
    if (depth > 0) continue;
    const parsed = parseLine(line);
    if (!parsed) continue;
    (current.props[parsed.name] ??= []).push({ value: parsed.value, params: parsed.params });
  }
  return events;
}

interface IcsTime {
  ms: number;
  allDay: boolean;
  /** Fecha y hora local para expandir repeticiones. */
  localDate: string;
  localTime: string;
  tz: string;
}

function parseTime(value: string, params: Record<string, string>, fallbackTz: string): IcsTime | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mi, , z] = m;
  const localDate = `${y}-${mo}-${d}`;
  if (!hh || params.VALUE === "DATE") {
    return { ms: zonedToUtc(localDate, "00:00", fallbackTz), allDay: true, localDate, localTime: "00:00", tz: fallbackTz };
  }
  if (z) {
    const ms = Date.UTC(+y, +mo - 1, +d, +hh, +mi);
    return { ms, allDay: false, localDate, localTime: `${hh}:${mi}`, tz: "UTC" };
  }
  let tz = params.TZID || fallbackTz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = fallbackTz; // TZID propietario de Outlook ("SA Pacific Standard Time"), etc.
  }
  return { ms: zonedToUtc(localDate, `${hh}:${mi}`, tz), allDay: false, localDate, localTime: `${hh}:${mi}`, tz };
}

function parseDuration(value: string): number {
  const m = value.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, sign, w, d, h, mi, s] = m;
  const ms = ((+(w ?? 0) * 7 + +(d ?? 0)) * 86400 + +(h ?? 0) * 3600 + +(mi ?? 0) * 60 + +(s ?? 0)) * 1000;
  return sign === "-" ? -ms : ms;
}

const BYDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expand(start: IcsTime, rrule: string, rangeEnd: number, exdates: Set<number>): number[] {
  const rule: Record<string, string> = {};
  for (const part of rrule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) rule[k.toUpperCase()] = v;
  }
  const freq = rule.FREQ;
  const interval = Math.max(1, Number(rule.INTERVAL ?? 1));
  const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
  let until = Infinity;
  if (rule.UNTIL) {
    const u = parseTime(rule.UNTIL, {}, start.tz === "UTC" ? "UTC" : start.tz);
    if (u) until = u.allDay ? u.ms + 86400000 - 1 : u.ms;
  }
  const limit = Math.min(until, rangeEnd);
  const at = (date: string) => (start.tz === "UTC" ? Date.parse(`${date}T${start.localTime}:00Z`) : zonedToUtc(date, start.localTime, start.tz));

  const out: number[] = [];
  let produced = 0;
  const push = (ms: number) => {
    produced++;
    if (!exdates.has(ms)) out.push(ms);
  };

  if (freq === "DAILY" || freq === "WEEKLY") {
    const days = freq === "WEEKLY"
      ? (rule.BYDAY ? rule.BYDAY.split(",").map((d) => BYDAY[d.slice(-2)]).filter((d) => d !== undefined) : [weekdayOf(start.localDate)])
      : null;
    // Lunes de la semana de inicio (WKST=MO por defecto).
    const startWd = weekdayOf(start.localDate);
    const weekStart = addDays(start.localDate, -((startWd + 6) % 7));
    for (let i = 0; i < 3660 && produced < count; i++) {
      const date = addDays(start.localDate, i);
      const ms = at(date);
      if (ms > limit) break;
      if (freq === "DAILY") {
        if (i % interval !== 0) continue;
      } else {
        const weekIndex = Math.floor((Date.parse(date) - Date.parse(weekStart)) / (7 * 86400000));
        if (weekIndex % interval !== 0 || !days!.includes(weekdayOf(date))) continue;
      }
      push(ms);
    }
  } else if (freq === "MONTHLY" || freq === "YEARLY") {
    const [y, m, d] = start.localDate.split("-").map(Number);
    for (let i = 0; i < 600 && produced < count; i += interval) {
      const yy = freq === "YEARLY" ? y + i : y + Math.floor((m - 1 + i) / 12);
      const mm = freq === "YEARLY" ? m : ((m - 1 + i) % 12) + 1;
      const probe = new Date(Date.UTC(yy, mm - 1, d));
      if (probe.getUTCDate() !== d) continue; // p. ej. 31 en meses cortos
      const ms = at(`${yy}-${pad(mm)}-${pad(d)}`);
      if (ms > limit) break;
      push(ms);
    }
  } else {
    push(start.ms);
  }
  return out;
}

/**
 * Devuelve los intervalos ocupados de un calendario ICS dentro del rango.
 * Eventos "libres" (TRANSP:TRANSPARENT) y cancelados no bloquean.
 * Eventos de todo el día solo bloquean si están marcados explícitamente como ocupados.
 */
export function busyFromIcs(text: string, rangeStart: number, rangeEnd: number, fallbackTz: string): Interval[] {
  const events = parseEvents(text);
  const overrides = new Map<string, Set<number>>();
  for (const ev of events) {
    const rid = ev.props["RECURRENCE-ID"]?.[0];
    const uid = ev.props.UID?.[0]?.value;
    if (rid && uid) {
      const t = parseTime(rid.value, rid.params, fallbackTz);
      if (t) (overrides.get(uid) ?? overrides.set(uid, new Set()).get(uid)!).add(t.ms);
    }
  }

  const out: Interval[] = [];
  for (const ev of events) {
    const get = (k: string) => ev.props[k]?.[0];
    if ((get("STATUS")?.value ?? "").toUpperCase() === "CANCELLED") continue;
    const transp = (get("TRANSP")?.value ?? "").toUpperCase();
    if (transp === "TRANSPARENT") continue;
    const ds = get("DTSTART");
    if (!ds) continue;
    const start = parseTime(ds.value, ds.params, fallbackTz);
    if (!start) continue;
    if (start.allDay && transp !== "OPAQUE") continue;

    let duration: number;
    const de = get("DTEND");
    const du = get("DURATION");
    if (de) {
      const end = parseTime(de.value, de.params, fallbackTz);
      duration = end ? end.ms - start.ms : 0;
    } else if (du) {
      duration = parseDuration(du.value);
    } else {
      duration = start.allDay ? 86400000 : 0;
    }
    if (duration <= 0) continue;

    const exdates = new Set<number>();
    for (const ex of ev.props.EXDATE ?? []) {
      for (const v of ex.value.split(",")) {
        const t = parseTime(v, ex.params, fallbackTz);
        if (t) exdates.add(t.ms);
      }
    }
    const uid = get("UID")?.value;
    const isOverride = !!get("RECURRENCE-ID");
    if (uid && !isOverride) overrides.get(uid)?.forEach((ms) => exdates.add(ms));

    const rrule = get("RRULE")?.value;
    const starts = rrule && !isOverride ? expand(start, rrule, rangeEnd, exdates) : [start.ms];
    for (const s of starts) {
      const e = s + duration;
      if (e > rangeStart && s < rangeEnd) out.push({ start: s, end: e });
    }
  }
  return out;
}

// ── Generación ────────────────────────────────────────────────────────────────

function icsDate(ms: number): string {
  const p = zonedParts(ms, "UTC");
  return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}00Z`;
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

export interface IcsEventInput {
  uid: string;
  start: number;
  end: number;
  title: string;
  description: string;
  location: string;
  organizerName: string;
  organizerEmail?: string;
  url?: string;
  cancelled?: boolean;
  sequence?: number;
}

export function buildIcs(ev: IcsEventInput): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda Carlos Riveros//ES",
    "CALSCALE:GREGORIAN",
    `METHOD:${ev.cancelled ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(ev.start)}`,
    `DTEND:${icsDate(ev.end)}`,
    `SEQUENCE:${ev.sequence ?? 0}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    `LOCATION:${esc(ev.location)}`,
    ev.organizerEmail ? `ORGANIZER;CN=${esc(ev.organizerName)}:mailto:${ev.organizerEmail}` : "",
    ev.url ? `URL:${ev.url}` : "",
    `STATUS:${ev.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Enlace "Agregar a Google Calendar" (no requiere cuenta conectada). */
export function googleCalendarLink(ev: Pick<IcsEventInput, "start" | "end" | "title" | "description" | "location">): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${icsDate(ev.start)}/${icsDate(ev.end)}`,
    details: ev.description,
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
