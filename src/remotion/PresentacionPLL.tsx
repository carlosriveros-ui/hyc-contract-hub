// Presentación de Project Leader Lab (1080×1080, LinkedIn) → Remotion. Ver REGLA en CONTEXT.md.
// Identidad PLL (comparte paleta con Carlos, se diferencia por composición): marco dorado,
// etiqueta "PROJECT LEADER LAB" con tracking amplio, todo centrado. Paleta de videos/marcas.json.
// Textos: base de marca PLL del 1-nov-2026 (videos/marca-pll.md). El slogan es una PROPUESTA, no aprobado.
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../videos/marcas.json";

const P = MARCAS.projectleader;
const FUENTE = "Inter, system-ui, sans-serif";
const MARGEN = 56; // separación del marco al borde
const GROSOR = 3;

export type PresentacionPLLProps = {
  pregunta: string;
  temas: string[];
  apoyo: string;
  nombre: string;
  slogan: string;
  /** Parte del slogan que va en énfasis serif/itálico (debe estar contenida en `slogan`). */
  sloganEnfasis: string;
  cta: string;
};

const SERIF = "Georgia, 'Times New Roman', serif";

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

function Apertura({ pregunta }: Pick<PresentacionPLLProps, "pregunta">) {
  const a = useEntrada(30);
  return (
    <AbsoluteFill style={centro}>
      <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.1, opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>{pregunta}</div>
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

function Apoyo({ apoyo }: Pick<PresentacionPLLProps, "apoyo">) {
  const a = useEntrada(0);
  return (
    <AbsoluteFill style={centro}>
      <div style={{ width: 80, height: GROSOR, background: P.acento, marginBottom: 48, opacity: a }} />
      <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.2, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>{apoyo}</div>
    </AbsoluteFill>
  );
}

function Cierre({ nombre, slogan, sloganEnfasis, cta }: Pick<PresentacionPLLProps, "nombre" | "slogan" | "sloganEnfasis" | "cta">) {
  const a = useEntrada(0);
  const b = useEntrada(18);
  const c = useEntrada(40);
  const i = sloganEnfasis ? slogan.indexOf(sloganEnfasis) : -1;
  const partes = i >= 0 ? [slogan.slice(0, i), sloganEnfasis, slogan.slice(i + sloganEnfasis.length)] : [slogan, "", ""];
  return (
    <AbsoluteFill style={centro}>
      <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: 1, opacity: a }}>{nombre}</div>
      <div style={{ marginTop: 28, fontSize: 48, lineHeight: 1.25, opacity: b }}>
        {partes[0]}
        {/* El énfasis va en su propia línea para que no se parta a la mitad */}
        <span style={{ display: "block", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 56, color: P.acento, marginTop: 6 }}>{partes[1]}</span>
        {partes[2]}
      </div>
      <div style={{ width: 80, height: GROSOR, background: P.acento, margin: "56px 0 28px", opacity: c }} />
      <div style={{ fontSize: 32, color: P.texto, opacity: c * 0.85, letterSpacing: 1 }}>{cta}</div>
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
      {/* ~25 s: pregunta 5 s · temas 7 s · apoyo 5 s · cierre 8 s */}
      <Sequence from={0} durationInFrames={150}>
        <AbsoluteFill style={{ opacity: fundido(-8, 150) }}><Apertura pregunta={props.pregunta} /></AbsoluteFill>
      </Sequence>
      <Sequence from={150} durationInFrames={210}>
        <AbsoluteFill style={{ opacity: fundido(150, 360) }}><Temas temas={props.temas} /></AbsoluteFill>
      </Sequence>
      <Sequence from={360} durationInFrames={150}>
        <AbsoluteFill style={{ opacity: fundido(360, 510) }}><Apoyo apoyo={props.apoyo} /></AbsoluteFill>
      </Sequence>
      <Sequence from={510}>
        <AbsoluteFill style={{ opacity: fundido(510, durationInFrames + 8) }}>
          <Cierre nombre={props.nombre} slogan={props.slogan} sloganEnfasis={props.sloganEnfasis} cta={props.cta} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
