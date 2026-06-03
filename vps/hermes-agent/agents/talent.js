// Agente de Talento — busca profesionales, técnicos y mano de obra para HYC Proyectos

const PERFILES_BUSCADOS = [
  {
    categoria: 'Dirección técnica',
    perfiles: ['Director de obras', 'Residente de obra', 'Ingeniero civil senior', 'Arquitecto proyectista'],
  },
  {
    categoria: 'Profesionales',
    perfiles: ['Ingeniero civil', 'Ingeniero eléctrico', 'Ingeniero sanitario', 'Arquitecto', 'Maestro eléctrico certificado'],
  },
  {
    categoria: 'Técnicos',
    perfiles: ['Técnico en construcción', 'Técnico eléctrico', 'Técnico en acabados', 'Topógrafo', 'Inspector de obras'],
  },
  {
    categoria: 'Mano de obra especializada',
    perfiles: ['Maestro de obra', 'Maestro oficial', 'Electricista', 'Plomero', 'Soldador', 'Enchapador', 'Pintor de obra'],
  },
  {
    categoria: 'Mano de obra general',
    perfiles: ['Obrero de construcción', 'Ayudante de obra', 'Operador de maquinaria'],
  },
];

const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Pereira', 'Armenia'];
const BOLSAS_EMPLEO = [
  'computrabajo.com.co',
  'elempleo.com',
  'indeed.com.co',
  'magneto.com.co',
  'linkedin.com/jobs',
];

export async function runTalentAgent(runAgent) {
  // Rota entre categorías — cada día una diferente
  const dayOfWeek = new Date().getDay();
  const categoriaHoy = PERFILES_BUSCADOS[dayOfWeek % PERFILES_BUSCADOS.length];

  const prompt = `Eres el agente de gestión de talento de HYC Proyectos. Tu misión hoy es buscar candidatos disponibles para la categoría: **${categoriaHoy.categoria}**.

**Perfiles a buscar hoy:**
${categoriaHoy.perfiles.map((p) => `- ${p}`).join('\n')}

**Ciudades de operación de HYC:** ${CIUDADES.join(', ')}

**Proceso:**

**Paso 1 — Busca candidatos disponibles:**
Usa web_search con consultas como:
- "${categoriaHoy.perfiles[0]} disponible Bogotá 2026 hoja de vida"
- "busco trabajo ${categoriaHoy.perfiles[1]} Colombia construcción"
- "maestro de obra disponible Medellín experiencia"

También busca en bolsas de empleo:
${BOLSAS_EMPLEO.map((b) => `- ${b}`).join('\n')}

Consulta: "${categoriaHoy.perfiles.join(' OR ')} Colombia construcción"

**Paso 2 — Para cada candidato o publicación relevante:**
- Perfil/cargo
- Años de experiencia aproximados
- Ciudad o disponibilidad de desplazamiento
- Contacto si está disponible
- Rango salarial o tarifa si se menciona

**Paso 3 — Analiza el mercado laboral:**
- ¿Hay escasez o abundancia de este perfil en el mercado?
- ¿Cuál es el rango salarial típico en Colombia 2026?
- ¿Hay perfiles disponibles en las ciudades de HYC?

**Reporte para HYC:**
Envía por Telegram:
- Resumen de disponibilidad de talento para: ${categoriaHoy.categoria}
- Top 3-5 candidatos o fuentes más prometedoras
- Rango salarial de referencia para presupuestar
- Recomendación: ¿dónde publicar ofertas de HYC para este perfil?
- Nivel: "success" si hay buena disponibilidad, "warning" si hay escasez

HYC Proyectos contrata por obra, por honorarios y de planta según el perfil.`;

  await runAgent(prompt, {
    source: 'talent-agent',
    categoria: categoriaHoy.categoria,
    date: new Date().toISOString(),
  });
}
