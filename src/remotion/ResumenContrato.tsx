import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";

// `type` (no `interface`) para que sea compatible con Record<string, unknown> de Remotion
export type ResumenContratoProps = {
  cliente: string;
  contrato: string;
  sedes: number;
  actividadesCompletadas: number;
  actividadesTotales: number;
};

const HYC_RED = "#CC0607";

function Titulo({ cliente, contrato }: Pick<ResumenContratoProps, "cliente" | "contrato">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ fontSize: 40, color: "#fff", opacity: 0.8 }}>{cliente}</div>
      <div style={{ fontSize: 80, fontWeight: 800, color: "#fff", textAlign: "center", padding: "0 80px" }}>{contrato}</div>
    </AbsoluteFill>
  );
}

function Avance({ sedes, actividadesCompletadas, actividadesTotales }: Omit<ResumenContratoProps, "cliente" | "contrato">) {
  const frame = useCurrentFrame();
  const pct = actividadesTotales > 0 ? actividadesCompletadas / actividadesTotales : 0;
  const progreso = interpolate(frame, [0, 45], [0, pct], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 32, color: "#fff" }}>
      <div style={{ fontSize: 48 }}>{sedes} sedes · {actividadesCompletadas}/{actividadesTotales} actividades</div>
      <div style={{ width: 1200, height: 48, background: "rgba(255,255,255,0.2)", borderRadius: 24, overflow: "hidden" }}>
        <div style={{ width: `${progreso * 100}%`, height: "100%", background: "#fff" }} />
      </div>
      <div style={{ fontSize: 96, fontWeight: 800 }}>{Math.round(progreso * 100)}%</div>
    </AbsoluteFill>
  );
}

export function ResumenContrato(props: ResumenContratoProps) {
  return (
    <AbsoluteFill style={{ background: HYC_RED, fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sequence durationInFrames={75}>
        <Titulo cliente={props.cliente} contrato={props.contrato} />
      </Sequence>
      <Sequence from={75}>
        <Avance {...props} />
      </Sequence>
    </AbsoluteFill>
  );
}

export const RESUMEN_CONTRATO = {
  id: "ResumenContrato",
  durationInFrames: 180,
  fps: 30,
  width: 1920,
  height: 1080,
} as const;
