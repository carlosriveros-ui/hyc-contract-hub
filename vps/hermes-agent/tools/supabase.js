import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
);

const ALLOWED_TABLES = [
  'app_users', 'contracts', 'sites', 'activities',
  'materials', 'movements', 'contractors',
  'cost_entries', 'attendance', 'petty_cash',
];

export const supabaseTools = [
  {
    name: 'query_supabase',
    description: 'Consulta una tabla de Supabase con filtros opcionales. Útil para monitorear datos.',
    input_schema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Nombre de la tabla',
          enum: ALLOWED_TABLES,
        },
        filters: {
          type: 'object',
          description: 'Filtros key:value para aplicar (ej: {"status": "pendiente"})',
        },
        limit: {
          type: 'number',
          description: 'Máximo de filas a retornar (default 50)',
        },
        select: {
          type: 'string',
          description: 'Columnas a seleccionar (default "*")',
        },
      },
      required: ['table'],
    },
  },
  {
    name: 'count_rows',
    description: 'Cuenta filas en una tabla con filtros opcionales. Útil para métricas.',
    input_schema: {
      type: 'object',
      properties: {
        table: { type: 'string', enum: ALLOWED_TABLES },
        filters: { type: 'object', description: 'Filtros key:value' },
      },
      required: ['table'],
    },
  },
  {
    name: 'update_supabase',
    description: 'Actualiza un registro en Supabase por ID.',
    input_schema: {
      type: 'object',
      properties: {
        table: { type: 'string', enum: ALLOWED_TABLES },
        id: { type: 'string', description: 'ID del registro a actualizar' },
        data: { type: 'object', description: 'Campos a actualizar' },
      },
      required: ['table', 'id', 'data'],
    },
  },
];

export const supabaseHandlers = {
  async query_supabase({ table, filters = {}, limit = 50, select = '*' }) {
    if (!ALLOWED_TABLES.includes(table)) throw new Error(`Tabla no permitida: ${table}`);

    let query = supabase.from(table).select(select).limit(limit);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { rows: data, count: data.length };
  },

  async count_rows({ table, filters = {} }) {
    if (!ALLOWED_TABLES.includes(table)) throw new Error(`Tabla no permitida: ${table}`);

    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return { table, filters, count };
  },

  async update_supabase({ table, id, data }) {
    if (!ALLOWED_TABLES.includes(table)) throw new Error(`Tabla no permitida: ${table}`);

    const { data: updated, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { updated };
  },
};
