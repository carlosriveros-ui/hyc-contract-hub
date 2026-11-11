// Tipos compartidos entre la página pública, el panel admin y las funciones de Vercel.

export type AgendaBrand = "carlos-riveros" | "hyc";
export type LocationType = "meet" | "telefono" | "whatsapp" | "presencial";
export type BookingStatus = "confirmada" | "cancelada" | "reprogramada" | "asistio" | "no_asistio";

export interface TimeWindow {
  start: string; // "HH:MM" en la zona del dueño
  end: string;
}

/** Disponibilidad semanal: índice 0 = domingo … 6 = sábado. */
export type WeeklyHours = Record<string, TimeWindow[]>;

export interface AgendaSettings {
  id: string;
  ownerName: string;
  ownerTitle: string;
  headline: string;
  welcome: string;
  brand: AgendaBrand;
  timezone: string;
  weeklyHours: WeeklyHours;
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  dailyLimit: number; // 0 = sin límite
  slotStepMinutes: number;
  blockedDates: string[]; // "YYYY-MM-DD"
  ownerWhatsapp: string; // solo dígitos con indicativo, p. ej. 573001234567
  ownerEmail: string;
}

export interface AgendaEventType {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  locationType: LocationType;
  locationDetail: string;
  active: boolean;
  sortOrder: number;
}

export interface AgendaBooking {
  id: string;
  eventTypeId: string;
  startAt: string; // ISO UTC
  endAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCompany: string;
  guestNotes: string;
  guestTimezone: string;
  whatsappOptIn: boolean;
  status: BookingStatus;
  token: string;
  googleEventId: string | null;
  meetUrl: string | null;
  reminder24hAt: string | null;
  reminder1hAt: string | null;
  createdAt: string;
  cancelReason: string | null;
}

export interface Interval {
  start: number; // ms UTC
  end: number;
}

/** Lo que la página pública necesita (sin datos privados). */
export interface PublicAgenda {
  settings: Pick<AgendaSettings, "ownerName" | "ownerTitle" | "headline" | "welcome" | "brand" | "timezone" | "maxDaysAhead" | "ownerWhatsapp">;
  eventTypes: AgendaEventType[];
}

export interface SlotsResponse {
  timezone: string;
  /** Inicio de cada horario libre, en ISO UTC, agrupado por fecha local del dueño. */
  slots: string[];
}

export const DEFAULT_SETTINGS: Omit<AgendaSettings, "id"> = {
  ownerName: "Carlos Riveros",
  ownerTitle: "Ingeniero · Gerencia de proyectos",
  headline: "Agenda una reunión",
  welcome: "Elige el tipo de reunión, el día y la hora que mejor te funcionen. Recibirás la confirmación por correo y WhatsApp.",
  brand: "carlos-riveros",
  timezone: "America/Bogota",
  weeklyHours: {
    "1": [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }],
    "2": [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }],
    "3": [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }],
    "4": [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }],
    "5": [{ start: "09:00", end: "12:00" }],
  },
  bufferMinutes: 15,
  minNoticeMinutes: 24 * 60,
  maxDaysAhead: 30,
  dailyLimit: 4,
  slotStepMinutes: 30,
  blockedDates: [],
  ownerWhatsapp: "",
  ownerEmail: "",
};

export const LOCATION_LABELS: Record<LocationType, string> = {
  meet: "Google Meet",
  telefono: "Llamada telefónica",
  whatsapp: "Videollamada por WhatsApp",
  presencial: "Presencial",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  reprogramada: "Reprogramada",
  asistio: "Asistió",
  no_asistio: "No asistió",
};
