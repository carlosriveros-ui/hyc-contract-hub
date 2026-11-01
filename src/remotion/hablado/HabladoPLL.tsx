// Video hablado de Project Leader Lab (grabación + animación) → Remotion. Ver REGLA en CONTEXT.md.
// Identidad PLL: marco dorado, etiqueta "PROJECT LEADER LAB", centrado; slogan aprobado con énfasis serif itálico.
import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../../videos/marcas.json";
import SUBS from "../../../videos/producciones/2026-11-presentaciones/subtitulos-pll.json";
import { Subtitulos, type Linea } from "./Subtitulos";

const P = MARCAS.projectleader;
const FUENTE = "Inter, system-ui, sans-serif";
const SERIF = "Georgia, 'DejaVu Serif', serif";
export const PLL_FIN_VIDEO = 39.0;
export const PLL_CIERRE = 2.5;

const seg = (t: number, a: number, b: number, fade = 0.3) =>
  interpolate(t, [a, a + fade, b - fade, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export function HabladoPLL() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const temas = [
    { n: "01", txt: "Gerencia de proyectos", entra: 14.5 },
    { n: "02", txt: "Liderazgo de equipos", entra: 16.0 },
    { n: "03", txt: "IA aplicada con criterio", entra: 17.2 },
  ];
  const marco = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fin = spring({ frame: frame - PLL_FIN_VIDEO * fps, fps, config: { damping: 200 } });
  const caja = { background: P.fondo + "e6", borderRadius: 8, fontFamily: FUENTE, color: P.texto } as const;
  return (
    <AbsoluteFill style={{ background: P.fondo }}>
      <OffthreadVideo src={staticFile("pll.mp4")} endAt={Math.round(PLL_FIN_VIDEO * fps)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Marco dorado + etiqueta (identidad PLL), presentes todo el video */}
      <div style={{ position: "absolute", inset: 40, border: `3px solid ${P.acento}`, opacity: marco }} />
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", opacity: marco }}>
        <span style={{ ...caja, fontSize: 24, letterSpacing: 10, color: P.acento, padding: "10px 22px" }}>PROJECT LEADER LAB</span>
      </div>

      {/* Temas del Lab, numerados, al nombrarlos */}
      <div style={{ position: "absolute", top: 1130, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: seg(t, 14.3, 25.2) }}>
        {temas.map((m) => {
          const s = spring({ frame: frame - m.entra * fps, fps, config: { damping: 200 } });
          return (
            <div key={m.n} style={{ ...caja, opacity: s, transform: `translateY(${(1 - s) * 20}px)`, padding: "12px 28px", fontSize: 40, fontWeight: 700 }}>
              <span style={{ color: P.acento, marginRight: 16 }}>{m.n}</span>{m.txt}
            </div>
          );
        })}
      </div>

      {/* URL al decirla */}
      <div style={{ position: "absolute", top: 1290, width: "100%", textAlign: "center", opacity: seg(t, 35.7, PLL_FIN_VIDEO + 0.3) }}>
        <span style={{ ...caja, fontSize: 40, fontWeight: 700, color: P.acento, padding: "14px 30px" }}>projectleaderlab.com</span>
      </div>

      <Subtitulos lineas={SUBS as Linea[]} colorTexto={P.texto} colorActivo={P.acento} fondo={P.fondo + "d9"} fuente={FUENTE} />

      {/* Tarjeta final: nombre + slogan aprobado + web */}
      <AbsoluteFill style={{ background: P.fondo, opacity: fin, justifyContent: "center", alignItems: "center", textAlign: "center", color: P.texto, fontFamily: FUENTE }}>
        <div style={{ position: "absolute", inset: 40, border: `3px solid ${P.acento}` }} />
        <div style={{ fontSize: 26, letterSpacing: 10, color: P.acento, marginBottom: 80 }}>PROJECT LEADER LAB</div>
        <div style={{ fontSize: 84, fontWeight: 800 }}>Project Leader Lab</div>
        <div style={{ fontSize: 50, marginTop: 30 }}>Lidera proyectos con</div>
        <div style={{ fontSize: 60, fontFamily: SERIF, fontStyle: "italic", color: P.acento, marginTop: 6 }}>criterio y propósito</div>
        <div style={{ width: 90, height: 3, background: P.acento, margin: "60px 0 30px" }} />
        <div style={{ fontSize: 36 }}>projectleaderlab.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
