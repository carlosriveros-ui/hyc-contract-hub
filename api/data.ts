import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TABLES = new Set([
  "app_users", "contracts", "sites", "activities",
  "materials", "movements", "contractors", "cost_entries",
  "attendance", "petty_cash",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Variables de entorno no configuradas" });
  }

  const table = req.query.table as string;
  if (!table || !ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: "Tabla inválida" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const id = req.query.id as string | undefined;

  try {
    if (req.method === "GET") {
      let q = supabase.from(table).select("*");
      const skip = new Set(["table", "id"]);
      for (const [key, val] of Object.entries(req.query)) {
        if (!skip.has(key) && typeof val === "string") {
          q = q.eq(key, val);
        }
      }
      if (id) q = q.eq("id", id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === "POST") {
      const { data, error } = await supabase.from(table).insert(req.body).select();
      if (error) throw error;
      return res.status(201).json(data?.[0] ?? {});
    }

    if (req.method === "PATCH") {
      if (!id) return res.status(400).json({ error: "id requerido" });
      const { data, error } = await supabase.from(table).update(req.body).eq("id", id).select();
      if (error) throw error;
      return res.status(200).json(data?.[0] ?? {});
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ error: "id requerido" });
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return res.status(500).json({ error: message });
  }
}
