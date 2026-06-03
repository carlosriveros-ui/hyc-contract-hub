import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import cron from 'node-cron';
import { startWebhookServer } from './tasks/webhook.js';
import { runDailyTasks } from './tasks/daily.js';
import { toolDefinitions, executeTool } from './tools/index.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres Hermes, el agente autónomo de HYC Contract Hub.
Tu misión es monitorear y operar el sistema de gestión de contratos de mantenimiento de HYC Proyectos.

Tienes acceso a estas herramientas:
- Consultar y actualizar datos en Supabase (contratos, actividades, materiales, etc.)
- Verificar el estado de la app en producción
- Triggear deploys en Vercel
- Enviar notificaciones por Telegram
- Ejecutar tareas de mantenimiento programadas

Actúa de forma autónoma. Cuando detectes un problema, intenta resolverlo.
Cuando completes una tarea, reporta el resultado.
Siempre prioriza la integridad de los datos y la disponibilidad del sistema.`;

/**
 * Loop agentico: ejecuta una tarea con Claude hasta completarla.
 * Claude puede llamar herramientas múltiples veces hasta dar una respuesta final.
 */
export async function runAgent(task, context = {}) {
  console.log(`[hermes] Tarea: ${task}`);

  const messages = [
    {
      role: 'user',
      content: `${task}\n\nContexto: ${JSON.stringify(context)}`,
    },
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      console.log(`[hermes] Completado: ${text}`);
      return { success: true, result: text };
    }

    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter((b) => b.type === 'tool_use');

      // Agrega el turno del asistente con las tool calls
      messages.push({ role: 'assistant', content: response.content });

      // Ejecuta todas las herramientas en paralelo
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          console.log(`[hermes] Usando herramienta: ${toolCall.name}`);
          try {
            const result = await executeTool(toolCall.name, toolCall.input);
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result),
            };
          } catch (err) {
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              is_error: true,
              content: `Error: ${err.message}`,
            };
          }
        })
      );

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  return { success: false, result: 'Máximo de iteraciones alcanzado' };
}

// Cron jobs — tareas automáticas programadas
function setupCronJobs() {
  // Diariamente a las 7am hora Colombia (UTC-5 = 12:00 UTC)
  cron.schedule('0 12 * * *', async () => {
    console.log('[cron] Ejecutando tareas diarias...');
    await runDailyTasks(runAgent);
  });

  // Cada hora — monitoreo de salud del sistema
  cron.schedule('0 * * * *', async () => {
    await runAgent('Verifica el estado de la app. Si hay errores o anomalías, notifica por Telegram.');
  });

  // Cada lunes a las 8am Colombia — resumen semanal
  cron.schedule('0 13 * * 1', async () => {
    await runAgent(
      'Genera un resumen semanal del estado de contratos, actividades pendientes y materiales bajos en stock. Envía el resumen por Telegram.'
    );
  });

  console.log('[hermes] Cron jobs configurados (diario 7am, monitoreo cada hora, resumen lunes 8am)');
}

async function main() {
  console.log('=== Hermes Agent — HYC Contract Hub ===');
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`Puerto webhook: ${process.env.PORT || 3000}`);

  setupCronJobs();
  startWebhookServer(runAgent);

  // Tarea inicial al arrancar
  await runAgent('Haz una verificación inicial: confirma que la base de datos de Supabase está accesible y la app en producción responde. Reporta el estado.');
}

main().catch((err) => {
  console.error('[hermes] Error fatal:', err);
  process.exit(1);
});
