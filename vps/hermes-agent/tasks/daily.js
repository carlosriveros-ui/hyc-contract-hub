import { runSecopAgent } from '../agents/secop.js';
import { runNewsCarlosAgent } from '../agents/news-carlos.js';
import { runNewsHycAgent } from '../agents/news-hyc.js';
import { runPricesAgent } from '../agents/prices.js';
import { runCommercialAgent } from '../agents/commercial.js';
import { runTalentAgent } from '../agents/talent.js';

/**
 * Tareas diarias del sistema HYC (monitoreo interno)
 */
export async function runDailyTasks(runAgent) {
  const tasks = [
    {
      name: 'Reporte de actividades pendientes',
      prompt: `Consulta la tabla "activities" y cuenta cuántas actividades tienen status "pendiente" y "en_proceso".
      Si hay más de 10 pendientes, envía una notificación de warning por Telegram.
      Si todo está normal, envía un mensaje de info con el resumen.`,
    },
    {
      name: 'Alerta de materiales bajo stock',
      prompt: `Consulta la tabla "materials". Identifica los materiales donde "stock" sea menor o igual a "minStock".
      Si hay materiales críticos, envía warning por Telegram listando los afectados con stock actual y mínimo.`,
    },
    {
      name: 'Verificación de salud del sistema',
      prompt: `Verifica que la app en producción esté respondiendo. Revisa /api/data?table=contracts.
      Notifica por Telegram el estado: success si OK, error si hay problemas.`,
    },
    {
      name: 'Monitoreo de caja menor pendiente',
      prompt: `Consulta "petty_cash" filtrando por status "pendiente".
      Si hay más de 5 pendientes de aprobación, envía warning por Telegram al admin.`,
    },
  ];

  for (const task of tasks) {
    try {
      console.log(`[daily] ${task.name}`);
      await runAgent(task.prompt, { taskName: task.name, source: 'daily-cron' });
    } catch (err) {
      console.error(`[daily] Error en "${task.name}":`, err.message);
    }
  }
}

/**
 * Tareas de inteligencia de negocio (mañana, 7:30am COT)
 */
export async function runBusinessIntelligenceTasks(runAgent) {
  console.log('[BI] Iniciando tareas de inteligencia de negocio...');

  // Noticias marca personal Carlos Riveros — diario
  try {
    console.log('[BI] Noticias → Carlos Riveros...');
    await runNewsCarlosAgent(runAgent);
  } catch (err) {
    console.error('[BI] Error noticias Carlos:', err.message);
  }

  // Noticias marca corporativa HYC Proyectos — diario
  try {
    console.log('[BI] Noticias → HYC Proyectos...');
    await runNewsHycAgent(runAgent);
  } catch (err) {
    console.error('[BI] Error noticias HYC:', err.message);
  }

  // Prospección comercial — diario (rota sector cada día)
  try {
    console.log('[BI] Agente comercial B2B...');
    await runCommercialAgent(runAgent);
  } catch (err) {
    console.error('[BI] Error agente comercial:', err.message);
  }
}

/**
 * Tareas de licitaciones — Lunes, Miércoles y Viernes a las 8am COT
 */
export async function runSecopTasks(runAgent) {
  console.log('[SECOP] Buscando licitaciones...');
  try {
    await runSecopAgent(runAgent);
  } catch (err) {
    console.error('[SECOP] Error:', err.message);
  }
}

/**
 * Precios de insumos — Lunes y Jueves
 */
export async function runPricesTasks(runAgent) {
  console.log('[PRECIOS] Monitoreando precios de insumos...');
  try {
    await runPricesAgent(runAgent);
  } catch (err) {
    console.error('[PRECIOS] Error:', err.message);
  }
}

/**
 * Búsqueda de talento — Martes y Viernes
 */
export async function runTalentTasks(runAgent) {
  console.log('[TALENTO] Buscando perfiles...');
  try {
    await runTalentAgent(runAgent);
  } catch (err) {
    console.error('[TALENTO] Error:', err.message);
  }
}
