// Agenda de reuniones: página pública /agendar y panel /agenda.
// Una sola función con ?action=… para no gastar el cupo de funciones de Vercel.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  HttpError, allBusy, appendLog, db, deleteGoogleEvent, googleConfigured, googleRedirectUri, GOOGLE_SCOPES,
  integrationStatus, loadEventTypes, loadSettings, newToken, notify, publicBaseUrl, requireAdmin,
  saveGoogleCode, signState, upsertGoogleEvent, verifyState,
} from "./_lib/agenda-server.js";
import { computeSlots, isSlotAvailable, normalizeWindows } from "../src/lib/agenda/slots.js";
import { addDays, dateKey, isValidTimeZone, zonedToUtc } from "../src/lib/agenda/time.js";
import { normalizePhone } from "../src/lib/agenda/messages.js";
import type { AgendaBooking, AgendaEventType, AgendaSettings, BookingStatus, PublicAgenda } from "../src/lib/agenda/types.js";

const DAY = 86_400_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function body(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return (req.body ?? {}) as Record<string, unknown>;
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function publicBooking(b: AgendaBooking) {
  const { googleEventId, notifyLog, reminder1hAt, reminder24hAt, ...rest } = b as AgendaBooking & { notifyLog?: unknown };
  void googleEventId; void notifyLog; void reminder1hAt; void reminder24hAt;
  return rest;
}

async function eventTypeById(id: string, mustBeActive = true): Promise<AgendaEventType> {
  const { data, error } = await db().from("agenda_event_types").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data || (mustBeActive && !data.active)) throw new HttpError(404, "Tipo de reunión no disponible");
  return data as AgendaEventType;
}

async function bookingByToken(token: string): Promise<AgendaBooking> {
  if (!/^[a-f0-9]{20,64}$/.test(token)) throw new HttpError(404, "Reserva no encontrada");
  const { data, error } = await db().from("agenda_bookings").select("*").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Reserva no encontrada");
  return data as AgendaBooking;
}

/** Comprueba en vivo (Google + ICS + reservas) que el horario sigue libre. */
async function assertFree(s: AgendaSettings, duration: number, start: number, excludeId?: string) {
  const { busy, bookings } = await allBusy(start - DAY, start + 2 * DAY, s.timezone, excludeId);
  const ok = isSlotAvailable({ settings: s, durationMinutes: duration, busy, bookings, now: Date.now() }, start);
  if (!ok) throw new HttpError(409, "Ese horario acaba de ocuparse. Elige otro, por favor.");
}

// ── Acciones públicas ─────────────────────────────────────────────────────────

async function getPublic(): Promise<PublicAgenda> {
  const [s, eventTypes] = await Promise.all([loadSettings(), loadEventTypes(true)]);
  return {
    settings: {
      ownerName: s.ownerName, ownerTitle: s.ownerTitle, headline: s.headline, welcome: s.welcome,
      brand: s.brand, timezone: s.timezone, maxDaysAhead: s.maxDaysAhead, ownerWhatsapp: s.ownerWhatsapp,
    },
    eventTypes,
  };
}

async function getSlots(req: VercelRequest) {
  const s = await loadSettings();
  const et = await eventTypeById(str(req.query.eventTypeId, 64));
  let excludeId: string | undefined;
  if (req.query.token) excludeId = (await bookingByToken(str(req.query.token, 64))).id;
  const now = Date.now();
  const today = dateKey(now, s.timezone);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.from)) ? String(req.query.from) : today;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to)) ? String(req.query.to) : addDays(today, s.maxDaysAhead);
  const rangeStart = Math.max(now, zonedToUtc(from, "00:00", s.timezone)) - DAY;
  const rangeEnd = zonedToUtc(addDays(to, 1), "00:00", s.timezone) + DAY;
  if (rangeEnd - rangeStart > 100 * DAY) throw new HttpError(400, "Rango demasiado amplio");
  const { busy, bookings } = await allBusy(rangeStart, rangeEnd, s.timezone, excludeId);
  const slots = computeSlots({ settings: s, durationMinutes: et.durationMinutes, busy, bookings, now, from, to });
  return { timezone: s.timezone, slots: slots.map((ms) => new Date(ms).toISOString()) };
}

