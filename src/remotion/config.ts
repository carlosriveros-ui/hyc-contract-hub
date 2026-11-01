import type { PostMarcaPersonalProps } from "./PostMarcaPersonal";

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
