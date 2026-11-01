// Videos de marca personal (Carlos Riveros / Project Leader Lab) → Remotion. Ver REGLA en CONTEXT.md.
// Nada de HYC Proyectos aquí: eso va en videos/hyc (Revideo).
// Ambas marcas comparten paleta (videos/marcas.json); se diferencian por identidad y composición.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../videos/marcas.json";

export type Marca = "carlos-riveros" | "projectleader";

// `type` (no `interface`) para que sea compatible con Record<string, unknown> de Remotion
export type PostMarcaPersonalProps = {
  marca: Marca;
  frase: string;
  autor: string;
};

export function PostMarcaPersonal({ marca, frase, autor }: PostMarcaPersonalProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = MARCAS[marca];
  const entrada = spring({ frame, fps, config: { damping: 200 } });
  const progreso = interpolate(frame, [15, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const esPLL = marca === "projectleader";

  return (
    <AbsoluteFill style={{ background: p.fondo, color: p.texto, fontFamily: "Inter, system-ui, sans-serif", opacity: salida }}>
      {esPLL ? (
        // Project Leader Lab: marco fino dorado + etiqueta de laboratorio arriba
        <AbsoluteFill style={{ top: 48, left: 48, right: 48, bottom: 48, width: "auto", height: "auto", border: `3px solid ${p.acento}`, opacity: progreso }}>
          <div style={{ position: "absolute", top: 40, left: 64, fontSize: 26, letterSpacing: 8, color: p.acento }}>
            PROJECT LEADER LAB
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ padding: 120, justifyContent: "center", alignItems: esPLL ? "center" : "flex-start", textAlign: esPLL ? "center" : "left" }}>
        {/* Carlos Riveros: línea dorada a la izquierda, composición editorial alineada a la izquierda */}
        {!esPLL && <div style={{ width: 240 * progreso, height: 6, background: p.acento, marginBottom: 48 }} />}
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.15, opacity: entrada, transform: `translateY(${(1 - entrada) * 40}px)` }}>
          “{frase}”
        </div>
        <div style={{ marginTop: 48, fontSize: 36, color: p.acento, opacity: entrada }}>
          {esPLL ? autor : `— ${autor}`}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
