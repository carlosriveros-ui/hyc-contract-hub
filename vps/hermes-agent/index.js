import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import cron from 'node-cron';
import { startWebhookServer } from './tasks/webhook.js';
import { startTelegramListener } from './tasks/telegram-listener.js';
import {
  runDailyTasks,
  runBusinessIntelligenceTasks,
  runSecopTasks,
  runPricesTasks,
  runTalentTasks,
} from './tasks/daily.js';
import { toolDefinitions, executeTool } from './tools/index.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres Hermes, el agente autónomo de inteligencia de negocio de HYC Proyectos (Colombia).

HYC Proyectos es una empresa colombiana especializada en construcción, mantenimiento, remodelaciones,
adecuaciones y obras civiles. Opera en Bogotá, Medellín, Cali, Barranquilla, Pereira y Armenia.

Tus responsabilidades:
1. **Monitoreo del sistema**: app, base de datos, contratos, actividades, inventarios
2. **Inteligencia comercial**: prospectar empresas B2B en salud, educación, comercial, alimentos, industria
3. **Licitaciones SECOP**: buscar procesos relevantes de 400M a 10B COP
4. **Precios de insumos**: monitorear cemento, acero, concretos, materiales de construcción
5. **Noticias del sector**: construcción, inmobiliario, tecnología y materiales para contenido
6. **Talento**: buscar profesionales, técnicos y mano de obra especializada

Siempre comunica en español. Sé conciso en Telegram (máx 4000 chars).
Usa emojis apropiados para hacer los mensajes más legibles.
Prioriza información accionable para Carlos Riveros (CEO de HYC Proyectos).`;

const MODEL_SMART = 'claude-sonnet-5-5';
const MODEL_FAST = 'claude-haiku-5-5';

export async function runAgent(task, context = {}, model = MODEL_SMART) {
  console.log(`[hermes] Tarea [${model.split('-')[1]}]: ${task.slice(0, 80)}...`);

  const messages = [
    {
      role: 'user',
      content: `${task}\n\nContexto adicional: ${JSON.stringify(context)}`,
    },
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 8;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model,
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
      console.log(`[hermes] Completado (${iterations} pasos)`);
      return { success: true, result: text };
    }

    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter((b) => b.type === 'tool_use');
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          console.log(`[hermes] → ${toolCall.name}`);
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

// Ping HTTP simple a la app — costo $0 en créditos AI.
// Solo llama a Claude si detecta un problema real.
async function runHealthCheck() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return;

  try {
    const resp = await fetch(`${appUrl}/api/data?table=contracts`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    console.log('[health] ✅ App OK');
  } catch (err) {
    console.error('[health] ⚠️ App caída:', err.message);
    // Solo aquí usamos créditos — cuando hay un problema real
    await runAgent(
      `ALERTA: La app en producción (${appUrl}) no responde. Error: ${err.message}.
      Envía una alerta de error por Telegram indicando que la app está caída.`,
      { source: 'health-check', error: err.message },
      MODEL_FAST
    ).catch((e) => console.error('[health] Error notificando:', e.message));
  }
}

function setupCronJobs() {
  // ─── SISTEMA HYC (todos los días 7:00am COT = 12:00 UTC) — Haiku ───
  cron.schedule('0 12 * * *', async () => {
    console.log('[cron] Tareas diarias del sistema...');
    await runDailyTasks(runAgent, MODEL_FAST);
  });

  // ─── NOTICIAS + PROSPECCIÓN COMERCIAL (L-V 7:30am COT = 12:30 UTC) — Sonnet ───
  cron.schedule('30 12 * * 1-5', async () => {
    console.log('[cron] Inteligencia de negocio...');
    await runBusinessIntelligenceTasks(runAgent);
  });

  // ─── SECOP LICITACIONES (L, X, V a las 8am COT = 13:00 UTC) — Sonnet ───
  cron.schedule('0 13 * * 1,3,5', async () => {
    console.log('[cron] Buscando licitaciones SECOP...');
    await runSecopTasks(runAgent);
  });

  // ─── PRECIOS INSUMOS (L y J a las 9am COT = 14:00 UTC) — Sonnet ───
  cron.schedule('0 14 * * 1,4', async () => {
    console.log('[cron] Monitoreando precios de insumos...');
    await runPricesTasks(runAgent);
  });

  // ─── TALENTO (M y V a las 9am COT = 14:00 UTC) — Sonnet ───
  cron.schedule('0 14 * * 2,5', async () => {
    console.log('[cron] Buscando talento...');
    await runTalentTasks(runAgent);
  });

  // ─── MONITOREO DE SALUD (cada 4 horas) — HTTP ping, sin créditos AI ───
  cron.schedule('0 */4 * * *', async () => {
    await runHealthCheck();
  });

  // ─── RESUMEN SEMANAL (Lunes 8am COT = 13:00 UTC) — Sonnet ───
  cron.schedule('0 13 * * 1', async () => {
    await runAgent(
      `Genera el resumen semanal de HYC Proyectos:
      1. Estado del sistema (contratos, actividades, materiales)
      2. Mejores prospectos comerciales encontrados esta semana
      3. Licitaciones SECOP activas más prometedoras
      4. Variaciones de precios de insumos relevantes
      5. Talentos disponibles encontrados
      Envía el resumen completo por Telegram con nivel "info".`,
      { source: 'weekly-summary' }
    );
  });

  console.log('[hermes] ✅ Cron jobs configurados:');
  console.log('   • Sistema HYC: diario 7am COT (Haiku)');
  console.log('   • Noticias + Comercial: L-V 7:30am COT (Sonnet)');
  console.log('   • SECOP: L,X,V 8am COT (Sonnet)');
  console.log('   • Precios: L,J 9am COT (Sonnet)');
  console.log('   • Talento: M,V 9am COT (Sonnet)');
  console.log('   • Salud: cada 4 horas (HTTP ping, $0 AI)');
  console.log('   • Resumen semanal: Lunes 8am COT (Sonnet)');
}

async function main() {
  console.log('╔════════════════════════════════════╗');
  console.log('║  Hermes Agent — HYC Proyectos      ║');
  console.log('╚════════════════════════════════════╝');
  console.log(`Ambiente: ${process.env.NODE_ENV}`);

  setupCronJobs();
  startWebhookServer(runAgent);
  startTelegramListener(runAgent);

  // Ping inicial sin Claude — solo verifica conectividad
  await runHealthCheck();

  // Bienvenida por Telegram — usa Haiku (barato)
  try {
    await runAgent(
      `Envía un mensaje de bienvenida por Telegram indicando que Hermes está activo. Lista los agentes:
       - 🏗️ Sistema HYC (contratos, actividades, materiales) — diario 7am
       - 🎯 Agente Comercial B2B (prospectos en 5 sectores) — L-V 7:30am
       - 📋 Agente SECOP (licitaciones 400M-10B COP) — L,X,V 8am
       - 📰 Agente de Noticias (contenido LinkedIn) — L-V 7:30am
       - 💰 Agente de Precios (insumos de construcción) — L,J 9am
       - 👷 Agente de Talento (profesionales y mano de obra) — M,V 9am
      Usa nivel "success".`,
      { source: 'startup' },
      MODEL_FAST
    );
  } catch (err) {
    console.error('[hermes] Error en bienvenida (no fatal):', err.message);
  }
}

main().catch((err) => {
  console.error('[hermes] Error fatal:', err);
  process.exit(1);
});
