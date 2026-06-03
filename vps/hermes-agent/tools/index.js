import { supabaseTools, supabaseHandlers } from './supabase.js';
import { deployTools, deployHandlers } from './deploy.js';
import { monitorTools, monitorHandlers } from './monitor.js';
import { notifyTools, notifyHandlers } from './notify.js';

export const toolDefinitions = [
  ...supabaseTools,
  ...deployTools,
  ...monitorTools,
  ...notifyTools,
];

const handlers = {
  ...supabaseHandlers,
  ...deployHandlers,
  ...monitorHandlers,
  ...notifyHandlers,
};

export async function executeTool(name, input) {
  const handler = handlers[name];
  if (!handler) throw new Error(`Herramienta desconocida: ${name}`);
  return handler(input);
}
