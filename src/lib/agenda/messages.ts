// Textos de correo y WhatsApp. Funciones puras: las usan las funciones de Vercel.

import type { AgendaBooking, AgendaEventType, AgendaSettings } from "./types.js";
import { LOCATION_LABELS } from "./types.js";
import type { AgendaTheme } from "./theme.js";
import { dateKey, formatHuman, tzLabel } from "./time.js";

/** "hoy" o "mañana" según la fecha local del invitado. */
export function dayWord(startMs: number, tz: string, now = Date.now()): string {
  return dateKey(startMs, tz) === dateKey(now, tz) ? "hoy" : "mañana";
}

export type MessageKind =
  | "confirmacion"
  | "aviso_dueno"
  | "aviso_dueno_cancelacion"
  | "aviso_dueno_reprogramacion"
  | "recordatorio_24h"
  | "recordatorio_1h"
  | "cancelacion"
  | "reprogramacion";

export const isOwnerKind = (k: MessageKind) => k.startsWith("aviso_dueno");

export interface MessageContext {
  kind: MessageKind;
  settings: Pick<AgendaSettings, "ownerName" | "timezone">;
  eventType: Pick<AgendaEventType, "title" | "durationMinutes" | "locationType" | "locationDetail">;
  booking: Pick<AgendaBooking, "startAt" | "endAt" | "guestName" | "guestEmail" | "guestPhone" | "guestCompany" | "guestNotes" | "guestTimezone" | "meetUrl" | "cancelReason">;
  theme: AgendaTheme;
  manageUrl: string;
  googleCalendarUrl?: string;
}

export function whereText(ctx: Pick<MessageContext, "eventType" | "booking" | "settings">): string {
  const { eventType, booking } = ctx;
  switch (eventType.locationType) {
    case "meet":
      return booking.meetUrl ? `Google Meet: ${booking.meetUrl}` : "Google Meet (el enlace llega en la invitación de calendario)";
    case "telefono":
      return `Llamada telefónica: ${ctx.settings.ownerName} te llamará al ${booking.guestPhone || "número registrado"}`;
    case "whatsapp":
      return `Videollamada por WhatsApp al ${booking.guestPhone || "número registrado"}`;
    case "presencial":
      return `Presencial: ${eventType.locationDetail || "dirección por confirmar"}`;
  }
}

/** Fecha y hora en la zona del destinatario (invitado o dueño). */
export function whenText(ms: number, tz: string): string {
  return `${formatHuman(ms, tz)} (${tzLabel(tz, ms)})`;
}

function subjectFor(ctx: MessageContext): string {
  const when = formatHuman(Date.parse(ctx.booking.startAt), ctx.booking.guestTimezone);
  const t = ctx.eventType.title;
  switch (ctx.kind) {
    case "confirmacion": return `Confirmada: ${t} · ${when}`;
    case "aviso_dueno": return `Nueva reserva: ${ctx.booking.guestName} · ${formatHuman(Date.parse(ctx.booking.startAt), ctx.settings.timezone)}`;
    case "aviso_dueno_cancelacion": return `Cancelación: ${ctx.booking.guestName} · ${formatHuman(Date.parse(ctx.booking.startAt), ctx.settings.timezone)}`;
    case "aviso_dueno_reprogramacion": return `Reprogramada: ${ctx.booking.guestName} → ${formatHuman(Date.parse(ctx.booking.startAt), ctx.settings.timezone)}`;
    case "recordatorio_24h": {
      const w = dayWord(Date.parse(ctx.booking.startAt), ctx.booking.guestTimezone);
      return `${w === "hoy" ? "Hoy" : "Mañana"}: ${t} con ${ctx.settings.ownerName}`;
    }
    case "recordatorio_1h": return `En 1 hora: ${t} con ${ctx.settings.ownerName}`;
    case "cancelacion": return `Cancelada: ${t} · ${when}`;
    case "reprogramacion": return `Nueva fecha: ${t} · ${when}`;
  }
}

