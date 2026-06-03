// Agente Comercial B2B — prospección de empresas y contactos para HYC Proyectos

const SECTORES = [
  { sector: 'Salud', ejemplos: 'clínicas, hospitales, centros médicos, IPS, EPS, laboratorios' },
  { sector: 'Educación', ejemplos: 'colegios, universidades, institutos, jardines infantiles' },
  { sector: 'Comercial', ejemplos: 'centros comerciales, almacenes, oficinas, bodegas, locales' },
  { sector: 'Alimentos', ejemplos: 'plantas de producción, bodegas refrigeradas, restaurantes cadena, supermercados' },
  { sector: 'Producción/Industria', ejemplos: 'fábricas, plantas industriales, zonas francas, parques industriales' },
];

const CARGOS_COMPRAS = [
  'Gerente de Compras', 'Director de Compras', 'Jefe de Compras',
  'Analista de Compras', 'Coordinador de Compras', 'Asistente de Compras',
  'Director de Logística', 'Gerente Administrativo',
];

const CARGOS_NECESIDAD = [
  'Gerente de Infraestructura', 'Director de Infraestructura',
  'Coordinador de Mantenimiento', 'Gerente de Mantenimiento',
  'Director de Proyectos', 'Gerente de Proyectos',
  'Jefe de Mantenimiento', 'Supervisor de Obras',
  'Director de Operaciones',
];

const CARGOS_DECISION = [
  'Gerente General', 'CEO', 'Presidente', 'Director General',
  'Gerente Administrativo y Financiero', 'CFO', 'Gerente Financiero',
  'Gerente de Operaciones', 'COO',
];

const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Pereira', 'Armenia'];

export async function runCommercialAgent(runAgent) {
  // Rota entre sectores — cada día un sector diferente
  const dayOfWeek = new Date().getDay();
  const sectorHoy = SECTORES[dayOfWeek % SECTORES.length];

  const prompt = `Eres el agente comercial B2B de HYC Proyectos. Tu misión hoy es identificar empresas prospecto en el sector ${sectorHoy.sector} que puedan necesitar servicios de construcción, mantenimiento, remodelación o adecuación.

**Sector de hoy: ${sectorHoy.sector}**
Tipos de empresas: ${sectorHoy.ejemplos}
Ciudades objetivo: ${CIUDADES.join(', ')}

**Proceso de prospección:**

**Paso 1 — Busca empresas del sector:**
Usa web_search con consultas como:
- "empresas ${sectorHoy.sector.toLowerCase()} Colombia ${CIUDADES[0]} grandes"
- "principales ${sectorHoy.sector.toLowerCase()} Colombia 2026"
- "directorio empresas ${sectorHoy.sector.toLowerCase()} Bogotá Medellín Cali"

Busca en directorios como:
- páginas amarillas Colombia
- Camara de Comercio Bogotá
- RUES (rues.com.co)

**Paso 2 — Para cada empresa encontrada (máx 10), busca:**
- Nombre, NIT o RUT si está disponible
- Ciudad y dirección
- Tamaño aproximado (empleados, ingresos)
- Señales de necesidad de construcción o mantenimiento (expansiones, remodelaciones anunciadas)
- Website o LinkedIn

**Paso 3 — Identifica posibles contactos:**
Para las 3-5 mejores empresas, busca en LinkedIn o web:
- Cargos de COMPRAS: ${CARGOS_COMPRAS.slice(0, 4).join(', ')}
- Cargos de NECESIDAD: ${CARGOS_NECESIDAD.slice(0, 4).join(', ')}
- Cargos de DECISIÓN: ${CARGOS_DECISION.slice(0, 3).join(', ')}

**Resultado esperado por empresa:**
- Empresa: [nombre]
- Sector: ${sectorHoy.sector}
- Ciudad: [ciudad]
- Razón para contactar: [¿por qué necesitaría servicios de HYC?]
- Contacto sugerido: [cargo ideal a contactar]
- LinkedIn/web: [si disponible]
- Estrategia de acercamiento: [qué decirle]

**Mensaje para HYC:**
Al finalizar, envía por Telegram:
- Nivel "success" si encuentras 5+ prospectos
- Nivel "info" si encuentras 2-4
- Un resumen ejecutivo de los mejores 5 prospectos
- Sugiere un mensaje de primer contacto para el mejor prospecto

HYC Proyectos: empresa colombiana con 10+ años de experiencia en construcción, mantenimiento y adecuaciones. Proyectos desde $50M hasta $10B COP.`;

  await runAgent(prompt, {
    source: 'commercial-agent',
    sector: sectorHoy.sector,
    date: new Date().toISOString(),
  });
}
