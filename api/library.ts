import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)");
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    const supabase = getSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("library")
        .select("*")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ items: data });
    }

    if (req.method === "POST") {
      const d = req.body;
      const item = {
        id: `lib-${Date.now()}`,
        topic: d.topic ?? "",
        platform: d.platform ?? "",
        format: d.format ?? "",
        tone: d.tone ?? "",
        body: d.body ?? "",
        source_title: d.source_title ?? null,
        source_author: d.source_author ?? null,
        character_count: d.body?.length ?? 0,
        status: "borrador",
        saved_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("library").insert(item);
      if (error) throw error;
      return res.status(201).json(item);
    }

    if (req.method === "DELETE") {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "id requerido" });
      const { error } = await supabase.from("library").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return res.status(500).json({ error: message });
  }
}
