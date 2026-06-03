import express from 'express';
import crypto from 'crypto';

export function startWebhookServer(runAgent) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', agent: 'hermes', timestamp: new Date().toISOString() });
  });

  // Webhook de GitHub — se dispara cuando hay un push a main
  app.post('/webhook/github', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret) {
      const expected = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex')}`;

      if (signature !== expected) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { ref, commits, repository } = req.body;
    if (ref !== 'refs/heads/main') {
      return res.json({ ignored: true, reason: 'not main branch' });
    }

    const commitMessages = (commits || []).map((c) => c.message).join('; ');
    const prompt = `Acaba de llegar un push a main en GitHub.
Repository: ${repository?.full_name}
Commits: ${commitMessages}

Verifica el estado del último deployment en Vercel. Si el deploy falló, notifica por Telegram con nivel "error".
Si fue exitoso, envía una notificación de "success" con el resumen del deploy.`;

    runAgent(prompt, { source: 'github-webhook', ref, commits }).catch(console.error);
    res.json({ received: true });
  });

  // Endpoint manual para disparar el agente con una tarea personalizada
  app.post('/agent/run', async (req, res) => {
    const { task, context, apiKey } = req.body;

    // Protección básica con API key
    if (process.env.AGENT_API_KEY && apiKey !== process.env.AGENT_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!task) return res.status(400).json({ error: 'task is required' });

    try {
      const result = await runAgent(task, context || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`[webhook] Servidor escuchando en puerto ${PORT}`);
    console.log(`[webhook] Endpoints: GET /health | POST /webhook/github | POST /agent/run`);
  });
}
