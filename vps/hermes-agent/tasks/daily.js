/**
 * Tareas diarias automáticas del agente Hermes.
 * Se ejecutan cada dia a las 7am hora Colombia.
 */

export async function runDailyTasks(runAgent) {
  const tasks = [
    {
      name: 'Reporte de actividades pendientes',
      prompt: `Consulta la tabla "activities" y cuenta cuántas actividades tienen status "pendiente" y "en_proceso".
      Si hay más de 10 pendientes, envía una notificación de warning por Telegram con el número exacto y una recomendación.
      Si todo está normal, envía un mensaje de info con el resumen.`,
    },
    {
      name: 'Alerta de materiales bajo stock',
      prompt: `Consulta la tabla "materials". Identifica los materiales donde el campo "stock" sea menor o igual al campo "minStock".
      Si hay materiales críticos, envía una notificación de warning por Telegram listando los materiales afectados con su stock actual y mínimo.`,
    },
    {
      name: 'Verificación de salud del sistema',
      prompt: `Verifica que la app en producción esté respondiendo correctamente.
      Revisa también el endpoint /api/data?table=contracts para confirmar que la API responde.
      Notifica por Telegram el estado del sistema (success si todo OK, error si hay problemas).`,
    },
    {
      name: 'Monitoreo de caja menor pendiente',
      prompt: `Consulta la tabla "petty_cash" filtrando por status "pendiente".
      Si hay más de 5 gastos pendientes de aprobación, envía un warning por Telegram al admin.`,
    },
  ];

  for (const task of tasks) {
    try {
      console.log(`[daily] Ejecutando: ${task.name}`);
      await runAgent(task.prompt, { taskName: task.name, source: 'daily-cron' });
    } catch (err) {
      console.error(`[daily] Error en "${task.name}":`, err.message);
    }
  }

  console.log('[daily] Todas las tareas diarias completadas');
}
