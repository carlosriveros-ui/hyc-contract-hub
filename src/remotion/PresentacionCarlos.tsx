// Presentación personal de Carlos Riveros (1080×1080, LinkedIn) → Remotion. Ver REGLA en CONTEXT.md.
// Identidad Carlos: composición editorial alineada a la izquierda, línea dorada. Paleta de videos/marcas.json.
// Sin marca HYC (la marca personal va separada). Textos del posicionamiento de la skill video-script-hyc.
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../videos/marcas.json";

const P = MARCAS["carlos-riveros"];
const FUENTE = "Inter, system-ui, sans-serif";

export type PresentacionCarlosProps = {
  nombre: string;
  cargo: string;
  pilares: string[];
  cierre: string;
  cta: string;
};

function useEntrada(retraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - retraso, fps, config: { damping: 200 } });
}

function Apertura({ nombre, cargo }: Pick<PresentacionCarlosProps, "nombre" | "cargo">) {
  const frame = useCurrentFrame();
  const linea = interpolate(frame, [0, 25], [0, 280], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const a = useEntrada(10);
  const b = useEntrada(22);
  return (
    <AbsoluteFill style={{ padding: 120, justifyContent: "center" }}>
      <div style={{ width: linea, height: 6, background: P.acento, marginBottom: 56 }} />
      <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        {nombre}
      </div>
      <div style={{ marginTop: 32, fontSize: 38, color: P.acento, opacity: b, letterSpacing: 1 }}>{cargo}</div>
    </AbsoluteFill>
  );
}

function Pilares({ pilares }: Pick<PresentacionCarlosProps, "pilares">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: 120, justifyContent: "center", gap: 28 }}>
      <div style={{ fontSize: 34, color: P.texto, opacity: 0.7, marginBottom: 12, letterSpacing: 4 }}>DONDE TRABAJO</div>
      {pilares.map((p, i) => {
        const s = spring({ frame: frame - i * 14, fps, config: { damping: 200 } });
        return (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 28, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
            <div style={{ width: 14, height: 14, background: P.acento, transform: "rotate(45deg)" }} />
            <div style={{ fontSize: 68, fontWeight: 700 }}>{p}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Cierre({ cierre, cta, nombre }: Pick<PresentacionCarlosProps, "cierre" | "cta" | "nombre">) {
  const a = useEntrada(0);
  const b = useEntrada(20);
  return (
    <AbsoluteFill style={{ padding: 120, justifyContent: "center" }}>
      <div style={{ width: 120, height: 6, background: P.acento, marginBottom: 48 }} />
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.12, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        {cierre}
      </div>
      <div style={{ marginTop: 56, fontSize: 36, color: P.acento, opacity: b }}>
        {cta} · {nombre}
      </div>
    </AbsoluteFill>
  );
}

export function PresentacionCarlos(props: PresentacionCarlosProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const salida = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  // Fundido entre bloques
  const fundido = (inicio: number, fin: number) =>
    interpolate(frame, [inicio, inicio + 8, fin - 8, fin], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: P.fondo, color: P.texto, fontFamily: FUENTE, opacity: salida }}>
      <Sequence from={0} durationInFrames={95}>
        <AbsoluteFill style={{ opacity: fundido(-8, 95) }}><Apertura nombre={props.nombre} cargo={props.cargo} /></AbsoluteFill>
      </Sequence>
      <Sequence from={95} durationInFrames={115}>
        <AbsoluteFill style={{ opacity: fundido(95, 210) }}><Pilares pilares={props.pilares} /></AbsoluteFill>
      </Sequence>
      <Sequence from={210}>
        <AbsoluteFill style={{ opacity: fundido(210, durationInFrames + 8) }}><Cierre {...props} /></AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
