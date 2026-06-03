// Agente SECOP — busca licitaciones relevantes para HYC Proyectos en datos.gov.co
// API pública SECOP II: https://www.datos.gov.co/resource/p6dx-8zbt.json

const SECOP2_API = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';

const PALABRAS_CLAVE = [
  'construccion', 'mantenimiento', 'obra', 'remodelacion',
  'adecuacion', 'mejoramiento', 'infraestructura', 'civil',
];

const CIUDADES = ['bogota', 'medellin', 'cali', 'barranquilla', 'armenia', 'pereira',
  'bello', 'itagui', 'envigado', 'sabaneta', 'rionegro', 'dosquebradas',
  'palmira', 'buenaventura', 'soledad', 'malambo', 'quimbaya', 'circasia'];

const CUANTIA_MIN = 400_000_000;
const CUANTIA_MAX = 10_000_000_000;

export async function runSecopAgent(runAgent) {
  const prompt = `Eres el agente de licitaciones de HYC Proyectos. Tu tarea es buscar procesos de contratación en SECOP II.

Usa la herramienta fetch_url para consultar la API pública de SECOP II:

**Paso 1 — Consulta los procesos activos:**
URL: ${SECOP2_API}?$where=estado_del_proceso='Publicado'&$limit=50&$order=fecha_de_cierre_del_proceso ASC

**Paso 2 — También consulta con palabras clave de construcción:**
Para cada una de estas keywords haz una consulta (máx 3 keywords):
- URL: ${SECOP2_API}?$where=descripci_n_del_procedimiento LIKE '%construccion%' AND estado_del_proceso='Publicado'&$limit=20

**Criterios de filtro para HYC Proyectos:**
- Objeto: construcción, mantenimiento, obra civil, remodelación, adecuación, mejoramiento, infraestructura
- Ciudades válidas: ${CIUDADES.join(', ')}
- Cuantía: entre $400,000,000 y $10,000,000,000 COP
- Estado: Publicado o En convocatoria
- Fecha cierre: próximos 90 días

**Para cada proceso relevante encontrado incluye:**
1. Nombre del proceso
2. Entidad contratante
3. Ciudad/municipio
4. Objeto del contrato
5. Cuantía estimada
6. Fecha de cierre
7. ¿Ir solo o en consorcio? (solo si <2B, consorcio si 2B-10B)
8. URL del proceso

**Al finalizar:**
- Si hay procesos: envía un reporte por Telegram con nivel "success" listando los TOP 5 más relevantes
- Si no hay: envía mensaje informativo con nivel "info"
- Guarda los hallazgos relevantes en Supabase tabla "secop_processes" si existe

Perfil HYC Proyectos: empresa colombiana de construcción y mantenimiento. Experiencia en edificaciones, redes, instalaciones. RUP vigente.`;

  await runAgent(prompt, { source: 'secop-agent', date: new Date().toISOString() });
}
