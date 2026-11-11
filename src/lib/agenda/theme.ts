// Tema visual de la agenda derivado de videos/marcas.json (fuente única de color).
// Aquí no hay HEX sueltos: todo sale de la paleta y de mezclas entre sus colores.

import type { AgendaBrand } from "./types.js";

export interface MarcasJson {
  hyc: { rojo: string; negro: string; blanco: string };
  "carlos-riveros": { fondo: string; texto: string; acento: string };
}

export interface AgendaTheme {
  /** Fondo de página (claro). */
  paper: string;
  /** Superficie de tarjetas. */
  card: string;
  /** Texto principal y bloques oscuros. */
  ink: string;
  /** Texto secundario. */
  muted: string;
  /** Bordes y líneas. */
  line: string;
  /** Color de acción. */
  accent: string;
  /** Texto sobre `accent`. */
  onAccent: string;
  /** Fondo suave para estados seleccionables. */
  soft: string;
  /** Texto sobre `ink`. */
  onInk: string;
  brandName: string;
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mezcla `a` con `b`: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return "#" + ra.map((v, i) => Math.round(v + (rb[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Aclara un color hacia el blanco (t = 0 → igual, t = 1 → blanco). */
export function lighten(hex: string, t: number): string {
  return "#" + toRgb(hex).map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function buildTheme(marcas: MarcasJson, brand: AgendaBrand): AgendaTheme {
  if (brand === "hyc") {
    const { rojo, negro, blanco } = marcas.hyc;
    return {
      paper: mix(blanco, negro, 0.04),
      card: blanco,
      ink: negro,
      muted: mix(negro, blanco, 0.42),
      line: mix(blanco, negro, 0.12),
      accent: rojo,
      onAccent: blanco,
      soft: mix(blanco, rojo, 0.08),
      onInk: blanco,
      brandName: "HYC Proyectos",
    };
  }
  const { fondo, texto, acento } = marcas["carlos-riveros"];
  // El dorado sobre crema no alcanza contraste para texto: los botones usan el
  // fondo oscuro y el dorado queda para acentos, selección y detalles.
  return {
    paper: texto,
    card: lighten(texto, 0.55),
    ink: fondo,
    muted: mix(fondo, texto, 0.45),
    line: mix(texto, fondo, 0.12),
    accent: acento,
    onAccent: luminance(acento) > 0.35 ? fondo : texto,
    soft: mix(texto, acento, 0.18),
    onInk: texto,
    brandName: "Carlos Riveros",
  };
}
