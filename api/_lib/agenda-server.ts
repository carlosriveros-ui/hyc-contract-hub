// Lógica de servidor de la agenda (no es una ruta: Vercel ignora carpetas con "_").
import type { VercelRequest } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { AgendaBooking, AgendaEventType, AgendaSettings, Interval } from "../../src/lib/agenda/types.js";
import { DEFAULT_SETTINGS, LOCATION_LABELS } from "../../src/lib/agenda/types.js";
import { busyFromIcs, buildIcs, googleCalendarLink } from "../../src/lib/agenda/ics.js";
import { buildTheme, type MarcasJson } from "../../src/lib/agenda/theme.js";
import { buildEmail, isOwnerKind, whatsappTemplate, whereText, type MessageKind } from "../../src/lib/agenda/messages.js";

// ── Supabase ──────────────────────────────────────────────────────────────────

let client: SupabaseClient | null = null;
export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new HttpError(500, "Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function loadSettings(): Promise<AgendaSettings> {
  const { data, error } = await db().from("agenda_settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw error;
  return { id: "default", ...DEFAULT_SETTINGS, ...(data ?? {}) } as AgendaSettings;
}

export async function loadEventTypes(onlyActive: boolean): Promise<AgendaEventType[]> {
  let q = db().from("agenda_event_types").select("*").order("sortOrder");
  if (onlyActive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AgendaEventType[];
}

export async function confirmedBookings(from: number, to: number, excludeId?: string): Promise<AgendaBooking[]> {
  let q = db()
    .from("agenda_bookings")
    .select("*")
    .eq("status", "confirmada")
    .lt("startAt", new Date(to).toISOString())
    .gt("endAt", new Date(from).toISOString());
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AgendaBooking[];
}

export function newToken(): string {
  return randomBytes(18).toString("hex");
}

// ── Marca ─────────────────────────────────────────────────────────────────────

let marcasCache: MarcasJson | null = null;
export function marcas(): MarcasJson {
  if (!marcasCache) {
    const file = path.join(process.cwd(), "videos", "marcas.json");
    marcasCache = JSON.parse(readFileSync(file, "utf8")) as MarcasJson;
  }
  return marcasCache;
}

// ── Seguridad ─────────────────────────────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function requireAdmin(req: VercelRequest): void {
  const expected = process.env.AGENDA_ADMIN_KEY;
  if (!expected) throw new HttpError(503, "Configura AGENDA_ADMIN_KEY en Vercel para administrar la agenda");
  const got = String(req.headers["x-agenda-key"] ?? req.query.key ?? "");
  if (!got || !safeEqual(got, expected)) throw new HttpError(401, "Clave de administración incorrecta");
}

export function signState(payload: string): string {
  const secret = process.env.AGENDA_ADMIN_KEY ?? "";
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32)}`;
}

export function verifyState(state: string): boolean {
  const i = state.lastIndexOf(".");
  if (i < 0) return false;
  const payload = state.slice(0, i);
  const ts = Number(payload);
  return safeEqual(signState(payload), state) && Date.now() - ts < 15 * 60_000;
}

export function publicBaseUrl(req: VercelRequest): string {
  if (process.env.AGENDA_PUBLIC_URL) return process.env.AGENDA_PUBLIC_URL.replace(/\/$/, "");
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "hyc-contract-hub.vercel.app");
  const proto = String(req.headers["x-forwarded-proto"] ?? "https");
  return `${proto}://${host}`;
}

// ── Google Calendar ───────────────────────────────────────────────────────────

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function googleRefreshToken(): Promise<string | null> {
  if (process.env.GOOGLE_REFRESH_TOKEN) return process.env.GOOGLE_REFRESH_TOKEN;
  const { data } = await db().from("agenda_secrets").select("value").eq("key", "google_refresh_token").maybeSingle();
  return data?.value ?? null;
}

let tokenCache: { token: string; exp: number } | null = null;
export async function googleAccessToken(): Promise<string | null> {
  if (!googleConfigured()) return null;
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const refresh = await googleRefreshToken();
  if (!refresh) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[agenda] Google token", res.status, await res.text());
    return null;
  }
  const j = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export function googleRedirectUri(req: VercelRequest): string {
  return `${publicBaseUrl(req)}/api/agenda?action=google-callback`;
}

export async function saveGoogleCode(req: VercelRequest, code: string): Promise<void> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  const j = (await res.json()) as { refresh_token?: string; error_description?: string };
  if (!res.ok || !j.refresh_token) throw new HttpError(400, j.error_description ?? "Google no entregó refresh token");
  const { error } = await db().from("agenda_secrets").upsert({ key: "google_refresh_token", value: j.refresh_token, updatedAt: new Date().toISOString() });
  if (error) throw error;
  tokenCache = null;
}

