// Videos de marca personal (Carlos Riveros / ProjectLeader) → Remotion. Ver REGLA en CONTEXT.md.
// Nada de HYC Proyectos aquí: eso va en videos/hyc (Revideo).
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type Marca = "carlos-riveros" | "projectleader";

// `type` (no `interface`) para que sea compatible con Record<string, unknown> de Remotion
export type PostMarcaPersonalProps = {
  marca: Marca;
  frase: string;
  autor: string;
};

// TODO: reemplazar por los colores oficiales de cada marca
const TEMAS: Record<Marca, { fondo: string; acento: string; firma: string }> = {
  "carlos-riveros": { fondo: "#0f172a", acento: "#38bdf8", firma: "Carlos Riveros" },
  projectleader: { fondo: "#111827", acento: "#f59e0b", firma: "ProjectLeader" },
};

export function PostMarcaPersonal({ marca, frase, autor }: PostMarcaPersonalProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tema = TEMAS[marca];
  const entrada = spring({ frame, fps, config: { damping: 200 } });
  const linea = interpolate(frame, [15, 60], [0, 240], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salida = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: tema.fondo, color: "#fff", fontFamily: "Inter, system-ui, sans-serif", padding: 120, justifyContent: "center", opacity: salida }}>
      <div style={{ width: linea, height: 8, background: tema.acento, marginBottom: 48 }} />
      <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.15, opacity: entrada, transform: `translateY(${(1 - entrada) * 40}px)` }}>
        “{frase}”
      </div>
      <div style={{ marginTop: 48, fontSize: 36, color: tema.acento, opacity: entrada }}>
        {autor} · {tema.firma}
      </div>
    </AbsoluteFill>
  );
}
