import type { PostMarcaPersonalProps } from "./PostMarcaPersonal";
import type { PresentacionCarlosProps } from "./PresentacionCarlos";

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
