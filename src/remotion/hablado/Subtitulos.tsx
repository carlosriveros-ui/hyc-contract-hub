// Subtítulos tipo Reels: una línea a la vez, palabra activa resaltada. Tiempos por palabra (faster-whisper).
import { useCurrentFrame, useVideoConfig } from "remotion";

export type Palabra = { t: string; inicio: number; fin: number };
export type Linea = { inicio: number; fin: number; palabras: Palabra[] };

export function Subtitulos({
  lineas, colorTexto, colorActivo, fondo, y = 1450, fuente,
}: { lineas: Linea[]; colorTexto: string; colorActivo: string; fondo: string; y?: number; fuente: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // La línea se mantiene hasta que empieza la siguiente (máx. 0,6 s después de su fin) para que no parpadee
  const i = lineas.findIndex((l, k) => t >= l.inicio && t < Math.min(lineas[k + 1]?.inicio ?? Infinity, l.fin + 0.6));
  if (i < 0) return null;
  const l = lineas[i];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ background: fondo, borderRadius: 18, padding: "18px 30px", fontFamily: fuente, fontSize: 58, fontWeight: 800,
        lineHeight: 1.18, textAlign: "center", textWrap: "balance", maxWidth: 920, color: colorTexto }}>
        {l.palabras.map((w, k) => (
          <span key={k} style={{ color: t >= w.inicio ? colorActivo : colorTexto, opacity: t >= w.inicio ? 1 : 0.55 }}>
            {w.t}{k < l.palabras.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
