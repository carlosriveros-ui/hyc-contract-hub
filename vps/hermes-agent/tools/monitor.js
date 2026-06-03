export const monitorTools = [
  {
    name: 'check_app_health',
    description: 'Verifica que la app de producción esté respondiendo correctamente.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL a verificar (default: APP_URL del .env)',
        },
      },
    },
  },
  {
    name: 'check_api_endpoint',
    description: 'Llama un endpoint de la API y verifica que responda con status 200.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path del endpoint, ej: /api/data?table=contracts',
        },
      },
      required: ['path'],
    },
  },
];

export const monitorHandlers = {
  async check_app_health({ url } = {}) {
    const target = url || process.env.APP_URL;
    const start = Date.now();

    try {
      const res = await fetch(target, { signal: AbortSignal.timeout(10000) });
      const latency = Date.now() - start;
      return {
        url: target,
        status: res.status,
        ok: res.ok,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        url: target,
        status: 'error',
        ok: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async check_api_endpoint({ path }) {
    const base = process.env.APP_URL;
    const url = `${base}${path}`;
    const start = Date.now();

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const latency = Date.now() - start;
      const body = await res.text();
      return {
        url,
        status: res.status,
        ok: res.ok,
        latencyMs: latency,
        bodyPreview: body.slice(0, 200),
      };
    } catch (err) {
      return { url, ok: false, error: err.message };
    }
  },
};
