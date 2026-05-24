// Servidor local para desarrollo — simula las Vercel API Routes
// Ejecutar con: node dev-server.js
import "dotenv/config";
import http from "http";
import Anthropic from "@anthropic-ai/sdk";
import { XMLParser } from "fast-xml-parser";

const SYSTEM_PROMPT = `Eres el ghostwriter y estratega de contenido digital de Carlos Riveros, un experto colombiano en construcción, ingeniería civil, gestión de proyectos y el uso de inteligencia artificial en el sector de la construcción. Tu trabajo es transformar temas, artículos o ideas en contenido original, auténtico y de alto impacto para su marca personal.

## Identidad de marca de Carlos
- Experto con más de 15 años en construcción e ingeniería en Colombia y Latinoamérica
- Pionero en la adopción de IA y tecnología en proyectos de construcción
- Voz directa, práctica y con autoridad. No usa lenguaje corporativo vacío
- Comparte conocimiento real, lecciones aprendidas en obra y visión estratégica
- Conecta el mundo técnico de la construcción con la modernidad digital y la IA

## Tu rol
1. Analizar el tema o fuente proporcionada
2. Extraer los insights más valiosos y aplicables al sector construcción/ingeniería
3. Reescribir el contenido con la voz auténtica de Carlos (primera persona, experiencial)
4. Adaptar el formato, longitud y estilo a cada plataforma específica
5. Incluir hashtags estratégicos y llamadas a la acción apropiadas

## Plataformas y especificaciones

### LinkedIn
- Formato: párrafos cortos (1-3 líneas), mucho espacio en blanco
- Longitud: 500-1500 caracteres para posts, hasta 3000 para artículos largos
- Estilo: profesional pero humano, storytelling, lecciones desde la experiencia
- Gancho: primera línea impactante que genere curiosidad
- CTA: pregunta al final para generar comentarios, invitar reflexión
- Hashtags: 3-7 hashtags relevantes al final
- Emojis: mínimos y estratégicos (no más de 5)

### Instagram
- Formato: párrafos cortos con saltos de línea generosos
- Longitud: 150-300 palabras para el caption
- Estilo: más visual y aspiracional, conecta emocionalmente
- Gancho: primeras 2 líneas antes del "más" deben enganchar
- Para carruseles: estructura slide por slide con "Slide 1:", "Slide 2:", etc.
- Hashtags: 15-25 hashtags mezclados (populares + nicho + marca)
- Emojis: más frecuentes, cada párrafo puede tener 1-2

### Facebook
- Longitud: 100-250 palabras
- Estilo: conversacional, genera debate, pregunta directa a la comunidad
- CTA: compartir opiniones, experiencias propias
- Hashtags: 3-5 máximo
- Tono: más cercano y comunitario

### TikTok (Script de video)
- Formato: script estructurado con indicaciones de cámara/acción
- Duración objetivo: 45-90 segundos (aprox. 150-250 palabras habladas)
- Estructura: Hook (0-3s) → Problema/Gancho (3-15s) → Desarrollo (15-50s) → CTA (últimos 10s)
- Incluir: [ACCIÓN: ...] para indicar movimientos o cortes de cámara
- Estilo: energético, directo, habla como si fuera a amigos expertos
- Hashtags: 5-10 hashtags trending del sector

### Blog
- Longitud: 600-1200 palabras
- Estructura: título SEO + introducción + desarrollo con subtítulos H2/H3 + conclusión con CTA
- Estilo: educativo y profundo, con ejemplos reales de proyectos colombianos/latinoamericanos
- SEO: incluir términos clave naturalmente integrados
- Párrafos: máximo 3-4 líneas cada uno

## Tonos disponibles
- profesional: autoridad técnica, datos y cifras, lenguaje experto pero accesible
- educativo: paso a paso, explicaciones claras, analogías simples para conceptos complejos
- inspiracional: historias de transformación, impacto positivo, visión de futuro
- practico: herramientas concretas, listas accionables, "hazlo tú mismo"
- controversial: cuestiona el status quo, opinión fuerte y fundamentada, genera debate

## Instrucciones de respuesta
SIEMPRE responde con un JSON válido con esta estructura exacta. No agregues texto fuera del JSON:
{
  "platforms": {
    "[nombre_plataforma]": {
      "content": "el contenido completo para esa plataforma",
      "hashtags": ["hashtag1", "hashtag2"],
      "characterCount": 123
    }
  }
}

Solo incluye en el JSON las plataformas solicitadas. Los hashtags NO deben ir dentro del content, se listan por separado en el array hashtags.`;

