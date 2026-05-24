// Servidor local para desarrollo — simula las Vercel API Routes
// Ejecutar con: node dev-server.js
import "dotenv/config";
import http from "http";
import Anthropic from "@anthropic-ai/sdk";

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
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => {
  console.log("API local corriendo en http://localhost:3001");
  console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "OK ✓" : "FALTA ✗");
});
