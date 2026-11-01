import type { PostMarcaPersonalProps } from "./PostMarcaPersonal";
import type { PresentacionCarlosProps } from "./PresentacionCarlos";
import type { PresentacionPLLProps } from "./PresentacionPLL";

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
  durationInFrames: 345, // 11.5 s
  fps: 30,
  width: 1080,
  height: 1080,
} as const;

// Textos de prueba: reemplazar por el posicionamiento oficial de Project Leader Lab
export const PRESENTACION_PLL_PROPS: PresentacionPLLProps = {
  titulo: "Liderar proyectos se aprende",
  bajada: "Un laboratorio para gerentes de proyecto",
  temas: ["Gestión de proyectos", "Liderazgo de equipos", "IA aplicada"],
  cierre: "Menos teoría. Más proyectos bien entregados.",
  cta: "Project Leader Lab",
};