const calendarId = () => process.env.GOOGLE_CALENDAR_ID || "primary";
const busyCalendars = () => (process.env.GOOGLE_BUSY_CALENDARS || calendarId()).split(",").map((s) => s.trim()).filter(Boolean);

async function googleBusy(from: number, to: number, tz: string): Promise<Interval[]> {
  const token = await googleAccessToken();
  if (!token) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: new Date(from).toISOString(),
      timeMax: new Date(to).toISOString(),
      timeZone: tz,
      items: busyCalendars().map((id) => ({ id })),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new HttpError(502, `Google Calendar no respondió (${res.status})`);
  const j = (await res.json()) as { calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> };
  const out: Interval[] = [];
  for (const cal of Object.values(j.calendars ?? {})) {
    if (cal.errors?.length) console.error("[agenda] freeBusy", cal.errors);
    for (const b of cal.busy ?? []) out.push({ start: Date.parse(b.start), end: Date.parse(b.end) });
  }
  return out;
}

async function icsBusy(from: number, to: number, tz: string): Promise<Interval[]> {
  const urls = (process.env.AGENDA_ICS_URLS ?? "").split(/[\s,]+/).filter((u) => /^https?:\/\//.test(u) || u.startsWith("webcal://"));
  const results = await Promise.allSettled(
    urls.map(async (u) => {
      const res = await fetch(u.replace(/^webcal:/, "https:"), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`ICS ${res.status}`);
      return busyFromIcs(await res.text(), from, to, tz);
    }),
  );
  const out: Interval[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(...r.value);
    else console.error("[agenda] ICS", r.reason);
  }
  return out;
}

/** Todo lo ocupado: Google + calendarios ICS + reservas confirmadas. */
export async function allBusy(from: number, to: number, tz: string, excludeBookingId?: string) {
  const [google, ics, bookings] = await Promise.all([
    googleBusy(from, to, tz),
    icsBusy(from, to, tz),
    confirmedBookings(from, to, excludeBookingId),
  ]);
  const own = bookings.map((b) => ({ start: Date.parse(b.startAt), end: Date.parse(b.endAt) }));
  // Las reservas propias ya están en Google; se excluye el evento de la reserva que se reprograma.
  return { busy: [...google, ...ics, ...own], bookings: own };
}

interface GoogleEventResult {
  id: string;
  meetUrl: string | null;
}

export async function upsertGoogleEvent(
  b: AgendaBooking,
  et: AgendaEventType,
  s: AgendaSettings,
  manageUrl: string,
): Promise<GoogleEventResult | null> {
  const token = await googleAccessToken();
  if (!token) return null;
  const description = [
    b.guestNotes && `Tema: ${b.guestNotes}`,
    b.guestCompany && `Empresa: ${b.guestCompany}`,
    b.guestPhone && `WhatsApp: +${b.guestPhone}`,
    `Correo: ${b.guestEmail}`,
  ].filter((x): x is string => !!x).concat(["", `Gestionar reserva: ${manageUrl}`]).join("\n");
  const body: Record<string, unknown> = {
    summary: `${et.title} · ${b.guestName}`,
    description,
    start: { dateTime: b.startAt, timeZone: s.timezone },
    end: { dateTime: b.endAt, timeZone: s.timezone },
    attendees: [{ email: b.guestEmail, displayName: b.guestName }],
    reminders: { useDefault: true },
    location: et.locationType === "presencial" ? et.locationDetail : LOCATION_LABELS[et.locationType],
    extendedProperties: { private: { agendaBookingId: b.id } },
  };
  if (et.locationType === "meet" && !b.googleEventId) {
    body.conferenceData = { createRequest: { requestId: b.id, conferenceSolutionKey: { type: "hangoutsMeet" } } };
  }
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`;
  const url = b.googleEventId
    ? `${base}/${encodeURIComponent(b.googleEventId)}?sendUpdates=all&conferenceDataVersion=1`
    : `${base}?sendUpdates=all&conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: b.googleEventId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[agenda] Google event", res.status, await res.text());
    return null;
  }
  const j = (await res.json()) as { id: string; hangoutLink?: string };
  return { id: j.id, meetUrl: j.hangoutLink ?? b.meetUrl ?? null };
}

export async function deleteGoogleEvent(eventId: string): Promise<void> {
  const token = await googleAccessToken();
  if (!token) return;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok && res.status !== 410 && res.status !== 404) console.error("[agenda] Google delete", res.status, await res.text());
}

// ── Correo (Resend) y WhatsApp (Meta Cloud API) ───────────────────────────────

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.AGENDA_EMAIL_FROM);
export const whatsappConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);

