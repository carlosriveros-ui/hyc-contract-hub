import type { TrendingSource, GeneratedContent, ContentPlan } from "@/types/content";

export const trendingSources: TrendingSource[] = [
  {
    id: "ts-001",
    title: "BIM en 2025: Cómo la IA está revolucionando el modelado de información de construcción",
    summary: "El BIM ya no es solo un modelo 3D. Con integraciones de IA, los equipos de construcción predicen conflictos estructurales antes de romper tierra, reduciendo errores en un 40%. Los proyectos que adoptaron BIM+IA reportan ahorros promedio de 15% en costos de construcción.",
    url: "#",
    source: "Construction Dive",
    author: "María González",
    category: "ia_tecnologia",
    engagementScore: 94,
    publishedAt: "2026-05-22",
    tags: ["BIM", "IA", "construcción", "tecnología", "futuro"],
    platform: "linkedin",
    readTime: 6,
    views: 48200,
    likes: 1840,
  },
  {
    id: "ts-002",
    title: "Los 5 errores más comunes en la gestión de contratos de construcción (y cómo evitarlos)",
    summary: "Un análisis de 300 proyectos revela que el 78% de los sobrecostos se originan en contratos mal estructurados. La falta de cláusulas de escalación de precios, hitos de pago difusos y ausencia de mecanismos de resolución de conflictos son los culpables principales.",
    url: "#",
    source: "PMI Blog",
    author: "Carlos Rodríguez",
    category: "gestion_proyectos",
    engagementScore: 91,
    publishedAt: "2026-05-21",
    tags: ["contratos", "gestión", "construcción", "costos", "proyectos"],
    platform: "medium",
    readTime: 8,
    views: 32100,
    likes: 2240,
  },
  {
    id: "ts-003",
    title: "Concreto autorreparable: el material que podría eliminar el mantenimiento de infraestructura",
    summary: "Investigadores en la TU Delft desarrollaron concreto con bacterias que produce calcita para sellar grietas automáticamente. Con una vida útil 2-3 veces mayor que el concreto convencional, este material podría transformar la construcción de puentes, túneles y edificios.",
    url: "#",
    source: "Engineering News Record",
    author: "Dr. Ana Martínez",
    category: "materiales",
    engagementScore: 88,
    publishedAt: "2026-05-20",
    tags: ["materiales", "innovación", "concreto", "sostenibilidad", "I+D"],
    platform: "blog",
    readTime: 5,
    views: 27800,
    likes: 1560,
  },
  {
    id: "ts-004",
    title: "ChatGPT para ingenieros: 20 prompts que uso cada semana en mis proyectos",
    summary: "Desde generar memorandos técnicos hasta analizar planos de construcción y crear informes de avance, la IA generativa está ahorrando horas semanales a los ingenieros de campo. Aquí mis prompts más valiosos después de 6 meses de uso intensivo.",
    url: "#",
    source: "LinkedIn",
    author: "Ing. Pedro Vargas",
    category: "ia_tecnologia",
    engagementScore: 96,
    publishedAt: "2026-05-22",
    tags: ["IA", "ChatGPT", "ingeniería", "productividad", "prompts"],
    platform: "linkedin",
    readTime: 4,
    views: 89300,
    likes: 4720,
  },
  {
    id: "ts-005",
    title: "Por qué el 60% de los proyectos de construcción en Latinoamérica se entregan tarde",
    summary: "Falta de digitalización, mala coordinación entre subcontratistas y planificación optimista son la tríada que destruye los cronogramas. Proyectos que implementan herramientas digitales de seguimiento reducen retrasos en un 35%. El cambio cultural es tan importante como el tecnológico.",
    url: "#",
    source: "Construcción Latinoamérica",
    author: "Luisa Fernanda Torres",
    category: "gestion_proyectos",
    engagementScore: 89,
    publishedAt: "2026-05-19",
    tags: ["latinoamérica", "proyectos", "retrasos", "digitalización", "construcción"],
    platform: "blog",
    readTime: 7,
    views: 21500,
    likes: 980,
  },
  {
    id: "ts-006",
    title: "Drones en inspección de obras: ROI real después de 2 años de uso",
    summary: "Mi empresa implementó inspecciones con drones hace 2 años. Resultado: reducimos el tiempo de inspección en 70%, identificamos 3 fallas estructurales antes de la entrega y ahorramos $45.000 en costos de andamios. Aquí los números reales.",
    url: "#",
    source: "YouTube",
    author: "Constructor Pro",
    category: "ia_tecnologia",
    engagementScore: 92,
    publishedAt: "2026-05-21",
    tags: ["drones", "inspección", "ROI", "tecnología", "construcción"],
    platform: "youtube",
    readTime: 12,
    views: 156000,
    likes: 8900,
  },
  {
    id: "ts-007",
    title: "Lean Construction: 7 principios para eliminar el desperdicio en obra",
    summary: "El 30% de las actividades en obra son desperdicio puro. Lean Construction aplica los principios Toyota al sector: flujo continuo, pull planning, last planner y mejora continua. Proyectos Lean reducen desperdicios en 50% y mejoran productividad en 25%.",
    url: "#",
    source: "Lean Construction Institute",
    author: "Ricardo Méndez",
    category: "gestion_proyectos",
    engagementScore: 86,
    publishedAt: "2026-05-18",
    tags: ["Lean", "construcción", "productividad", "desperdicios", "metodología"],
    platform: "blog",
    readTime: 9,
    views: 18900,
    likes: 1120,
  },
  {
    id: "ts-008",
    title: "El liderazgo en construcción no se aprende en la universidad",
    summary: "Dirigí mi primer equipo de 40 personas a los 28 años sin saber nada de liderazgo. Me equivoqué mucho. Aprendí que en obra, el liderazgo se gana con botas puestas, no con título. Estas son las 5 lecciones más duras que me dio el campo.",
    url: "#",
    source: "LinkedIn",
    author: "Felipe Castro",
    category: "liderazgo",
    engagementScore: 93,
    publishedAt: "2026-05-20",
    tags: ["liderazgo", "construcción", "experiencia", "equipos", "personal"],
    platform: "linkedin",
    readTime: 3,
    views: 67200,
    likes: 3840,
  },
];

