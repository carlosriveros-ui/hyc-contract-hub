// Presentación de Project Leader Lab (1080×1080, LinkedIn) → Remotion. Ver REGLA en CONTEXT.md.
// Identidad PLL (comparte paleta con Carlos, se diferencia por composición): marco dorado,
// etiqueta "PROJECT LEADER LAB" con tracking amplio, todo centrado. Paleta de videos/marcas.json.
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../videos/marcas.json";

const P = MARCAS.projectleader;
const FUENTE = "Inter, system-ui, sans-serif";
const MARGEN = 56; // separación del marco al borde
const GROSOR = 3;

export type PresentacionPLLProps = {
  titulo: string;
  bajada: string;
  temas: string[];
  cierre: string;
  cta: string;
};

/** Marco dorado que se dibuja: arriba y abajo crecen desde el centro, luego los lados. */
function Marco() {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const v = interpolate(frame, [12, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const lado = `calc(100% - ${MARGEN * 2}px)`;
  const base = { position: "absolute" as const, background: P.acento };
  return (
    <AbsoluteFill>
      <div style={{ ...base, top: MARGEN, left: "50%", height: GROSOR, width: lado, transform: `translateX(-50%) scaleX(${h})` }} />
      <div style={{ ...base, bottom: MARGEN, left: "50%", height: GROSOR, width: lado, transform: `translateX(-50%) scaleX(${h})` }} />
      <div style={{ ...base, left: MARGEN, top: "50%", width: GROSOR, height: lado, transform: `translateY(-50%) scaleY(${v})` }} />
      <div style={{ ...base, right: MARGEN, top: "50%", width: GROSOR, height: lado, transform: `translateY(-50%) scaleY(${v})` }} />
    </AbsoluteFill>
  );
}

function Etiqueta() {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [24, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: MARGEN + 36, width: "100%", textAlign: "center", fontSize: 24, letterSpacing: 10, color: P.acento, opacity: o }}>
      PROJECT LEADER LAB
    </div>
  );
}

function useEntrada(retraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - retraso, fps, config: { damping: 200 } });
}

const centro: React.CSSProperties = { justifyContent: "center", alignItems: "center", textAlign: "center", padding: 140 };

function Apertura({ titulo, bajada }: Pick<PresentacionPLLProps, "titulo" | "bajada">) {
  const a = useEntrada(30);
  const b = useEntrada(44);
  return (
    <AbsoluteFill style={centro}>
      <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>{titulo}</div>
      <div style={{ marginTop: 36, fontSize: 36, color: P.texto, opacity: b * 0.75 }}>{bajada}</div>
    </AbsoluteFill>
  );
}

function Temas({ temas }: Pick<PresentacionPLLProps, "temas">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ ...centro, gap: 40 }}>
      {temas.map((t, i) => {
        const s = spring({ frame: frame - i * 14, fps, config: { damping: 200 } });
        return (
          <div key={t} style={{ opacity: s, transform: `translateY(${(1 - s) * 24}px)` }}>
            <div style={{ fontSize: 26, color: P.acento, letterSpacing: 6 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 60, fontWeight: 700, marginTop: 4 }}>{t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Cierre({ cierre, cta }: Pick<PresentacionPLLProps, "cierre" | "cta">) {
  const a = useEntrada(0);
  const b = useEntrada(20);
  return (
    <AbsoluteFill style={centro}>
      <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.15, opacity: a }}>{cierre}</div>
      <div style={{ width: 80, height: GROSOR, background: P.acento, margin: "48px 0 32px", opacity: b }} />
      <div style={{ fontSize: 32, color: P.acento, letterSpacing: 2, opacity: b }}>{cta}</div>
    </AbsoluteFill>
  );
}

export function PresentacionPLL(props: PresentacionPLLProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const salida = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const fundido = (inicio: number, fin: number) =>
    interpolate(frame, [inicio, inicio + 8, fin - 8, fin], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: P.fondo, color: P.texto, fontFamily: FUENTE, opacity: salida }}>
      <Marco />
      <Etiqueta />
      <Sequence from={0} durationInFrames={110}>
        <AbsoluteFill style={{ opacity: fundido(-8, 110) }}><Apertura titulo={props.titulo} bajada={props.bajada} /></AbsoluteFill>
      </Sequence>
      <Sequence from={110} durationInFrames={110}>
        <AbsoluteFill style={{ opacity: fundido(110, 220) }}><Temas temas={props.temas} /></AbsoluteFill>
      </Sequence>
      <Sequence from={220}>
        <AbsoluteFill style={{ opacity: fundido(220, durationInFrames + 8) }}><Cierre cierre={props.cierre} cta={props.cta} /></AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
