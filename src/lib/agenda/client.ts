// Cliente del navegador para /api/agenda.
import type { AgendaBooking, AgendaEventType, AgendaSettings, PublicAgenda, SlotsResponse } from "./types";

const KEY_STORAGE = "agenda-admin-key";

export function getAdminKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) ?? ""; } catch { return ""; }
}
export function setAdminKey(k: string) {
  try { localStorage.setItem(KEY_STORAGE, k); } catch { /* modo privado */ }
}

async function call<T>(action: string, opts: { method?: string; query?: Record<string, string>; body?: unknown; admin?: boolean } = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...(opts.query ?? {}) });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.admin) headers["x-agenda-key"] = getAdminKey();
  const res = await fetch(`/api/agenda?${qs}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Error ${res.status}`), { status: res.status });
  return data as T;
}

export interface BookingInput {
  eventTypeId: string;
  startAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCompany: string;
  guestNotes: string;
  guestTimezone: string;
  whatsappOptIn: boolean;
  website: string;
}

export type PublicBooking = Omit<AgendaBooking, "googleEventId" | "reminder24hAt" | "reminder1hAt">;

export interface IntegrationStatus {
  google: "no_configurado" | "sin_conectar" | "conectado" | "error";
  googleCalendars: string[];
  icsCount: number;
  email: boolean;
  whatsapp: boolean;
  adminKey: boolean;
  cronSecret: boolean;
}

export interface AdminBooking extends AgendaBooking {
  notifyLog: { at: string; kind: string; channel: string; to: string; ok: boolean; error?: string }[];
}

export const agendaApi = {
  public: () => call<PublicAgenda>("public"),
  slots: (eventTypeId: string, token?: string) => call<SlotsResponse>("slots", { query: { eventTypeId, ...(token ? { token } : {}) } }),
  book: (input: BookingInput) => call<{ booking: PublicBooking; eventType: AgendaEventType }>("book", { method: "POST", body: input }),
  booking: (token: string) => call<{ booking: PublicBooking; eventType: AgendaEventType; settings: PublicAgenda["settings"] }>("booking", { query: { token } }),
  cancel: (token: string, reason: string) => call<{ booking: PublicBooking }>("cancel", { method: "POST", body: { token, reason } }),
  reschedule: (token: string, startAt: string) => call<{ booking: PublicBooking }>("reschedule", { method: "POST", body: { token, startAt } }),

  admin: () => call<{ settings: AgendaSettings; eventTypes: AgendaEventType[]; bookings: AdminBooking[]; status: IntegrationStatus }>("admin", { admin: true }),
  saveSettings: (s: Partial<AgendaSettings>) => call<AgendaSettings>("settings", { method: "PUT", body: s, admin: true }),
  saveEventType: (e: Partial<AgendaEventType>) => call<AgendaEventType>("event-type", { method: "POST", body: e, admin: true }),
  setBookingStatus: (id: string, status: string, reason?: string) => call<unknown>("booking-status", { method: "POST", body: { id, status, reason }, admin: true }),
  googleConnectUrl: () => `/api/agenda?action=google-connect&key=${encodeURIComponent(getAdminKey())}`,
};