export const generatedContents: GeneratedContent[] = [
  {
    id: "gc-001",
    sourceId: "ts-004",
    topic: "IA y productividad en ingeniería",
    platform: "linkedin",
    format: "post",
    tone: "profesional",
    body: `Llevo 6 meses usando IA en mis proyectos de construcción e ingeniería.

El resultado: ahorro entre 8 y 12 horas semanales en tareas que antes consumían mi tiempo.

Aquí los 5 casos de uso que más me han transformado:

1️⃣ **Memorandos técnicos en minutos** — Le doy los datos al modelo y genera el documento base. Yo reviso y firmo.

2️⃣ **Análisis de especificaciones técnicas** — Subo PDFs de materiales y obtengo comparativas instantáneas.

3️⃣ **Informes de avance** — Desde mis notas de campo genera el informe formal listo para el cliente.

4️⃣ **Revisión de contratos** — Identifica cláusulas problemáticas y vacíos legales que podrían costar caro.

5️⃣ **Capacitación del equipo** — Genera guías procedimentales para operarios con lenguaje simple.

La IA no reemplaza el criterio del ingeniero. Amplifica su capacidad.

¿Cuál de estos casos usarías primero en tu proyecto?

#Ingeniería #Construcción #InteligenciaArtificial #Productividad #GestiónDeProyectos`,
    hashtags: ["#Ingeniería", "#Construcción", "#InteligenciaArtificial", "#Productividad", "#GestiónDeProyectos"],
    callToAction: "¿Cuál de estos casos usarías primero en tu proyecto?",
    suggestedVisual: "Infografía con los 5 casos de uso, fondo oscuro con iconos de cada herramienta",
    characterCount: 820,
    createdAt: "2026-05-22T10:30:00Z",
    status: "publicado",
    publishedAt: "2026-05-22T12:00:00Z",
  },
  {
    id: "gc-002",
    sourceId: "ts-001",
    topic: "BIM + IA en construcción",
    platform: "instagram",
    format: "carrusel",
    tone: "educativo",
    body: `📱 SLIDE 1 (Portada):
"BIM + IA = El futuro de la construcción ya llegó"

📱 SLIDE 2:
¿Qué es BIM?
Building Information Modeling = Un gemelo digital de tu proyecto con toda la información integrada.

📱 SLIDE 3:
¿Cómo entra la IA?
• Detecta conflictos estructurales automáticamente
• Predice retrasos antes de que pasen
• Optimiza rutas de construcción
• Genera estimados de costo en tiempo real

📱 SLIDE 4:
Los números no mienten:
✅ -40% de errores en obra
✅ -15% en costos de construcción
✅ +60% en velocidad de detección de problemas

📱 SLIDE 5:
¿Por dónde empezar?
1. Revit o ArchiCAD para el modelado
2. Navisworks para clash detection
3. Autodesk Construction Cloud para IA
4. Capacita a tu equipo (esto es lo más crítico)

📱 SLIDE 6 (CTA):
¿Ya usas BIM en tus proyectos?
Cuéntame en los comentarios 👇
Guarda este post para cuando lo necesites 🔖`,
    hashtags: ["#BIM", "#Construcción", "#Ingeniería", "#IAenConstrucción", "#TecnologíaConstructiva", "#ArquitecturaBIM"],
    callToAction: "¿Ya usas BIM en tus proyectos? Cuéntame en los comentarios 👇",
    suggestedVisual: "6 slides con fondo azul oscuro, datos en blanco y amarillo, ilustraciones de edificios en wireframe",
    characterCount: 1040,
    createdAt: "2026-05-21T14:00:00Z",
    status: "programado",
    scheduledFor: "2026-05-24T10:00:00Z",
  },
  {
    id: "gc-003",
    sourceId: "ts-006",
    topic: "Drones en inspección de obras",
    platform: "tiktok",
    format: "script_video",
    tone: "practico",
    body: `🎬 SCRIPT TIKTOK (60 segundos)

[0-3s] HOOK — Cámara en cara:
"¿Sigues subiendo andamios para inspeccionar tu obra? Para. Escucha esto."

[3-10s] PROBLEMA:
"Hace 2 años gastábamos $45.000 al año solo en andamios para inspecciones. Eso sin contar el tiempo y el riesgo."

[10-25s] SOLUCIÓN — Mostrar drone volando:
"Implementamos inspecciones con drones. Los números me sorprendieron:
→ Tiempo de inspección: -70%
→ Costo de andamios: $0
→ Fallas detectadas antes de entrega: 3
→ ROI en el primer año: 340%"

[25-40s] CÓMO HACERLO:
"Para empezar necesitas:
1. Un drone con cámara de 4K (desde $800)
2. Software de fotogrametría — yo uso DJI Terra
3. Piloto certificado — en Colombia exige licencia AEROCIVIL
4. Protocolo de inspección documentado"

[40-55s] RESULTADO — Mostrar imágenes del drone:
"Hoy mis clientes reciben informes visuales completos de cada inspección. Detallados, objetivos y listos en 24 horas."

[55-60s] CTA:
"¿Quieres el checklist que uso para mis inspecciones con drone? Comenta 'DRONE' y te lo mando."`,
    hashtags: ["#Construcción", "#Drones", "#Ingeniería", "#Tecnología", "#InspecciónDeObras", "#ConstructionTech"],
    callToAction: "Comenta 'DRONE' y te mando el checklist gratuito",
    suggestedVisual: "Video en obra real con drone volando, texto en pantalla con los números, transiciones rápidas",
    characterCount: 1180,
    createdAt: "2026-05-21T16:00:00Z",
    status: "borrador",
  },
  {
    id: "gc-004",
    sourceId: "ts-002",
    topic: "Errores en contratos de construcción",
    platform: "blog",
    format: "articulo_blog",
    tone: "educativo",
    body: `# Los 5 errores de contrato que le cuestan millones a los proyectos de construcción

Después de revisar más de 150 contratos de construcción en los últimos 8 años, he identificado un patrón claro: los mismos errores aparecen una y otra vez, y siempre terminan costando dinero, tiempo y relaciones comerciales.

## ¿Por qué importa esto?

Un análisis de 300 proyectos en Latinoamérica reveló que el 78% de los sobrecostos no vienen de problemas técnicos. Vienen de contratos mal estructurados.

Dicho esto, aquí están los 5 errores más costosos:

## Error #1: Ausencia de cláusulas de escalación de precios

En un contexto inflacionario, fijar precios unitarios sin mecanismos de ajuste es una trampa. Si el proyecto dura 18 meses y el precio del acero sube 25%, ¿quién absorbe eso?

**La solución:** Incluir fórmulas de ajuste atadas a índices oficiales (IPC, variación de precios de materiales).

## Error #2: Hitos de pago difusos

"Al completar la estructura" no es un hito de pago. ¿Qué significa completar? ¿Colada, desencofrado, pruebas? La ambigüedad genera disputas.

**La solución:** Hitos con criterios verificables, objetivos y medibles. Fotografías, ensayos, actas firmadas.

## Error #3: Alcance sin límites claros

El scope creep destruye los márgenes. Si el contrato no define explícitamente qué NO está incluido, el cliente asumirá que todo está incluido.

**La solución:** Una sección dedicada a exclusiones, tan detallada como la de inclusiones.

## Error #4: Sin mecanismos de resolución de conflictos

Cuando surge un desacuerdo, ¿qué pasa? Si el contrato no lo define, pasan meses de negociación improductiva o costosos procesos legales.

**La solución:** Definir escalación: primero mesa técnica, luego conciliación, luego arbitraje.

## Error #5: Condiciones de fuerza mayor indefinidas

Post-pandemia, este tema es crítico. ¿Qué eventos habilitan suspensión sin penalización? ¿Cómo se prorroga el plazo?

**La solución:** Lista taxativa de eventos, procedimiento de notificación y plazos para reanudar.

## En resumen

Un contrato bien estructurado no es protección para cuando las cosas van mal. Es el mapa para cuando las cosas van bien también.

Si quieres revisar el contrato de tu próximo proyecto con estos criterios, escríbeme y hablamos.`,
    hashtags: ["#Construcción", "#Contratos", "#GestiónDeProyectos", "#Ingeniería", "#Derecho"],
    callToAction: "¿Quieres revisar el contrato de tu próximo proyecto? Escríbeme.",
    suggestedVisual: "Imagen de un contrato con sellos y firmas, paleta corporativa",
    characterCount: 2340,
    createdAt: "2026-05-20T09:00:00Z",
    status: "publicado",
    publishedAt: "2026-05-20T11:00:00Z",
  },
];

