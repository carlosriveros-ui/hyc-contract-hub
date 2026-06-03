// Agente SECOP — busca licitaciones relevantes para HYC Proyectos en datos.gov.co
// API pública SECOP II: https://www.datos.gov.co/resource/p6dx-8zbt.json

const SECOP2_API = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';

const PALABRAS_CLAVE = [
  'construccion', 'mantenimiento', 'obra', 'remodelacion',
  'adecuacion', 'mejoramiento', 'infraestructura', 'civil',
  'ampliacion', 'restauracion', 'reforzamiento', 'demolicion',
];

// Ciudades principales + municipios aledaños a máx 1 hora de transporte
const CIUDADES = [
  // Bogotá y Sabana
  'bogota', 'soacha', 'chia', 'cajica', 'zipaquira', 'facatativa',
  'fusagasuga', 'mosquera', 'madrid', 'funza', 'siberia', 'cota',
  // Medellín y Valle de Aburrá + Oriente
  'medellin', 'bello', 'itagui', 'envigado', 'sabaneta', 'caldas',
  'copacabana', 'girardota', 'barbosa', 'rionegro', 'la ceja', 'marinilla',
  // Cali y alrededores
  'cali', 'palmira', 'yumbo', 'jamundi', 'candelaria', 'florida',
  // Barranquilla y alrededores
  'barranquilla', 'soledad', 'malambo', 'puerto colombia', 'galapa', 'baranoa',
  // Pereira y Eje Cafetero
  'pereira', 'dosquebradas', 'santa rosa de cabal', 'la virginia', 'cartago',
  // Armenia y Quindío
  'armenia', 'calarca', 'montenegro', 'la tebaida', 'quimbaya', 'circasia',
  // Manizales y alrededores
  'manizales', 'villamaria', 'chinchina', 'palestina', 'anserma',
  // Tunja y Boyacá
  'tunja', 'duitama', 'paipa', 'chiquinquira', 'sogamoso', 'nobsa', 'tibasosa',
];

const CUANTIA_MIN = 400_000_000;   // $400 millones COP
const CUANTIA_MAX = 10_000_000_000; // $10 mil millones COP

export async function runSecopAgent(runAgent) {
  const prompt = `Eres el agente de licitaciones de HYC Proyectos de Ingeniería SAS. Busca procesos de contratación activos en SECOP II.

**Rango de cuantías válido para HYC:**
- Mínimo: $400.000.000 COP (cuatrocientos millones)
- Máximo: $10.000.000.000 COP (diez mil millones)
- Por encima de $2.000.000.000: HYC puede ir en consorcio
- Por debajo de $2.000.000.000: HYC puede ir solo

**Ciudades y municipios válidos:**
Ciudades principales: Bogotá, Medellín, Cali, Barranquilla, Pereira, Armenia, Manizales, Tunja, Sogamoso
Municipios aledaños (máx 1 hora): ${CIUDADES.filter(c => !['bogota','medellin','cali','barranquilla','pereira','armenia','manizales','tunja','sogamoso'].includes(c)).join(', ')}

**Paso 1 — Consulta SECOP II (datos.gov.co):**
Usa fetch_url con estas URLs (cambia la keyword en cada consulta):

Consulta 1 - Construcción:
${SECOP2_API}?$where=descripci_n_del_procedimiento LIKE '%construcci%25n%' AND estado_del_proceso='Publicado'&$limit=30&$order=fecha_de_cierre_del_proceso ASC

Consulta 2 - Mantenimiento:
${SECOP2_API}?$where=descripci_n_del_procedimiento LIKE '%mantenimiento%' AND estado_del_proceso='Publicado'&$limit=30&$order=fecha_de_cierre_del_proceso ASC

Consulta 3 - Obras:
${SECOP2_API}?$where=descripci_n_del_procedimiento LIKE '%obra%' AND estado_del_proceso='Publicado'&$limit=30&$order=fecha_de_cierre_del_proceso ASC

Asegúrate de hacer fetch_url con as_json=true para parsear los resultados.

**Paso 2 — Filtra los resultados:**
De todos los procesos obtenidos, selecciona SOLO los que cumplan:
✅ Ciudad/municipio en la lista válida de HYC
✅ Cuantía entre $400.000.000 y $10.000.000.000 COP
✅ Objeto: construcción, mantenimiento, obra, remodelación, adecuación, mejoramiento, infraestructura
✅ Estado: Publicado o En selección
✅ Fecha de cierre: en los próximos 90 días

**Paso 3 — Para cada proceso válido incluye:**
- 🏗️ Nombre del proceso
- 🏛️ Entidad contratante
- 📍 Ciudad/municipio
- 📋 Objeto del contrato
- 💰 Cuantía: $X.XXX.XXX.XXX (formato legible)
- 📅 Fecha de cierre
- 🤝 Modalidad: Solo (<$2B) | Consorcio ($2B-$10B)
- 🔗 Link si disponible

**Reporte Telegram:**
- Si hay 5+ procesos relevantes: nivel "success"
- Si hay 1-4 procesos: nivel "info"
- Si no hay ninguno: nivel "info" indicando que no se encontraron procesos este ciclo
- Máximo 5 procesos en el mensaje (los más prometedores por cuantía y fecha de cierre)`;

  await runAgent(prompt, { source: 'secop-agent', date: new Date().toISOString() });
}