async function book(req: VercelRequest) {
  const b = body(req);
  if (str(b.website)) throw new HttpError(400, "Solicitud inválida"); // trampa anti-bots
  const guestName = str(b.guestName, 120);
  const guestEmail = str(b.guestEmail, 160).toLowerCase();
  const guestPhone = normalizePhone(str(b.guestPhone, 30));
  if (guestName.length < 2) throw new HttpError(400, "Escribe tu nombre");
  if (!EMAIL_RE.test(guestEmail)) throw new HttpError(400, "Correo inválido");
  if (guestPhone && (guestPhone.length < 10 || guestPhone.length > 15)) throw new HttpError(400, "Número de WhatsApp inválido");
  const guestTimezone = isValidTimeZone(str(b.guestTimezone, 60)) ? str(b.guestTimezone, 60) : "America/Bogota";

  const s = await loadSettings();
  const et = await eventTypeById(str(b.eventTypeId, 64));
  if ((et.locationType === "telefono" || et.locationType === "whatsapp") && !guestPhone) {
    throw new HttpError(400, "Para esta reunión necesitamos tu número de WhatsApp");
  }
  const start = Date.parse(str(b.startAt, 40));
  if (!Number.isFinite(start)) throw new HttpError(400, "Horario inválido");
  await assertFree(s, et.durationMinutes, start);

  const row = {
    eventTypeId: et.id,
    startAt: new Date(start).toISOString(),
    endAt: new Date(start + et.durationMinutes * 60_000).toISOString(),
    guestName,
    guestEmail,
    guestPhone,
    guestCompany: str(b.guestCompany, 160),
    guestNotes: str(b.guestNotes, 1500),
    guestTimezone,
    whatsappOptIn: b.whatsappOptIn !== false && !!guestPhone,
    status: "confirmada" as BookingStatus,
    token: newToken(),
  };
  const { data, error } = await db().from("agenda_bookings").insert(row).select().single();
  if (error) {
    if (error.code === "23P01") throw new HttpError(409, "Ese horario acaba de ocuparse. Elige otro, por favor.");
    throw error;
  }
  let booking = data as AgendaBooking;
  const base = publicBaseUrl(req);
  const manageUrl = `${base}/agendar/reserva/${booking.token}`;

  const g = await upsertGoogleEvent(booking, et, s, manageUrl).catch((e) => { console.error(e); return null; });
  if (g) booking = { ...booking, googleEventId: g.id, meetUrl: g.meetUrl };

  const [guest, owner] = await Promise.all([
    notify("confirmacion", booking, et, s, base),
    notify("aviso_dueno", booking, et, s, base),
  ]);
  await appendLog(booking.id, [...guest, ...owner], g ? { googleEventId: g.id, meetUrl: g.meetUrl } : {});
  return { booking: publicBooking(booking), eventType: et };
}

async function getBooking(req: VercelRequest) {
  const b = await bookingByToken(str(req.query.token, 64));
  const [et, pub] = await Promise.all([eventTypeById(b.eventTypeId, false), getPublic()]);
  return { booking: publicBooking(b), eventType: et, settings: pub.settings };
}

