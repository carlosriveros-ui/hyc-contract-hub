// Recordatorios de reuniones: 24 h antes y 1 h antes (correo + WhatsApp).
// Vercel lo corre una vez al día; para el de "1 hora antes" exacto, llamarlo cada 10 min
// desde Supabase pg_cron o cron-job.org (ver docs/AGENDA.md). Es idempotente.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appendLog, db, loadSettings, notify, publicBaseUrl } from "../_lib/agenda-server.js";
import type { AgendaBooking, AgendaEventType } from "../../src/lib/agenda/types.js";

const H = 3_600_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    const now = Date.now();
    const { data, error } = await db()
      .from("agenda_bookings")
      .select("*")
      .eq("status", "confirmada")
      .gt("startAt", new Date(now).toISOString())
      .lte("startAt", new Date(now + 26 * H).toISOString());
    if (error) throw error;
    const bookings = (data ?? []) as AgendaBooking[];
    if (!bookings.length) return res.status(200).json({ sent: 0 });

    const settings = await loadSettings();
    const { data: types } = await db().from("agenda_event_types").select("*");
    const byId = new Map((types ?? []).map((t: AgendaEventType) => [t.id, t]));
    const base = publicBaseUrl(req);
    let sent = 0;

    for (const b of bookings) {
      const et = byId.get(b.eventTypeId);
      if (!et) continue;
      const start = Date.parse(b.startAt);
      const created = Date.parse(b.createdAt);
      const left = start - now;

      if (!b.reminder1hAt && left <= 75 * 60_000) {
        // Si se agendó hace menos de 2 h, la confirmación ya cumple la función.
        const skip = now - created < 2 * H;
        const logs = skip ? [] : await notify("recordatorio_1h", b, et, settings, base);
        await appendLog(b.id, logs, { reminder1hAt: new Date().toISOString(), reminder24hAt: b.reminder24hAt ?? new Date().toISOString() });
        if (!skip) sent++;
        continue;
      }
      if (!b.reminder24hAt && left <= 24 * H + 30 * 60_000 && left > 2 * H) {
        // Si se agendó con menos de 20 h de anticipación, no hace falta el de "mañana".
        const skip = start - created < 20 * H;
        const logs = skip ? [] : await notify("recordatorio_24h", b, et, settings, base);
        await appendLog(b.id, logs, { reminder24hAt: new Date().toISOString() });
        if (!skip) sent++;
      }
    }
    return res.status(200).json({ sent, checked: bookings.length });
  } catch (err) {
    console.error("[agenda-reminders]", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Error" });
  }
}
