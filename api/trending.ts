import type { VercelRequest, VercelResponse } from "@vercel/node";
import { XMLParser } from "fast-xml-parser";

interface RssFeed {
  url: string;
  sourceName: string;
  platform: "linkedin" | "blog" | "medium" | "youtube" | "twitter";
  defaultCategory: string;
}

const RSS_FEEDS: RssFeed[] = [
  {
    url: "https://www.constructiondive.com/feeds/news/",
    sourceName: "Construction Dive",
    platform: "blog",
    defaultCategory: "construccion",
  },
  {
    url: "https://www.bdcnetwork.com/rss.xml",
    sourceName: "Building Design+Construction",
    platform: "blog",
    defaultCategory: "construccion",
  },
  {
    url: "https://www.forconstructionpros.com/rss/all",
    sourceName: "For Construction Pros",
    platform: "blog",
    defaultCategory: "construccion",
  },
  {
    url: "https://www.autodesk.com/blogs/construction/feed/",
    sourceName: "Autodesk Construction",
    platform: "blog",
    defaultCategory: "ia_tecnologia",
  },
  {
    url: "https://www.enr.com/rss/all",
    sourceName: "Engineering News-Record",
    platform: "blog",
    defaultCategory: "construccion",
  },
  {
    url: "https://www.procore.com/jobsite/feed/",
    sourceName: "Procore Jobsite",
    platform: "blog",
    defaultCategory: "gestion_proyectos",
  },
  {
    url: "https://feeds.feedburner.com/ConstructionManagerMagazine",
    sourceName: "Construction Manager",
    platform: "blog",
    defaultCategory: "gestion_proyectos",
  },
  {
    url: "https://rss.app/feeds/tXCVQqcGTB7YHEBS.xml",
    sourceName: "AI in Construction",
    platform: "blog",
    defaultCategory: "ia_tecnologia",
  },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ia_tecnologia: [
    "AI", "artificial intelligence", "machine learning", "BIM", "digital twin",
    "automation", "robot", "drone", "software", "tech", "inteligencia artificial",
    "tecnología", "digital", "IoT", "sensor", "data", "analytics", "cloud",
    "ChatGPT", "LLM", "generative", "predictive",
  ],
  construccion: [
    "construction", "building", "concrete", "steel", "structure", "foundation",
    "contractor", "project", "site", "infrastructure", "obra", "construcción",
    "edificio", "puente", "túnel", "contratista", "licitación", "SENA", "INVIAS",
    "prefabricated", "modular", "residential", "commercial",
  ],
  gestion_proyectos: [
    "project management", "schedule", "budget", "cost", "risk", "procurement",
    "contract", "milestone", "deadline", "stakeholder", "PMI", "agile", "lean",
    "gestión", "cronograma", "presupuesto", "riesgo", "contrato",
  ],
  materiales: [
    "material", "concrete", "steel", "wood", "timber", "insulation", "glass",
    "composite", "sustainable", "green", "recycled", "cement", "asphalt",
    "concreto", "acero", "madera", "material", "sostenible",
  ],
  liderazgo: [
    "leadership", "team", "culture", "diversity", "workforce", "talent",
    "training", "skills", "career", "liderazgo", "equipo", "cultura",
    "competencia", "habilidades",
  ],
  tendencias: [
    "trend", "future", "forecast", 2025, 2026, "innovation", "disruption",
    "market", "industry", "global", "tendencia", "futuro", "innovación",
  ],
};

function categorize(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter((kw) =>
      text.includes(String(kw).toLowerCase())
    ).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "construccion";
}

function engagementScore(pubDate: string): number {
  const now = Date.now();
  const pub = new Date(pubDate).getTime();
  if (isNaN(pub)) return 60;
  const hoursAgo = (now - pub) / 3_600_000;
  if (hoursAgo < 6) return 95;
  if (hoursAgo < 24) return 90;
  if (hoursAgo < 48) return 82;
  if (hoursAgo < 96) return 74;
  if (hoursAgo < 168) return 65;
  return 55;
}

function cleanHtml(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 280);
}

function formatDate(pubDate: string): string {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return pubDate;
  return d.toISOString().split("T")[0];
}

function extractTags(title: string, category: string): string[] {
  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  const text = title.toLowerCase();
  const found = keywords
    .filter((kw) => typeof kw === "string" && text.includes(kw.toLowerCase()))
    .map((kw) => String(kw));
  const categoryTag = category.replace("_", " ");
  return [...new Set([categoryTag, ...found])].slice(0, 5);
}

async function fetchFeed(feed: RssFeed): Promise<object[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ContentBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    const channel = parsed?.rss?.channel ?? parsed?.feed;
    if (!channel) return [];

    const rawItems: object[] =
      channel.item ?? channel.entry ?? [];

    return rawItems.slice(0, 5).map((item: Record<string, unknown>, idx: number) => {
      const title = String(item.title ?? "Sin título").trim();
      const link = String(item.link ?? item["@_href"] ?? item.url ?? "#");
      const description = cleanHtml(
        String(item.description ?? item.summary ?? item.content ?? "")
      );
      const pubDate = String(item.pubDate ?? item.published ?? item.updated ?? new Date().toISOString());
      const rawAuthor = item["dc:creator"] ?? item.author;
      const author = typeof rawAuthor === "string" ? rawAuthor
        : typeof rawAuthor === "object" && rawAuthor !== null
          ? ((rawAuthor as Record<string, string>).name ?? (rawAuthor as Record<string, string>)["#text"] ?? feed.sourceName)
          : feed.sourceName;
      const category = categorize(title, description) ?? feed.defaultCategory;
      const score = engagementScore(pubDate);

      return {
        id: `${feed.sourceName.replace(/\s/g, "-").toLowerCase()}-${idx}-${Date.now()}`,
        title,
        summary: description || `Artículo de ${feed.sourceName} sobre ${title.slice(0, 60)}...`,
        url: link,
        source: feed.sourceName,
        author,
        category,
        engagementScore: score,
        publishedAt: formatDate(pubDate),
        tags: extractTags(title, category),
        platform: feed.platform,
        readTime: Math.max(2, Math.round((description.length / 200))),
        views: undefined,
        likes: undefined,
      };
    });
  } catch {
    return [];
  }
}

let cache: { items: object[]; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (_req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const forceRefresh = _req.query?.refresh === "true";

  if (!forceRefresh && cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return res.status(200).json({ items: cache.items, cached: true, fetchedAt: cache.fetchedAt });
  }

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
  const items = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (b.engagementScore as number) - (a.engagementScore as number)
    );

  cache = { items, fetchedAt: Date.now() };
  return res.status(200).json({ items, cached: false, fetchedAt: cache.fetchedAt });
}