async function cancel(req: VercelRequest, byAdmin = false) {
  const p = body(req);
  let b: AgendaBooking;
  if (byAdmin) {
    const { data } = await db().from("agenda_bookings").select("*").eq("id", str(p.id, 64)).maybeSingle();
    if (!data) throw new HttpError(404, "Reserva no encontrada");
    b = data as AgendaBooking;
  } else {
    b = await bookingByToken(str(p.token, 64));
  }
  if (b.status !== "confirmada") throw new HttpError(400, "La reserva ya no está activa");
  if (!byAdmin && Date.parse(b.startAt) < Date.now()) throw new HttpError(400, "La reunión ya pasó");
  const reason = str(p.reason, 500) || null;
  const { error } = await db().from("agenda_bookings").update({ status: "cancelada", cancelReason: reason }).eq("id", b.id);
  if (error) throw error;
  const updated = { ...b, status: "cancelada" as BookingStatus, cancelReason: reason };
  const [s, et] = await Promise.all([loadSettings(), eventTypeById(b.eventTypeId, false)]);
  if (b.googleEventId) await deleteGoogleEvent(b.googleEventId);
  const base = publicBaseUrl(req);
  const logs = await Promise.all([
    notify("cancelacion", updated, et, s, base),
    byAdmin ? Promise.resolve([]) : notify("aviso_dueno_cancelacion", updated, et, s, base),
  ]);
  await appendLog(b.id, logs.flat());
  return { booking: publicBooking(updated) };
}

async function reschedule(req: VercelRequest) {
  const p = body(req);
  const b = await bookingByToken(str(p.token, 64));
  if (b.status !== "confirmada") throw new HttpError(400, "La reserva ya no está activa");
  const [s, et] = await Promise.all([loadSettings(), eventTypeById(b.eventTypeId, false)]);
  const start = Date.parse(str(p.startAt, 40));
  if (!Number.isFinite(start)) throw new HttpError(400, "Horario inválido");
  await assertFree(s, et.durationMinutes, start, b.id);
  const patch = {
    startAt: new Date(start).toISOString(),
    endAt: new Date(start + et.durationMinutes * 60_000).toISOString(),
    reminder24hAt: null,
    reminder1hAt: null,
  };
  const { error } = await db().from("agenda_bookings").update(patch).eq("id", b.id);
  if (error) {
    if (error.code === "23P01") throw new HttpError(409, "Ese horario acaba de ocuparse. Elige otro, por favor.");
    throw error;
  }
  let updated: AgendaBooking = { ...b, ...patch };
  const base = publicBaseUrl(req);
  const g = await upsertGoogleEvent(updated, et, s, `${base}/agendar/reserva/${b.token}`).catch(() => null);
  if (g) updated = { ...updated, googleEventId: g.id, meetUrl: g.meetUrl };
  const logs = await Promise.all([
    notify("reprogramacion", updated, et, s, base),
    notify("aviso_dueno_reprogramacion", updated, et, s, base),
  ]);
  await appendLog(b.id, logs.flat(), g ? { googleEventId: g.id, meetUrl: g.meetUrl } : {});
  return { booking: publicBooking(updated) };
}

// ── Acciones de administración ────────────────────────────────────────────────

async function getAdmin() {
  const since = new Date(Date.now() - 60 * DAY).toISOString();
  const [settings, eventTypes, bookings, status] = await Promise.all([
    loadSettings(),
    loadEventTypes(false),
    db().from("agenda_bookings").select("*").gte("startAt", since).order("startAt").then(({ data, error }) => {
      if (error) throw error;
      return data ?? [];
    }),
    integrationStatus(),
  ]);
  return { settings, eventTypes, bookings, status };
}

const NUM_FIELDS = ["bufferMinutes", "minNoticeMinutes", "maxDaysAhead", "dailyLimit", "slotStepMinutes"] as const;
const TEXT_FIELDS = ["ownerName", "ownerTitle", "headline", "welcome", "ownerEmail"] as const;

