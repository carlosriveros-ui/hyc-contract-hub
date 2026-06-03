// Agente de Noticias — busca noticias del sector constructor e inmobiliario
// para generar contenido de valor para HYC Proyectos

const RSS_FEEDS = [
  // Construcción e inmobiliario Colombia
  'https://www.larepublica.co/rss/economia',
  'https://www.eltiempo.com/rss/economia_sectores-economicos.xml',
  'https://camacol.co/feed',
  // Materiales y tecnología
  'https://www.portafolio.co/rss/economia.xml',
  'https://www.dinero.com/rss.xml',
];

const GOOGLE_NEWS_QUERIES = [
  'construcción Colombia 2026',
  'sector inmobiliario Colombia',
  'licitaciones construcción Colombia',
  'materiales construcción precios Colombia',
  'tecnología construcción BIM Colombia',
];

export async function runNewsAgent(runAgent) {
  const prompt = `Eres el agente de noticias e inteligencia de mercado de HYC Proyectos. Tu misión es encontrar las noticias más relevantes del día para generar contenido de valor.

**Paso 1 — Busca noticias con web_search:**
Haz búsquedas con estas consultas (usa web_search):
1. "construcción Colombia 2026 noticias"
2. "sector inmobiliario Colombia tendencias"
3. "licitaciones obras Colombia"
4. "precios materiales construcción Colombia"
5. "tecnología construcción innovación Colombia"

**Paso 2 — Lee los artículos más relevantes:**
Para los 3-5 artículos más prometedores, usa fetch_url para obtener el contenido completo.

**Paso 3 — Análisis y generación de contenido:**
Con las noticias recopiladas, genera para Carlos Riveros (CEO de HYC Proyectos) un reporte con:

**NOTICIAS DEL DÍA:**
- Top 3-5 noticias más relevantes con resumen de 2 líneas cada una
- Fuente y enlace

**IDEAS DE CONTENIDO:**
Para cada noticia relevante, sugiere:
1. 🐦 **Post LinkedIn** (150-200 palabras) — perspectiva profesional de Carlos
2. 📹 **Idea de video/reel** — gancho + puntos principales (30-60 seg)
3. 📊 **Dato clave** — estadística o insight para usar como post corto

**Enfoque editorial de HYC:**
- Empresa colombiana líder en construcción y mantenimiento
- Tono: profesional, cercano, con autoridad técnica
- Temas: gestión de proyectos, calidad, innovación, tendencias del sector
- Objetivo: posicionar a Carlos como referente del sector constructor colombiano

**Al finalizar:**
Envía el reporte completo por Telegram con nivel "info". Si hay más de 3 noticias relevantes, usa nivel "success".`;

  await runAgent(prompt, { source: 'news-agent', date: new Date().toISOString() });
}