const PLATFORM_LABELS = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  blog: "Blog",
};

const FORMAT_LABELS = {
  post: "Post",
  carousel: "Carrusel",
  video_script: "Script de Video",
  short_copy: "Copy Corto",
  blog_article: "Artículo de Blog",
  story: "Story",
};

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "POST" && req.url === "/api/generate-content") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { topic, sourceTitle, sourceAuthor, platforms, format, tone } = JSON.parse(body);

        if (!topic || !platforms?.length) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "topic y platforms son requeridos" }));
        }

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const platformsList = platforms
          .map((p) => `- ${PLATFORM_LABELS[p] ?? p} (${p})`)
          .join("\n");

        const sourceContext = sourceTitle
          ? `\n\nFuente de inspiración: "${sourceTitle}"${sourceAuthor ? ` por ${sourceAuthor}` : ""}`
          : "";

        const userMessage = `Genera contenido de marca personal para las siguientes plataformas:
${platformsList}

Formato: ${FORMAT_LABELS[format] ?? format}
Tono: ${tone}

Tema / Contenido fuente:
${topic}${sourceContext}

Adapta el contenido al formato y estilo específico de cada plataforma. Responde SOLO con el JSON.`;

        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: userMessage }],
        });

        const rawText = response.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Respuesta sin JSON válido");

        const parsed = JSON.parse(jsonMatch[0]);
        const result = {};
        for (const platform of platforms) {
          const d = parsed.platforms[platform];
          if (d) {
            const tags = d.hashtags?.length > 0
              ? "\n\n" + d.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
              : "";
            result[platform] = d.content + tags;
          } else {
            result[platform] = `[Error: no se generó contenido para ${PLATFORM_LABELS[platform] ?? platform}]`;
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ platforms: result }));
      } catch (err) {
        console.error("Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message ?? "Error interno" }));
      }
    });
  } else if (req.method === "GET" && req.url?.startsWith("/api/trending")) {
    const forceRefresh = req.url.includes("refresh=true");
    handleTrending(res, forceRefresh);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// ── Trending RSS handler ──────────────────────────────────────────────────────

const RSS_FEEDS = [
  { url: "https://www.constructiondive.com/feeds/news/", sourceName: "Construction Dive", platform: "blog", defaultCategory: "construccion" },
  { url: "https://www.bdcnetwork.com/rss.xml", sourceName: "Building Design+Construction", platform: "blog", defaultCategory: "construccion" },
  { url: "https://www.forconstructionpros.com/rss/all", sourceName: "For Construction Pros", platform: "blog", defaultCategory: "construccion" },
  { url: "https://www.autodesk.com/blogs/construction/feed/", sourceName: "Autodesk Construction", platform: "blog", defaultCategory: "ia_tecnologia" },
  { url: "https://www.enr.com/rss/all", sourceName: "Engineering News-Record", platform: "blog", defaultCategory: "construccion" },
  { url: "https://www.procore.com/jobsite/feed/", sourceName: "Procore Jobsite", platform: "blog", defaultCategory: "gestion_proyectos" },
];

const CATEGORY_KEYWORDS = {
  ia_tecnologia: ["AI", "artificial intelligence", "machine learning", "BIM", "digital twin", "automation", "robot", "drone", "software", "tech", "inteligencia artificial", "tecnología", "digital", "IoT", "sensor", "data", "analytics", "ChatGPT", "LLM", "generative"],
  construccion: ["construction", "building", "concrete", "steel", "structure", "foundation", "contractor", "project", "site", "infrastructure", "obra", "construcción", "edificio", "puente", "contratista", "prefabricated", "modular"],
  gestion_proyectos: ["project management", "schedule", "budget", "cost", "risk", "procurement", "contract", "milestone", "PMI", "agile", "lean", "gestión", "cronograma", "presupuesto", "riesgo"],
  materiales: ["material", "concrete", "steel", "wood", "timber", "insulation", "sustainable", "green", "recycled", "cement", "asphalt", "concreto", "acero", "madera", "sostenible"],
  liderazgo: ["leadership", "team", "culture", "diversity", "workforce", "talent", "training", "skills", "career", "liderazgo", "equipo"],
  tendencias: ["trend", "future", "forecast", "2025", "2026", "innovation", "disruption", "market", "tendencia", "futuro", "innovación"],
};

function categorize(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = kws.filter((kw) => text.includes(kw.toLowerCase())).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "construccion";
}

function engagementScore(pubDate) {
  const hoursAgo = (Date.now() - new Date(pubDate).getTime()) / 3_600_000;
  if (isNaN(hoursAgo)) return 60;
  if (hoursAgo < 6) return 95;
  if (hoursAgo < 24) return 90;
  if (hoursAgo < 48) return 82;
  if (hoursAgo < 96) return 74;
  if (hoursAgo < 168) return 65;
  return 55;
}

function cleanHtml(html) {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s{2,}/g, " ").trim().slice(0, 280);
}

