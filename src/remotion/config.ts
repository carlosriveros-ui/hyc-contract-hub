import type { PostMarcaPersonalProps } from "./PostMarcaPersonal";
import type { PresentacionCarlosProps } from "./PresentacionCarlos";
import type { PresentacionPLLProps } from "./PresentacionPLL";
import type { ReelCarlosProps } from "./ReelCarlos";

export const POST_MARCA_PERSONAL = {
  id: "PostMarcaPersonal",
  durationInFrames: 180,
  fps: 30,
  width: 1080,
  height: 1080, // cuadrado, para LinkedIn
} as const;

export const POST_DEFAULT_PROPS: PostMarcaPersonalProps = {
  marca: "carlos-riveros",
  frase: "Un proyecto bien liderado se nota en los detalles que nadie ve.",
  autor: "Carlos Riveros",
};

export const PRESENTACION_CARLOS = {
  id: "PresentacionCarlos",
  durationInFrames: 345, // 11.5 s
  fps: 30,
  width: 1080,
  height: 1080,
} as const;

export const PRESENTACION_CARLOS_PROPS: PresentacionCarlosProps = {
  nombre: "Carlos Riveros",
  cargo: "Gerente de Constructoras · PMP · MBA",
  pilares: ["Construcción de campo", "Gerencia de proyectos", "IA aplicada"],
  cierre: "Gestión de proyectos con IA, desde la obra.",
  cta: "Sígueme en LinkedIn",
};

export const PRESENTACION_PLL = {
  id: "PresentacionPLL",
  durationInFrames: 750, // 25 s
  fps: 30,
  width: 1080,
  height: 1080,
} as const;

// Textos de la base de marca PLL (1-nov-2026, videos/marca-pll.md).
// Slogan "Lidera proyectos con criterio y propósito": APROBADO por Carlos (1-nov-2026).
export const PRESENTACION_PLL_PROPS: PresentacionPLLProps = {
  pregunta: "¿Qué decisión necesita hoy tu proyecto?",
  temas: ["Gerencia de proyectos", "Liderazgo de equipos", "IA aplicada con criterio"],
  apoyo: "Conecta lo que aprendes con lo que necesitas ejecutar.",
  nombre: "Project Leader Lab",
  slogan: "Lidera proyectos con criterio y propósito",
  sloganEnfasis: "criterio y propósito",
  cta: "Conoce el Lab en projectleaderlab.com",
};

export const REEL_CARLOS = {
  id: "ReelCarlos",
  durationInFrames: 810, // 27 s
  fps: 30,
  width: 1080,
  height: 1920, // 9:16 vertical (Reels / Shorts / TikTok)
} as const;

// Guion de prueba (reglas de video-script-hyc; sin cifras). Textos para aprobación de Carlos.
export const REEL_CARLOS_PROPS: ReelCarlosProps = {
  gancho: "El cronograma no se atrasa el último mes.",
  giro: "Se atrasa el primer día que nadie lo revisa.",
  puntosTitulo: "Dos hábitos que lo evitan",
  puntos: ["Compara avance contra plan cada semana.", "Pregunta qué decisión está pendiente, no solo qué porcentaje va."],
  perspectiva: "En obra, el atraso se ve tarde porque se mide tarde.",
  pregunta: "¿Cada cuánto revisas el cronograma con tu equipo?",
  nombre: "Carlos Riveros",
  cargo: "Gerente de Constructoras · PMP · MBA",
  cta: "Sígueme para más gestión de proyectos",
};
