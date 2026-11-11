import { describe, it, expect } from "vitest";
import { zonedToUtc, dateKey, timeKey, addDays, weekdayOf } from "./time";
import { computeSlots, isSlotAvailable } from "./slots";
import { busyFromIcs, buildIcs } from "./ics";
import { normalizePhone, buildEmail, whatsappTemplate } from "./messages";
import { buildTheme } from "./theme";
import marcas from "../../../videos/marcas.json";
import { DEFAULT_SETTINGS } from "./types";

const TZ = "America/Bogota";
const settings = {
  ...DEFAULT_SETTINGS,
  weeklyHours: { "2": [{ start: "14:00", end: "17:00" }], "4": [{ start: "14:00", end: "17:00" }] },
  bufferMinutes: 15,
  minNoticeMinutes: 24 * 60,
  maxDaysAhead: 14,
  dailyLimit: 0,
  slotStepMinutes: 30,
};
// Lunes 16-nov-2026 08:00 en Bogotá.
const NOW = zonedToUtc("2026-11-16", "08:00", TZ);

describe("time", () => {
  it("convierte hora de Bogotá a UTC (UTC-5)", () => {
    expect(new Date(zonedToUtc("2026-11-17", "14:00", TZ)).toISOString()).toBe("2026-11-17T19:00:00.000Z");
    expect(dateKey(Date.parse("2026-11-18T03:00:00Z"), TZ)).toBe("2026-11-17");
    expect(timeKey(Date.parse("2026-11-17T19:30:00Z"), TZ)).toBe("14:30");
  });
  it("maneja horario de verano", () => {
    // 8-mar-2026: Nueva York salta de 2:00 a 3:00.
    expect(new Date(zonedToUtc("2026-03-09", "09:00", "America/New_York")).toISOString()).toBe("2026-03-09T13:00:00.000Z");
    expect(new Date(zonedToUtc("2026-03-06", "09:00", "America/New_York")).toISOString()).toBe("2026-03-06T14:00:00.000Z");
  });
  it("suma días y calcula el día de la semana", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayOf("2026-11-17")).toBe(2);
  });
});

describe("computeSlots", () => {
  it("genera horarios solo martes y jueves de 2 a 5 p. m., respetando la anticipación", () => {
    const slots = computeSlots({ settings, durationMinutes: 30, busy: [], bookings: [], now: NOW });
    const keys = slots.map((s) => `${dateKey(s, TZ)} ${timeKey(s, TZ)}`);
    expect(keys[0]).toBe("2026-11-17 14:00");
    expect(keys).toContain("2026-11-17 16:30");
    expect(keys).not.toContain("2026-11-17 17:00");
    expect(new Set(keys.map((k) => weekdayOf(k.slice(0, 10))))).toEqual(new Set([2, 4]));
  });

  it("no ofrece horas que chocan con Google/Samsung (con colchón de 15 min)", () => {
    const busy = [{ start: zonedToUtc("2026-11-17", "15:00", TZ), end: zonedToUtc("2026-11-17", "15:30", TZ) }];
    const slots = computeSlots({ settings, durationMinutes: 30, busy, bookings: [], now: NOW, from: "2026-11-17", to: "2026-11-17" });
    expect(slots.map((s) => timeKey(s, TZ))).toEqual(["14:00", "16:00", "16:30"]);
  });

  it("respeta fechas bloqueadas y el límite diario", () => {
    const blocked = computeSlots({ settings: { ...settings, blockedDates: ["2026-11-17"] }, durationMinutes: 30, busy: [], bookings: [], now: NOW, from: "2026-11-17", to: "2026-11-17" });
    expect(blocked).toEqual([]);
    const b = { start: zonedToUtc("2026-11-17", "14:00", TZ), end: zonedToUtc("2026-11-17", "14:30", TZ) };
    const limited = computeSlots({ settings: { ...settings, dailyLimit: 1 }, durationMinutes: 30, busy: [b], bookings: [b], now: NOW, from: "2026-11-17", to: "2026-11-17" });
    expect(limited).toEqual([]);
  });

  it("isSlotAvailable rechaza horas ocupadas o fuera de horario", () => {
    const input = { settings, durationMinutes: 60, busy: [], bookings: [], now: NOW };
    expect(isSlotAvailable(input, zonedToUtc("2026-11-17", "14:00", TZ))).toBe(true);
    expect(isSlotAvailable(input, zonedToUtc("2026-11-17", "16:30", TZ))).toBe(false);
    expect(isSlotAvailable(input, zonedToUtc("2026-11-18", "14:00", TZ))).toBe(false);
  });
});