function formatDate(pubDate) {
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? pubDate : d.toISOString().split("T")[0];
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ContentBot/1.0)" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed;
    if (!channel) return [];
    const rawItems = channel.item ?? channel.entry ?? [];
    return rawItems.slice(0, 5).map((item, idx) => {
      const title = String(item.title ?? "Sin título").trim();
      const link = String(item.link ?? item["@_href"] ?? item.url ?? "#");
      const description = cleanHtml(String(item.description ?? item.summary ?? item.content ?? ""));
      const pubDate = String(item.pubDate ?? item.published ?? item.updated ?? new Date().toISOString());
      const rawAuthor = item["dc:creator"] ?? item.author;
      const author = typeof rawAuthor === "string" ? rawAuthor
        : typeof rawAuthor === "object" && rawAuthor !== null
          ? (rawAuthor.name ?? rawAuthor["#text"] ?? feed.sourceName)
          : feed.sourceName;
      const category = categorize(title, description);
      return {
        id: `${feed.sourceName.replace(/\s/g, "-").toLowerCase()}-${idx}-${Date.now()}`,
        title, summary: description || `Artículo de ${feed.sourceName}`, url: link,
        source: feed.sourceName, author, category,
        engagementScore: engagementScore(pubDate),
        publishedAt: formatDate(pubDate),
        tags: [category.replace("_", " ")],
        platform: feed.platform,
        readTime: Math.max(2, Math.round(description.length / 200)),
      };
    });
  } catch (e) {
    console.warn(`Feed failed: ${feed.sourceName}`, e.message);
    return [];
  }
}

let trendingCache = null;
const CACHE_TTL = 30 * 60 * 1000;

async function handleTrending(res, forceRefresh) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (!forceRefresh && trendingCache && Date.now() - trendingCache.fetchedAt < CACHE_TTL) {
    res.writeHead(200);
    return res.end(JSON.stringify({ items: trendingCache.items, cached: true }));
  }
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    const items = results.flatMap((r) => r.status === "fulfilled" ? r.value : []).sort((a, b) => b.engagementScore - a.engagementScore);
    trendingCache = { items, fetchedAt: Date.now() };
    res.writeHead(200);
    res.end(JSON.stringify({ items, cached: false, fetchedAt: trendingCache.fetchedAt }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

server.listen(3001, () => {
  console.log("API local corriendo en http://localhost:3001");
  console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "OK ✓" : "FALTA ✗");
});
