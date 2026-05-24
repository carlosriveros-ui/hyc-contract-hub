import type { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory storage for Vercel serverless (stateless between invocations)
// For production persistence, replace with Supabase or PlanetScale
const memoryStore: object[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ items: memoryStore });
  }

  if (req.method === "POST") {
    const item = { ...req.body, id: `lib-${Date.now()}`, savedAt: new Date().toISOString() };
    memoryStore.unshift(item);
    return res.status(201).json(item);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const idx = memoryStore.findIndex((i: Record<string, unknown>) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    memoryStore.splice(idx, 1);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
