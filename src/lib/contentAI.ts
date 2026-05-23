import Anthropic from "@anthropic-ai/sdk";
import type { Platform, ContentFormat, ContentTone } from "@/types/content";
import { PLATFORM_LABELS, FORMAT_LABELS } from "@/types/content";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

export interface GenerationParams {
  topic: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  platforms: Platform[];
  format: ContentFormat;
  tone: ContentTone;
}

export interface PlatformResult {
  content: string;
  hashtags: string[];
  characterCount: number;
}

export async function generatePlatformContent(
  params: GenerationParams
): Promise<Record<Platform, string>> {
  const { topic, sourceTitle, sourceAuthor, platforms, format, tone } = params;

  const platformsList = platforms
    .map((p) => `- ${PLATFORM_LABELS[p]} (${p})`)
    .join("\n");

  const sourceContext = sourceTitle
    ? `\n\nFuente de inspiración: "${sourceTitle}"${sourceAuthor ? ` por ${sourceAuthor}` : ""}`
    : "";

  const userMessage = `Genera contenido de marca personal para las siguientes plataformas:
${platformsList}

Formato: ${FORMAT_LABELS[format]}
Tono: ${tone}

Tema / Contenido fuente:
${topic}${sourceContext}

Adapta el contenido al formato y estilo específico de cada plataforma. Responde SOLO con el JSON.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Respuesta de la IA no contiene JSON válido");

  const parsed = JSON.parse(jsonMatch[0]) as {
    platforms: Record<Platform, PlatformResult>;
  };

  const result: Partial<Record<Platform, string>> = {};
  for (const platform of platforms) {
    const platformData = parsed.platforms[platform];
    if (platformData) {
      const hashtagsStr =
        platformData.hashtags?.length > 0
          ? "\n\n" + platformData.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
          : "";
      result[platform] = platformData.content + hashtagsStr;
    } else {
      result[platform] = `[Error: no se generó contenido para ${PLATFORM_LABELS[platform]}]`;
    }
  }

  return result as Record<Platform, string>;
}