export const contentPlan: ContentPlan[] = [
  {
    id: "cp-001",
    weekOf: "2026-05-20",
    platform: "linkedin",
    content: generatedContents[0],
    slot: "lunes",
    hour: 12,
  },
  {
    id: "cp-002",
    weekOf: "2026-05-20",
    platform: "blog",
    content: generatedContents[3],
    slot: "miercoles",
    hour: 11,
  },
  {
    id: "cp-003",
    weekOf: "2026-05-20",
    platform: "instagram",
    content: generatedContents[1],
    slot: "viernes",
    hour: 10,
  },
  {
    id: "cp-004",
    weekOf: "2026-05-27",
    platform: "tiktok",
    content: generatedContents[2],
    slot: "martes",
    hour: 18,
  },
];

// Template content for AI generation simulation
export const contentTemplates: Record<string, Record<string, string>> = {
  linkedin: {
    post: `{HOOK_STATEMENT}

Después de {EXPERIENCE}, aprendí algo que cambió cómo gestiono {TOPIC}:

{INSIGHT_1}
{INSIGHT_2}
{INSIGHT_3}

{CONCLUSION}

{CALL_TO_ACTION}

{HASHTAGS}`,
    carrusel: `SLIDE 1: "{MAIN_TITLE}"
SLIDE 2: El problema que resuelve esto...
SLIDE 3-7: Los pasos / datos / ejemplos
SLIDE 8: La conclusión y CTA`,
  },
  instagram: {
    post: `{EMOJI} {HOOK}

{BODY_SHORT}

Guarda este post 🔖 y cuéntame en los comentarios:
{QUESTION}

{HASHTAGS}`,
    story: `Pantalla 1: Pregunta provocadora
Pantalla 2: Dato sorprendente
Pantalla 3: La solución
Pantalla 4: CTA con link`,
  },
  tiktok: {
    script_video: `[0-3s] HOOK: {HOOK_PREGUNTA_DURA}
[3-15s] EL PROBLEMA en números
[15-40s] LA SOLUCIÓN paso a paso
[40-55s] EL RESULTADO real
[55-60s] CTA: "Comenta X para recibir..."`,
  },
  blog: {
    articulo_blog: `# {TITLE}

## Introducción — Por qué esto importa

## El problema en detalle

## La solución paso a paso
### Paso 1
### Paso 2
### Paso 3

## Casos de uso reales

## Conclusión y próximos pasos`,
  },
  facebook: {
    post: `{HISTORIA_PERSONAL}

{LECCIÓN_APRENDIDA}

¿A ti te ha pasado algo similar? Cuéntame en los comentarios 👇

{HASHTAGS}`,
  },
};