async function saveSettings(req: VercelRequest) {
  const p = body(req);
  const patch: Record<string, unknown> = { id: "default", updatedAt: new Date().toISOString() };
  for (const k of TEXT_FIELDS) if (k in p) patch[k] = str(p[k], 1000);
  for (const k of NUM_FIELDS) if (k in p) patch[k] = Math.max(0, Math.min(100_000, Math.round(Number(p[k]) || 0)));
  if ("brand" in p) patch.brand = p.brand === "hyc" ? "hyc" : "carlos-riveros";
  if ("timezone" in p) {
    if (!isValidTimeZone(str(p.timezone, 60))) throw new HttpError(400, "Zona horaria inválida");
    patch.timezone = str(p.timezone, 60);
  }
  if ("ownerWhatsapp" in p) patch.ownerWhatsapp = normalizePhone(str(p.ownerWhatsapp, 30));
  if ("blockedDates" in p && Array.isArray(p.blockedDates)) {
    patch.blockedDates = (p.blockedDates as unknown[]).map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  }
  if ("weeklyHours" in p && p.weeklyHours && typeof p.weeklyHours === "object") {
    const wh: Record<string, { start: string; end: string }[]> = {};
    for (let d = 0; d < 7; d++) {
      const w = normalizeWindows(((p.weeklyHours as Record<string, unknown>)[String(d)] as { start: string; end: string }[]) ?? []);
      if (w.length) wh[String(d)] = w;
    }
    patch.weeklyHours = wh;
  }
  const { data, error } = await db().from("agenda_settings").upsert(patch).select().single();
  if (error) throw error;
  return data;
}

async function saveEventType(req: VercelRequest) {
  const p = body(req);
  const slug = str(p.slug, 60).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new HttpError(400, "El enlace corto es obligatorio");
  const loc = ["meet", "telefono", "whatsapp", "presencial"].includes(String(p.locationType)) ? String(p.locationType) : "meet";
  const row: Record<string, unknown> = {
    slug,
    title: str(p.title, 120) || "Reunión",
    description: str(p.description, 600),
    durationMinutes: Math.max(5, Math.min(480, Math.round(Number(p.durationMinutes) || 30))),
    locationType: loc,
    locationDetail: str(p.locationDetail, 300),
    active: p.active !== false,
    sortOrder: Math.round(Number(p.sortOrder) || 0),
  };
  if (p.id) row.id = str(p.id, 64);
  const { data, error } = await db().from("agenda_event_types").upsert(row).select().single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "Ya existe un tipo de reunión con ese enlace");
    throw error;
  }
  return data;
}

async function setBookingStatus(req: VercelRequest) {
  const p = body(req);
  const status = String(p.status);
  if (status === "cancelada") return cancel(req, true);
  if (!["asistio", "no_asistio", "confirmada"].includes(status)) throw new HttpError(400, "Estado inválido");
  const { data, error } = await db().from("agenda_bookings").update({ status }).eq("id", str(p.id, 64)).select().single();
  if (error) throw error;
  return data;
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const action = String(req.query.action ?? "");
  try {
    switch (`${req.method} ${action}`) {
      case "GET public": return res.status(200).json(await getPublic());
      case "GET slots": return res.status(200).json(await getSlots(req));
      case "POST book": return res.status(201).json(await book(req));
      case "GET booking": return res.status(200).json(await getBooking(req));
      case "POST cancel": return res.status(200).json(await cancel(req));
      case "POST reschedule": return res.status(200).json(await reschedule(req));

      case "GET admin": requireAdmin(req); return res.status(200).json(await getAdmin());
      case "PUT settings": requireAdmin(req); return res.status(200).json(await saveSettings(req));
      case "POST event-type": requireAdmin(req); return res.status(200).json(await saveEventType(req));
      case "POST booking-status": requireAdmin(req); return res.status(200).json(await setBookingStatus(req));

      case "GET google-connect": {
        requireAdmin(req);
        if (!googleConfigured()) throw new HttpError(400, "Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel");
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          redirect_uri: googleRedirectUri(req),
          response_type: "code",
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
          state: signState(String(Date.now())),
        });
        res.setHeader("Location", `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        return res.status(302).end();
      }
      case "GET google-callback": {
        if (!verifyState(String(req.query.state ?? ""))) throw new HttpError(400, "Enlace vencido. Vuelve a conectar desde /agenda");
        if (req.query.error) throw new HttpError(400, `Google: ${String(req.query.error)}`);
        await saveGoogleCode(req, String(req.query.code ?? ""));
        res.setHeader("Location", "/agenda?google=ok");
        return res.status(302).end();
      }
      default:
        return res.status(404).json({ error: "Acción no encontrada" });
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? "Error interno";
    if (status >= 500) console.error("[agenda]", err);
    return res.status(status).json({ error: message });
  }
}