function intro(ctx: MessageContext): { title: string; lead: string } {
  const first = ctx.booking.guestName.split(" ")[0];
  const o = ctx.settings.ownerName;
  switch (ctx.kind) {
    case "confirmacion": return { title: "¡Listo, quedó agendada!", lead: `Hola ${first}, tu reunión con ${o} está confirmada. Te recordaremos un día antes y una hora antes.` };
    case "aviso_dueno": return { title: "Tienes una nueva reserva", lead: `${ctx.booking.guestName}${ctx.booking.guestCompany ? ` (${ctx.booking.guestCompany})` : ""} agendó una reunión contigo.` };
    case "aviso_dueno_cancelacion": return { title: "Cancelaron una reunión", lead: `${ctx.booking.guestName} canceló la reunión.${ctx.booking.cancelReason ? ` Motivo: ${ctx.booking.cancelReason}` : ""} El horario quedó libre.` };
    case "aviso_dueno_reprogramacion": return { title: "Reunión reprogramada", lead: `${ctx.booking.guestName} movió la reunión a una nueva fecha. Tu Google Calendar ya está actualizado.` };
    case "recordatorio_24h": return { title: `Nos vemos ${dayWord(Date.parse(ctx.booking.startAt), ctx.booking.guestTimezone)}`, lead: `Hola ${first}, te recordamos tu reunión con ${o}.` };
    case "recordatorio_1h": return { title: "Empezamos en una hora", lead: `Hola ${first}, tu reunión con ${o} es en una hora. Ten a mano lo que quieras revisar.` };
    case "cancelacion": return { title: "Reunión cancelada", lead: `Hola ${first}, la reunión fue cancelada.${ctx.booking.cancelReason ? ` Motivo: ${ctx.booking.cancelReason}` : ""} Si quieres, puedes elegir otra fecha.` };
    case "reprogramacion": return { title: "Reunión reprogramada", lead: `Hola ${first}, tu reunión con ${o} tiene nueva fecha.` };
  }
}

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildEmail(ctx: MessageContext): { subject: string; html: string; text: string } {
  const { theme: c, booking, eventType } = ctx;
  const forOwner = isOwnerKind(ctx.kind);
  const tz = forOwner ? ctx.settings.timezone : booking.guestTimezone;
  const start = Date.parse(booking.startAt);
  const { title, lead } = intro(ctx);
  const rows: [string, string][] = [
    ["Reunión", `${eventType.title} · ${eventType.durationMinutes} min`],
    ["Cuándo", whenText(start, tz)],
    ["Dónde", whereText(ctx)],
  ];
  if (forOwner) {
    rows.push(["Correo", booking.guestEmail]);
    if (booking.guestPhone) rows.push(["WhatsApp", booking.guestPhone]);
    if (booking.guestCompany) rows.push(["Empresa", booking.guestCompany]);
    if (booking.guestNotes) rows.push(["Tema", booking.guestNotes]);
  }

  const buttons: [string, string, boolean][] = [];
  const cancelled = ctx.kind === "cancelacion" || ctx.kind === "aviso_dueno_cancelacion";
  if (!cancelled) {
    if (booking.meetUrl && eventType.locationType === "meet") buttons.push(["Unirme a la reunión", booking.meetUrl, true]);
    if (!forOwner && ctx.googleCalendarUrl && (ctx.kind === "confirmacion" || ctx.kind === "reprogramacion")) buttons.push(["Agregar a Google Calendar", ctx.googleCalendarUrl, false]);
    if (!forOwner) buttons.push(["Reprogramar o cancelar", ctx.manageUrl, false]);
  } else if (!forOwner) {
    buttons.push(["Elegir otra fecha", ctx.manageUrl, true]);
  }

  const btnHtml = buttons
    .map(([label, href, primary]) =>
      `<a href="${escHtml(href)}" style="display:inline-block;margin:6px 6px 0 0;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;${primary ? `background:${c.ink};color:${c.onInk};` : `background:${c.soft};color:${c.ink};border:1px solid ${c.line};`}">${escHtml(label)}</a>`)
    .join("");

  const rowsHtml = rows
    .map(([k, v]) => `<tr><td style="padding:10px 0;border-top:1px solid ${c.line};color:${c.muted};font-size:12px;letter-spacing:.08em;text-transform:uppercase;width:110px;vertical-align:top">${escHtml(k)}</td><td style="padding:10px 0;border-top:1px solid ${c.line};color:${c.ink};font-size:15px">${escHtml(v)}</td></tr>`)
    .join("");

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:${c.paper};font-family:Inter,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.paper};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.card};border-radius:18px;border:1px solid ${c.line};overflow:hidden">
<tr><td style="background:${c.ink};padding:22px 28px;color:${c.onInk};font-size:13px;letter-spacing:.14em;text-transform:uppercase">${escHtml(c.brandName)} <span style="color:${c.accent}">·</span> Agenda</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;color:${c.ink}">${escHtml(title)}</h1>
<p style="margin:0 0 20px;color:${c.muted};font-size:15px;line-height:1.55">${escHtml(lead)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
<div style="margin-top:22px">${btnHtml}</div>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${c.line};color:${c.muted};font-size:12px">${forOwner ? "La reunión ya está en tu Google Calendar." : `Adjuntamos el archivo .ics para que la agregues a cualquier calendario (Samsung, Outlook, Apple).`}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [title, "", lead, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", ...buttons.map(([l, h]) => `${l}: ${h}`)].join("\n");
  return { subject: subjectFor(ctx), html, text };
}

/**
 * Parámetros de las plantillas de WhatsApp (Meta Cloud API).
 * Las plantillas deben existir y estar aprobadas con estas variables, en este orden.
 * Ver docs/AGENDA.md.
 */
export function whatsappTemplate(ctx: MessageContext): { name: string; params: string[] } | null {
  const { booking, eventType, settings } = ctx;
  const first = booking.guestName.split(" ")[0];
  const start = Date.parse(booking.startAt);
  switch (ctx.kind) {
    case "confirmacion":
    case "reprogramacion":
      return { name: "agenda_confirmacion", params: [first, eventType.title, whenText(start, booking.guestTimezone), whereText(ctx), ctx.manageUrl] };
    case "recordatorio_24h":
    case "recordatorio_1h":
      return { name: "agenda_recordatorio", params: [first, eventType.title, ctx.kind === "recordatorio_1h" ? "en 1 hora" : dayWord(start, booking.guestTimezone), whenText(start, booking.guestTimezone), whereText(ctx)] };
    case "aviso_dueno":
      return { name: "agenda_aviso_dueno", params: [booking.guestName, eventType.title, whenText(start, settings.timezone), booking.guestPhone || booking.guestEmail] };
    case "cancelacion":
      return { name: "agenda_cancelacion", params: [first, eventType.title, whenText(start, booking.guestTimezone), ctx.manageUrl] };
    default:
      return null; // Los cambios le llegan al dueño por correo y por Google Calendar.
  }
}

/** Mensaje prellenado para abrir un chat de WhatsApp (wa.me), sin API. */
export function waMeLink(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Deja solo dígitos con indicativo; asume Colombia (+57) para celulares de 10 dígitos. */
export function normalizePhone(raw: string, defaultCountry = "57"): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (raw.trim().startsWith("+")) return digits;
  if (digits.length === 10 && digits.startsWith("3") && defaultCountry === "57") return "57" + digits;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits.length <= 10 ? defaultCountry + digits : digits;
}
