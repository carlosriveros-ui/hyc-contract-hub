// Reel vertical de Carlos Riveros (1080×1920, Reels/Shorts/TikTok/LinkedIn) → Remotion. Ver REGLA en CONTEXT.md.
// Identidad Carlos: editorial, alineado a la izquierda, línea dorada. Paleta de videos/marcas.json. Sin HYC.
// Guion con las reglas de la skill video-script-hyc (gancho directo, máx. 2 puntos, perspectiva, cierre con
// pregunta) y SIN cifras: no inventar datos ni usar cifras de HYC en la marca personal.
// Zona segura de Reels: todo el texto entre el 15 % superior e inferior (y 288–1632 px).
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../videos/marcas.json";

const P = MARCAS["carlos-riveros"];
const FUENTE = "Inter, system-ui, sans-serif";
const SEGURA = { top: 288, bottom: 288 }; // 15 % de 1920

export type ReelCarlosProps = {
  gancho: string;
  giro: string;
  puntosTitulo: string;
  puntos: string[];
  perspectiva: string;
  pregunta: string;
  nombre: string;
  cargo: string;
  cta: string;
};

function useEntrada(retraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - retraso, fps, config: { damping: 200 } });
}

/** Contenedor de texto dentro de la zona segura, alineado a la izquierda (identidad Carlos). */
function Zona({ children }: { children: React.ReactNode }) {
  return (
    // textWrap "balance" reparte las líneas parejas y evita palabras sueltas al final ("mes.", "va.")
    <AbsoluteFill style={{ paddingTop: SEGURA.top, paddingBottom: SEGURA.bottom, paddingLeft: 96, paddingRight: 96, justifyContent: "center", textWrap: "balance" }}>
      {children}
    </AbsoluteFill>
  );
}

function Linea({ ancho = 200, retraso = 0 }: { ancho?: number; retraso?: number }) {
  const frame = useCurrentFrame();
  const w = interpolate(frame - retraso, [0, 18], [0, ancho], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <div style={{ width: w, height: 8, background: P.acento, marginBottom: 56 }} />;
}

function Gancho({ gancho, giro }: Pick<ReelCarlosProps, "gancho" | "giro">) {
  const a = useEntrada(4);
  const b = useEntrada(105); // el giro entra a los 3,5 s
  return (
    <Zona>
      <Linea />
      <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.08, opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>{gancho}</div>
      <div style={{ marginTop: 56, fontSize: 92, fontWeight: 800, lineHeight: 1.08, color: P.acento, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>
        {giro}
      </div>
    </Zona>
  );
}

function Puntos({ puntosTitulo, puntos }: Pick<ReelCarlosProps, "puntosTitulo" | "puntos">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useEntrada(0);
  return (
    <Zona>
      <div style={{ fontSize: 44, letterSpacing: 4, color: P.acento, marginBottom: 72, opacity: t }}>{puntosTitulo.toUpperCase()}</div>
      {puntos.map((p, i) => {
        const s = spring({ frame: frame - 20 - i * 75, fps, config: { damping: 200 } });
        return (
          <div key={p} style={{ display: "flex", gap: 36, marginBottom: 72, opacity: s, transform: `translateX(${(1 - s) * -50}px)` }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: P.acento, minWidth: 96 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.15 }}>{p}</div>
          </div>
        );
      })}
    </Zona>
  );
}

function Perspectiva({ perspectiva }: Pick<ReelCarlosProps, "perspectiva">) {
  const a = useEntrada(0);
  return (
    <Zona>
      <Linea ancho={120} />
      <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.15, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>{perspectiva}</div>
    </Zona>
  );
}

function Cierre({ pregunta, nombre, cargo, cta }: Pick<ReelCarlosProps, "pregunta" | "nombre" | "cargo" | "cta">) {
  const a = useEntrada(0);
  const b = useEntrada(45);
  return (
    <Zona>
      <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>{pregunta}</div>
      <div style={{ marginTop: 120, opacity: b }}>
        <div style={{ width: 120, height: 8, background: P.acento, marginBottom: 40 }} />
        <div style={{ fontSize: 56, fontWeight: 800 }}>{nombre}</div>
        <div style={{ marginTop: 12, fontSize: 36, color: P.acento }}>{cargo}</div>
        <div style={{ marginTop: 40, fontSize: 36, opacity: 0.8 }}>{cta}</div>
      </div>
    </Zona>
  );
}

/** Barra de progreso fina (hábito de lectura en Reels), dentro de la zona segura superior. */
function Progreso() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: SEGURA.top + 24, left: 96, right: 96, height: 4, background: P.texto + "22" }}>
      <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: P.acento }} />
    </div>
  );
}

// Tiempos (30 fps): gancho 0–8 s · puntos 8–17 s · perspectiva 17–21 s · cierre 21–27 s
const T = { gancho: [0, 240], puntos: [240, 510], perspectiva: [510, 630] } as const;

export function ReelCarlos(props: ReelCarlosProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fundido = (inicio: number, fin: number) =>
    interpolate(frame, [inicio, inicio + 8, fin - 8, fin], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bloque = (desde: number, hasta: number, el: React.ReactNode) => (
    <Sequence from={desde} durationInFrames={hasta - desde}>
      <AbsoluteFill style={{ opacity: fundido(desde === 0 ? -8 : desde, hasta) }}>{el}</AbsoluteFill>
    </Sequence>
  );
  return (
    <AbsoluteFill style={{ background: P.fondo, color: P.texto, fontFamily: FUENTE }}>
      <Progreso />
      {bloque(T.gancho[0], T.gancho[1], <Gancho gancho={props.gancho} giro={props.giro} />)}
      {bloque(T.puntos[0], T.puntos[1], <Puntos puntosTitulo={props.puntosTitulo} puntos={props.puntos} />)}
      {bloque(T.perspectiva[0], T.perspectiva[1], <Perspectiva perspectiva={props.perspectiva} />)}
      {bloque(T.perspectiva[1], durationInFrames + 8, <Cierre {...props} />)}
    </AbsoluteFill>
  );
}
