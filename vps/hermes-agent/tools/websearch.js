export const webSearchTools = [
  {
    name: 'web_search',
    description: 'Busca información en internet. Usa Brave Search si hay API key, si no usa DuckDuckGo.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Términos de búsqueda' },
        count: { type: 'number', description: 'Número de resultados (max 10, default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Obtiene el contenido texto de una URL. Útil para leer APIs o páginas web.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL a obtener' },
        as_json: { type: 'boolean', description: 'Si true, parsea la respuesta como JSON' },
      },
      required: ['url'],
    },
  },
];

export const webSearchHandlers = {
  async web_search({ query, count = 5 }) {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (apiKey) {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': apiKey,
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await res.json();
      return {
        results: (data.web?.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          description: r.description,
        })),
        source: 'brave',
      };
    }

    // Fallback gratuito: DuckDuckGo Instant Answer
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`,
      {
        headers: { 'User-Agent': 'HermesAgent-HYC/1.0' },
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    const results = (data.RelatedTopics || [])
      .filter((t) => t.FirstURL)
      .slice(0, count)
      .map((t) => ({ title: t.Text?.slice(0, 100), url: t.FirstURL, description: t.Text }));
    return { results, source: 'duckduckgo' };
  },

  async fetch_url({ url, as_json = false }) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 HermesAgent-HYC/1.0',
        Accept: as_json ? 'application/json' : 'text/html,application/json',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (as_json) {
      const data = await res.json();
      return { url, data, status: res.status };
    }

    const text = await res.text();
    const cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);
    return { url, content: cleaned, status: res.status };
  },
};