describe("busyFromIcs", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:a",
    "DTSTART;TZID=America/Bogota:20261117T150000",
    "DTEND;TZID=America/Bogota:20261117T160000",
    "SUMMARY:Obra",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:b",
    "DTSTART:20261119T190000Z",
    "DURATION:PT45M",
    "RRULE:FREQ=WEEKLY;BYDAY=TH;COUNT=3",
    "EXDATE:20261126T190000Z",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:c",
    "DTSTART;VALUE=DATE:20261118",
    "DTEND;VALUE=DATE:20261119",
    "SUMMARY:Cumpleaños",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:d",
    "DTSTART:20261117T200000Z",
    "DTEND:20261117T210000Z",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  it("lee eventos con zona, repeticiones y excepciones; ignora libres y de todo el día", () => {
    const busy = busyFromIcs(ics, Date.parse("2026-11-16T00:00:00Z"), Date.parse("2026-12-31T00:00:00Z"), TZ);
    const iso = busy.map((b) => new Date(b.start).toISOString()).sort();
    expect(iso).toEqual([
      "2026-11-17T20:00:00.000Z",
      "2026-11-19T19:00:00.000Z",
      "2026-12-03T19:00:00.000Z",
    ].sort());
  });

  it("genera un .ics válido", () => {
    const out = buildIcs({ uid: "x@agenda", start: Date.parse("2026-11-17T19:00:00Z"), end: Date.parse("2026-11-17T19:30:00Z"), title: "Reunión, prueba", description: "Línea 1\nLínea 2", location: "Google Meet", organizerName: "Carlos" });
    expect(out).toContain("DTSTART:20261117T190000Z");
    expect(out).toContain("SUMMARY:Reunión\\, prueba");
    const back = busyFromIcs(out, 0, Date.parse("2030-01-01"), TZ);
    expect(back).toHaveLength(1);
  });
});

describe("mensajes", () => {
  it("normaliza celulares colombianos", () => {
    expect(normalizePhone("300 123 4567")).toBe("573001234567");
    expect(normalizePhone("+1 (305) 555-1234")).toBe("13055551234");
    expect(normalizePhone("")).toBe("");
  });

  it("arma correo y plantilla de WhatsApp con la marca", () => {
    const theme = buildTheme(marcas as never, "carlos-riveros");
    const ctx = {
      kind: "confirmacion" as const,
      settings: { ownerName: "Carlos Riveros", timezone: TZ },
      eventType: { title: "Reunión de 30 min", durationMinutes: 30, locationType: "meet" as const, locationDetail: "" },
      booking: { startAt: "2026-11-17T19:00:00Z", endAt: "2026-11-17T19:30:00Z", guestName: "Ana Pérez", guestEmail: "ana@example.com", guestPhone: "573001234567", guestCompany: "", guestNotes: "", guestTimezone: TZ, meetUrl: "https://meet.google.com/abc", cancelReason: null },
      theme,
      manageUrl: "https://x/agendar/reserva/t",
    };
    const email = buildEmail(ctx);
    expect(email.subject).toMatch(/^Confirmada: Reunión de 30 min/);
    expect(email.html).toContain(marcas["carlos-riveros"].fondo);
    expect(email.html).toContain("https://meet.google.com/abc");
    const wa = whatsappTemplate(ctx)!;
    expect(wa.name).toBe("agenda_confirmacion");
    expect(wa.params[0]).toBe("Ana");
  });
});
