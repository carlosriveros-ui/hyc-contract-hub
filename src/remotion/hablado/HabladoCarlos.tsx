// Video hablado de Carlos Riveros (grabación + animación) → Remotion. Ver REGLA en CONTEXT.md.
// Fuente: videos/producciones/2026-11-presentaciones (render con --public-dir .../fuentes).
// Identidad Carlos: editorial, alineado a la izquierda, línea dorada. Paleta videos/marcas.json. Sin HYC.
import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../../videos/marcas.json";
import SUBS from "../../../videos/producciones/2026-11-presentaciones/subtitulos-carlos.json";
import { Subtitulos, type Linea } from "./Subtitulos";

const P = MARCAS["carlos-riveros"];
const FUENTE = "Inter, system-ui, sans-serif";
export const CARLOS_FIN_VIDEO = 50.0; // s — corta el silencio final de la grabación
export const CARLOS_CIERRE = 2.5;     // s de tarjeta final

const seg = (t: number, a: number, b: number, fade = 0.3) =>
  interpolate(t, [a, a + fade, b - fade, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

function Tarjeta({ children, opacity, y }: { children: React.ReactNode; opacity: number; y: number }) {
  return (
    <div style={{ position: "absolute", left: 72, top: y, opacity, transform: `translateX(${(1 - opacity) * -30}px)`,
      background: P.fondo + "e6", borderLeft: `8px solid ${P.acento}`, padding: "24px 32px", borderRadius: 6, color: P.texto, fontFamily: FUENTE }}>
      {children}
    </div>
  );
}

export function HabladoCarlos() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const mundos = [
    { txt: "OBRA", entra: 18.5, activo: [22.16, 25.0] },
    { txt: "GERENCIA", entra: 19.2, activo: [25.0, 29.3] },
    { txt: "IA", entra: 20.3, activo: [29.3, 35.4] },
  ];
  const cierre = spring({ frame: frame - CARLOS_FIN_VIDEO * fps, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: P.fondo }}>
      <OffthreadVideo src={staticFile("carlos.mp4")} endAt={Math.round(CARLOS_FIN_VIDEO * fps)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Nombre y credenciales (lo que Carlos dice en cámara) */}
      <Tarjeta opacity={seg(t, 6.6, 15.8)} y={1160}>
        <div style={{ fontSize: 56, fontWeight: 800 }}>Carlos Riveros</div>
        <div style={{ fontSize: 30, color: P.acento, marginTop: 8 }}>Gerente de proyectos · PMP · MBA</div>
        <div style={{ fontSize: 30, color: P.texto, opacity: 0.85, marginTop: 4 }}>Docente de posgrado · Fundador de empresas</div>
      </Tarjeta>

      {/* Tres mundos: aparecen al nombrarlos y se ilumina el que explica */}
      <div style={{ position: "absolute", left: 72, top: 1220, display: "flex", gap: 18, opacity: seg(t, 18.3, 35.6) }}>
        {mundos.map((m) => {
          const s = spring({ frame: frame - m.entra * fps, fps, config: { damping: 200 } });
          const on = t >= m.activo[0] && t < m.activo[1];
          return (
            <div key={m.txt} style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)`, fontFamily: FUENTE, fontSize: 40, fontWeight: 800, letterSpacing: 3,
              padding: "14px 26px", borderRadius: 6, background: on ? P.acento : P.fondo + "e6", color: on ? P.fondo : P.texto }}>
              {m.txt}
            </div>
          );
        })}
      </div>

      {/* Pregunta final */}
      <Tarjeta opacity={seg(t, 44.8, CARLOS_FIN_VIDEO + 0.3)} y={1250}>
        <div style={{ fontSize: 34, color: P.acento }}>💬 Comenta</div>
      </Tarjeta>

      <Subtitulos lineas={SUBS as Linea[]} colorTexto={P.texto} colorActivo={P.acento} fondo={P.fondo + "d9"} fuente={FUENTE} />

      {/* Tarjeta final */}
      <AbsoluteFill style={{ background: P.fondo, opacity: cierre, padding: "0 96px", justifyContent: "center", color: P.texto, fontFamily: FUENTE }}>
        <div style={{ width: 200 * cierre, height: 8, background: P.acento, marginBottom: 48 }} />
        <div style={{ fontSize: 100, fontWeight: 800 }}>Carlos Riveros</div>
        <div style={{ fontSize: 40, color: P.acento, marginTop: 20 }}>Gerente de proyectos · PMP · MBA</div>
        <div style={{ fontSize: 38, marginTop: 64, opacity: 0.85 }}>Sígueme para más gestión de proyectos</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
