import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

const FEEDS = [
  { url: "https://www.constructiondive.com/feeds/news/", name: "Construction Dive" },
  { url: "https://www.enr.com/rss/all", name: "Engineering News-Record" },
  { url: "https://www.procore.com/jobsite/feed/", name: "Procore Jobsite" },
  { url: "https://www.construmatica.com/feed", name: "Construmática" },
];

interface Article {
  title: string;
  summary: string;
  source: string;
  url: string;
}

async function fetchTopArticles(limit: number): Promise<Article[]> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const articles: Article[] = [];

  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ContentBot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const xml = await res.text();
        const parsed = parser.parse(xml);
        const channel = parsed?.rss?.channel ?? parsed?.feed;
        if (!channel) return;
        const items: Record<string, unknown>[] = (channel.item ?? channel.entry ?? []).slice(0, 3);
        for (const item of items) {
          const title = String(item.title ?? "").trim();
          if (!title || title === "Sin título") continue;
          const raw = String(item.description ?? item.summary ?? item.content ?? "");
          const summary = raw.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 300);
          const url = String(item.link ?? item["@_href"] ?? "#");
          articles.push({ title, summary, source: feed.name, url });
        }
      } catch {
        // Skip failed feeds silently
      }
    })
  );

  return articles.slice(0, limit);
}

async function generatePost(article: Article, anthropic: Anthropic): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Eres Carlos Riveros, experto en construcción e ingeniería con 20+ años de experiencia en Colombia y proyectos internacionales (puentes, vías, edificaciones, gestión de contratos).

Basándote en este artículo de la industria, escribe un post de LinkedIn en español (400-600 caracteres) que:
- Conecta el tema con tu experiencia real en obras en Colombia/Latinoamérica
- Muestra perspectiva de experto con opinión propia, no resumen periodístico
- Es directo y genera conversación con la comunidad de ingeniería
- Incluye 3 hashtags relevantes al final (#construccion #ingenieriacivil + uno específico del tema)

Artículo: "${article.title}"
Contexto: ${article.summary}
Fuente: ${article.source}

Escribe solo el post, sin texto adicional.`,
      },
    ],
  });

  return msg.content[0].type === "text" ? msg.content[0].text : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey || !anthropicKey) {
    return res.status(500).json({ error: "Variables de entorno no configuradas" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    const articles = await fetchTopArticles(3);
    if (articles.length === 0) {
      return res.status(200).json({ ok: true, generated: 0, message: "Sin artículos disponibles" });
    }

    const saved: string[] = [];

    for (const article of articles) {
      const body = await generatePost(article, anthropic);
      if (!body) continue;

      const item = {
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        topic: article.title,
        platform: "linkedin",
        format: "post",
        tone: "profesional",
        body,
        source_title: article.source,
        source_author: null,
        character_count: body.length,
        status: "borrador",
        saved_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("library").insert(item);
      if (!error) saved.push(item.id);
    }

    return res.status(200).json({
      ok: true,
      generated: saved.length,
      ids: saved,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return res.status(500).json({ error: message });
  }
}