async function sendEmail(to: string, subject: string, html: string, text: string, ics?: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.AGENDA_EMAIL_FROM,
      to: [to],
      reply_to: process.env.AGENDA_EMAIL_REPLY_TO || undefined,
      subject,
      html,
      text,
      attachments: ics ? [{ filename: "reunion.ics", content: Buffer.from(ics).toString("base64") }] : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendWhatsapp(toDigits: string, template: { name: string; params: string[] }): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "template",
      template: {
        name: template.name,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es" },
        components: [{ type: "body", parameters: template.params.map((text) => ({ type: "text", text: text.slice(0, 1000) })) }],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
}

export interface NotifyResult {
  at: string;
  kind: MessageKind;
  channel: "email" | "whatsapp";
  to: string;
  ok: boolean;
  error?: string;
}

/** Envía correo + WhatsApp al invitado (o al dueño si kind = aviso_dueno). Nunca lanza error. */
export async function notify(
  kind: MessageKind,
  b: AgendaBooking,
  et: AgendaEventType,
  s: AgendaSettings,
  baseUrl: string,
): Promise<NotifyResult[]> {
  const theme = buildTheme(marcas(), s.brand);
  const manageUrl = `${baseUrl}/agendar/reserva/${b.token}`;
  const start = Date.parse(b.startAt);
  const end = Date.parse(b.endAt);
  const where = whereText({ eventType: et, booking: b, settings: s });
  const gcal = googleCalendarLink({ start, end, title: `${et.title} con ${s.ownerName}`, description: `${where}\n\nGestionar: ${manageUrl}`, location: where });
  const ctx = { kind, settings: s, eventType: et, booking: b, theme, manageUrl, googleCalendarUrl: gcal };

  const forOwner = isOwnerKind(kind);
  const toEmail = forOwner ? s.ownerEmail || process.env.AGENDA_OWNER_EMAIL || "" : b.guestEmail;
  const toPhone = forOwner ? s.ownerWhatsapp : b.whatsappOptIn ? b.guestPhone : "";
  const results: NotifyResult[] = [];
  const log = (channel: NotifyResult["channel"], to: string, ok: boolean, error?: string): void => {
    results.push({ at: new Date().toISOString(), kind, channel, to, ok, ...(error ? { error: error.slice(0, 300) } : {}) });
  };

  const jobs: Promise<void>[] = [];
  if (emailConfigured() && toEmail) {
    const email = buildEmail(ctx);
    const attachIcs = !forOwner && kind !== "recordatorio_1h";
    const ics = attachIcs
      ? buildIcs({
          uid: `${b.id}@agenda`,
          start,
          end,
          title: `${et.title} con ${s.ownerName}`,
          description: `${where}\n\nReprogramar o cancelar: ${manageUrl}`,
          location: where,
          organizerName: s.ownerName,
          url: manageUrl,
          cancelled: kind === "cancelacion",
          sequence: kind === "reprogramacion" || kind === "cancelacion" ? Math.floor(Date.now() / 1000) : 0,
        })
      : undefined;
    jobs.push(sendEmail(toEmail, email.subject, email.html, email.text, ics).then(() => log("email", toEmail, true), (e) => log("email", toEmail, false, String(e))));
  }
  const tpl = whatsappTemplate(ctx);
  if (whatsappConfigured() && toPhone && tpl) {
    jobs.push(sendWhatsapp(toPhone, tpl).then(() => log("whatsapp", toPhone, true), (e) => log("whatsapp", toPhone, false, String(e))));
  }
  await Promise.all(jobs);
  for (const r of results) if (!r.ok) console.error("[agenda] notify", r);
  return results;
}

export async function appendLog(bookingId: string, entries: NotifyResult[], patch: Record<string, unknown> = {}): Promise<void> {
  if (!entries.length && !Object.keys(patch).length) return;
  const { data } = await db().from("agenda_bookings").select("notifyLog").eq("id", bookingId).maybeSingle();
  const prev = (data?.notifyLog as NotifyResult[] | undefined) ?? [];
  await db().from("agenda_bookings").update({ ...patch, notifyLog: [...prev, ...entries].slice(-40) }).eq("id", bookingId);
}

export async function integrationStatus() {
  let google: "no_configurado" | "sin_conectar" | "conectado" | "error" = "no_configurado";
  if (googleConfigured()) {
    google = (await googleRefreshToken()) ? ((await googleAccessToken()) ? "conectado" : "error") : "sin_conectar";
  }
  const icsCount = (process.env.AGENDA_ICS_URLS ?? "").split(/[\s,]+/).filter(Boolean).length;
  return {
    google,
    googleCalendars: busyCalendars(),
    icsCount,
    email: emailConfigured(),
    whatsapp: whatsappConfigured(),
    adminKey: !!process.env.AGENDA_ADMIN_KEY,
    cronSecret: !!process.env.CRON_SECRET,
  };
}
