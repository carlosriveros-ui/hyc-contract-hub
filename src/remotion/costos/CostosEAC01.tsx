// "Ingeniería de costos en 30 segundos" #01 — Tu presupuesto no es tu pronóstico (EAC).
// Carlos Riveros · LinkedIn feed 4:5 (1080×1350) · 30 s → Remotion (marca personal). Ver REGLA en CONTEXT.md.
// Identidad Carlos: editorial, alineado a la izquierda, línea dorada. Paleta solo de videos/marcas.json.
// Cifras del caso (aprobadas por Carlos, 2-nov-2026): BAC 100M · 60 % completado · AC 70M.
// Los paquetes de la gráfica de burbujas y el histograma de proyectos anteriores son ILUSTRATIVOS (se rotulan así).
// Música: videos/producciones/2026-11-costos-01/musica.py → fuentes/musica.wav (render con --public-dir).
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import MARCAS from "../../../videos/marcas.json";

const P = MARCAS["carlos-riveros"];
const RET = MARCAS.projectleader.reticula; // retícula discreta (paleta compartida Carlos/PLL)
const FUENTE = "Inter, system-ui, sans-serif";
const W = 1080;
const MARGEN = 88;
const ANCHO = W - MARGEN * 2; // 904

// ---------------------------------------------------------------- caso
const BAC = 100;
const AVANCE = 0.6;
const AC = 70;
const EV = BAC * AVANCE; // 60
const CPI = EV / AC; // 0,857
const EAC1 = AC + (BAC - EV); // 110
const EAC2 = BAC / CPI; // 116,67
const fmt = (n: number, dec = 0) => n.toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// Escenas (frames a 30 fps)
const T = {
  gancho: [0, 90],
  datos: [90, 240],
  cpi: [240, 390],
  metodos: [390, 600],
  historico: [600, 720],
  leccion: [720, 810],
  cierre: [810, 900],
} as const;

// ---------------------------------------------------------------- utilidades
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function useEntrada(retraso = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - retraso, fps, config: { damping: 200 } });
}

function avance(frame: number, desde: number, dur: number) {
  return interpolate(frame, [desde, desde + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
}

function Linea({ ancho = 160, retraso = 0 }: { ancho?: number; retraso?: number }) {
  const frame = useCurrentFrame();
  const w = interpolate(frame - retraso, [0, 18], [0, ancho], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <div style={{ width: w, height: 6, background: P.acento, marginBottom: 36 }} />;
}

function Aparece({ retraso = 0, y = 26, children, style }: { retraso?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const a = useEntrada(retraso);
  return <div style={{ opacity: a, transform: `translateY(${(1 - a) * y}px)`, ...style }}>{children}</div>;
}

function Titulo({ children, retraso = 0, size = 64 }: { children: React.ReactNode; retraso?: number; size?: number }) {
  return (
    <Aparece retraso={retraso}>
      <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.08, textWrap: "balance" }}>{children}</div>
    </Aparece>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 26, letterSpacing: 4, color: P.acento, fontWeight: 600, marginBottom: 18 }}>{children}</div>;
}

function Escena({ children }: { children: React.ReactNode }) {
  return <AbsoluteFill style={{ padding: `170px ${MARGEN}px 80px`, justifyContent: "center" }}>{children}</AbsoluteFill>;
}

/** Formula con conteo del resultado */
function Formula({ izq, der, retraso = 0 }: { izq: string; der: React.ReactNode; retraso?: number }) {
  return (
    <Aparece retraso={retraso} style={{ display: "flex", alignItems: "baseline", gap: 18, fontSize: 44, fontWeight: 600, marginTop: 14 }}>
      <span style={{ opacity: 0.85 }}>{izq}</span>
      <span style={{ color: P.acento, fontWeight: 800 }}>{der}</span>
    </Aparece>
  );
}

function Contador({ hasta, dec = 0, desde, dur = 24, sufijo = "" }: { hasta: number; dec?: number; desde: number; dur?: number; sufijo?: string }) {
  const frame = useCurrentFrame();
  const v = hasta * avance(frame, desde, dur);
  return <>{fmt(v, dec) + sufijo}</>;
}

// ---------------------------------------------------------------- 1. gancho
function Gancho() {
  return (
    <AbsoluteFill style={{ padding: `0 ${MARGEN}px`, justifyContent: "center" }}>
      <Linea ancho={220} />
      <Titulo size={104}>Tu presupuesto</Titulo>
      <Titulo size={104} retraso={14}>
        <span style={{ color: P.acento }}>no es tu pronóstico.</span>
      </Titulo>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 2. datos + barras
function Barras() {
  const frame = useCurrentFrame();
  const H = 560;
  const base = 610;
  const escala = H / 110;
  const barras = [
    { nombre: "Presupuesto", sigla: "BAC", v: BAC, color: P.texto, op: 0.28, d: 30 },
    { nombre: "Valor ganado", sigla: "EV = 60 %", v: EV, color: P.acento, op: 1, d: 45 },
    { nombre: "Costo real", sigla: "AC", v: AC, color: P.texto, op: 0.9, d: 60 },
  ];
  const bw = 200;
  const gap = (ANCHO - bw * 3) / 2;
  const brecha = avance(frame, 85, 18);
  return (
    <svg width={ANCHO} height={700} style={{ overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={0} x2={ANCHO} y1={base - g * escala} y2={base - g * escala} stroke={RET[1]} strokeWidth={2} />
        </g>
      ))}
      {barras.map((b, i) => {
        const h = b.v * escala * avance(frame, b.d, 26);
        const x = i * (bw + gap);
        return (
          <g key={b.nombre}>
            <rect x={x} y={base - h} width={bw} height={h} fill={b.color} opacity={b.op} rx={6} />
            <text x={x + bw / 2} y={base - h - 18} textAnchor="middle" fontSize={46} fontWeight={800} fill={b.color === P.acento ? P.acento : P.texto} opacity={h > 0 ? 1 : 0}>
              {fmt(b.v * avance(frame, b.d, 26))}M
            </text>
            <text x={x + bw / 2} y={base + 46} textAnchor="middle" fontSize={30} fontWeight={700} fill={P.texto}>{b.nombre}</text>
            <text x={x + bw / 2} y={base + 84} textAnchor="middle" fontSize={26} fill={P.acento}>{b.sigla}</text>
          </g>
        );
      })}
      {/* brecha AC − EV */}
      <g opacity={brecha}>
        <line x1={bw + gap} x2={2 * (bw + gap) + bw} y1={base - EV * escala} y2={base - EV * escala} stroke={P.acento} strokeWidth={3} strokeDasharray="10 8" />
        <text x={2 * (bw + gap) + bw / 2} y={base - 65 * escala + 12} textAnchor="middle" fontSize={34} fontWeight={800} fill={P.fondo}>
          −10M
        </text>
      </g>
    </svg>
  );
}

function Datos() {
  return (
    <Escena>
      <Etiqueta>UN PAQUETE DE TRABAJO</Etiqueta>
      <Titulo size={58}>Presupuesto 100M · 60 % completado · 70M gastados</Titulo>
      <div style={{ marginTop: 80 }}>
        <Barras />
      </div>
    </Escena>
  );
}

// ---------------------------------------------------------------- 3. CPI + burbujas
const PAQUETES = [ // ilustrativos: avance %, CPI, presupuesto M
  { x: 20, y: 1.08, s: 40 },
  { x: 35, y: 0.97, s: 65 },
  { x: 48, y: 1.04, s: 30 },
  { x: 75, y: 0.93, s: 55 },
  { x: 86, y: 1.02, s: 45 },
];

function Burbujas() {
  const frame = useCurrentFrame();
  const Wc = ANCHO - 70;
  const Hc = 560;
  const x0 = 70;
  const sx = (v: number) => x0 + (v / 100) * Wc;
  const sy = (v: number) => Hc - ((v - 0.75) / (1.15 - 0.75)) * Hc;
  const r = (s: number) => Math.sqrt(s) * 7.5;
  const nuestro = spring({ frame: frame - 70, fps: 30, config: { damping: 12, mass: 0.8 } });
  return (
    <svg width={ANCHO} height={Hc + 70} style={{ overflow: "visible" }}>
      {[0.8, 0.9, 1.0, 1.1].map((g) => (
        <g key={g}>
          <line x1={x0} x2={ANCHO} y1={sy(g)} y2={sy(g)} stroke={g === 1 ? P.texto : RET[1]} strokeWidth={g === 1 ? 2 : 2} strokeDasharray={g === 1 ? "8 8" : undefined} opacity={g === 1 ? 0.6 : 1} />
          <text x={x0 - 14} y={sy(g) + 9} textAnchor="end" fontSize={24} fill={P.texto} opacity={0.6}>{fmt(g, 1)}</text>
        </g>
      ))}
      <text x={ANCHO} y={sy(1) - 14} textAnchor="end" fontSize={24} fill={P.texto} opacity={0.7}>CPI = 1 · en presupuesto</text>
      {PAQUETES.map((p, i) => {
        const a = spring({ frame: frame - 20 - i * 6, fps: 30, config: { damping: 14 } });
        return <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={r(p.s) * a} fill={P.texto} opacity={0.16} stroke={P.texto} strokeOpacity={0.4} strokeWidth={2} />;
      })}
      <circle cx={sx(AVANCE * 100)} cy={sy(CPI)} r={r(BAC) * nuestro} fill={P.acento} opacity={0.9} />
      <g opacity={avance(frame, 85, 12)}>
        <text x={sx(AVANCE * 100) + r(BAC) + 18} y={sy(CPI) + 2} fontSize={30} fontWeight={800} fill={P.acento}>Este paquete</text>
        <text x={sx(AVANCE * 100) + r(BAC) + 18} y={sy(CPI) + 38} fontSize={26} fill={P.texto}>CPI {fmt(CPI, 2)}</text>
      </g>
      <text x={x0} y={Hc + 50} fontSize={22} fill={P.texto} opacity={0.55}>
        Avance (%) → · tamaño = presupuesto · otros paquetes: ilustrativos
      </text>
    </svg>
  );
}

function IndiceCPI() {
  return (
    <Escena>
      <Etiqueta>ÍNDICE DE DESEMPEÑO DEL COSTO</Etiqueta>
      <Formula izq="CPI = EV ÷ AC = 60M ÷ 70M =" der={<Contador hasta={CPI} dec={2} desde={10} />} />
      <Aparece retraso={30}>
        <div style={{ marginTop: 26, fontSize: 40, fontWeight: 600, lineHeight: 1.2 }}>
          Cada <b>$1,00</b> gastado produce <span style={{ color: P.acento, fontWeight: 800 }}>$0,86</span> de trabajo.
        </div>
      </Aparece>
      <div style={{ marginTop: 56 }}>
        <Burbujas />
      </div>
    </Escena>
  );
}

// ---------------------------------------------------------------- 4. área: métodos 1 y 2
function Area() {
  const frame = useCurrentFrame();
  const x0 = 80;
  const Wc = ANCHO - x0 - 150;
  const Hc = 640;
  const sx = (v: number) => x0 + (v / 100) * Wc;
  const sy = (v: number) => Hc - (v / 125) * Hc;
  // curva S del costo real hasta hoy (60 % → 70M)
  const real = Array.from({ length: 31 }, (_, i) => {
    const p = (i / 30) * 60;
    const k = p / 60;
    return [p, AC * (k * k * (3 - 2 * k) * 0.55 + k * 0.45)] as const;
  });
  const pReal = avance(frame, 6, 34);
  const n = Math.max(2, Math.round(pReal * 30) + 1);
  const pts = real.slice(0, n);
  const ruta = pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x)},${sy(y)}`).join(" ");
  const areaReal = `${ruta} L${sx(pts[pts.length - 1][0])},${sy(0)} L${sx(0)},${sy(0)} Z`;

  const p1 = avance(frame, 50, 26);
  const p2 = avance(frame, 110, 26);
  const pr = avance(frame, 160, 20);
  const fin = (eac: number, p: number) => [60 + 40 * p, AC + (eac - AC) * p] as const;
  const [x1, y1] = fin(EAC1, p1);
  const [x2, y2] = fin(EAC2, p2);
  const rango = `M${sx(60)},${sy(AC)} L${sx(100)},${sy(EAC1)} L${sx(100)},${sy(EAC2)} Z`;

  return (
    <svg width={ANCHO} height={Hc + 60} style={{ overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={x0} x2={sx(100)} y1={sy(g)} y2={sy(g)} stroke={RET[1]} strokeWidth={2} />
          <text x={x0 - 14} y={sy(g) + 9} textAnchor="end" fontSize={24} fill={P.texto} opacity={0.6}>{g}M</text>
        </g>
      ))}
      {/* presupuesto */}
      <line x1={sx(0)} x2={sx(100)} y1={sy(BAC)} y2={sy(BAC)} stroke={P.texto} strokeWidth={2} strokeDasharray="10 8" opacity={0.6} />
      <text x={sx(2)} y={sy(BAC) - 14} fontSize={26} fill={P.texto} opacity={0.75}>BAC 100M</text>
      {/* hoy */}
      <line x1={sx(60)} x2={sx(60)} y1={sy(0)} y2={sy(122)} stroke={P.texto} strokeWidth={2} opacity={0.35 * pReal} />
      <text x={sx(60)} y={sy(122) - 10} textAnchor="middle" fontSize={24} fill={P.texto} opacity={0.7 * pReal}>HOY · 60 %</text>
      <path d={areaReal} fill={P.acento} opacity={0.22} />
      <path d={ruta} fill="none" stroke={P.acento} strokeWidth={5} />
      {/* rango entre métodos */}
      <path d={rango} fill={P.acento} opacity={0.3 * pr} />
      {p1 > 0 && <line x1={sx(60)} y1={sy(AC)} x2={sx(x1)} y2={sy(y1)} stroke={P.texto} strokeWidth={4} strokeDasharray="12 8" />}
      {p2 > 0 && <line x1={sx(60)} y1={sy(AC)} x2={sx(x2)} y2={sy(y2)} stroke={P.acento} strokeWidth={4} strokeDasharray="12 8" />}
      <g opacity={avance(frame, 72, 10)}>
        <text x={sx(100) + 14} y={sy(EAC1) + 30} fontSize={30} fontWeight={800} fill={P.texto}>① 110M</text>
      </g>
      <g opacity={avance(frame, 132, 10)}>
        <text x={sx(100) + 14} y={sy(EAC2) - 10} fontSize={30} fontWeight={800} fill={P.acento}>② 116,7M</text>
      </g>
      <text x={x0} y={Hc + 50} fontSize={22} fill={P.texto} opacity={0.55}>Costo acumulado vs. avance (%)</text>
    </svg>
  );
}

function Metodo({ n, formula, nota, retraso, color }: { n: string; formula: string; nota: string; retraso: number; color: string }) {
  return (
    <Aparece retraso={retraso} y={18} style={{ display: "flex", gap: 22, alignItems: "flex-start", marginBottom: 18 }}>
      <div style={{ fontSize: 40, fontWeight: 800, color, minWidth: 44 }}>{n}</div>
      <div>
        <div style={{ fontSize: 34, fontWeight: 800, color }}>{formula}</div>
        <div style={{ fontSize: 26, opacity: 0.75, marginTop: 4 }}>{nota}</div>
      </div>
    </Aparece>
  );
}

function Metodos() {
  return (
    <Escena>
      <Etiqueta>¿CUÁNTO COSTARÁ AL TERMINAR?</Etiqueta>
      <Metodo n="1" color={P.texto} retraso={44} formula="EAC = AC + (BAC − EV) = 110M" nota="Supone que el sobrecosto se detiene hoy. Suele ser optimista." />
      <Metodo n="2" color={P.acento} retraso={104} formula="EAC = BAC ÷ CPI = 116,7M" nota="Realista si la causa raíz aún no se corrige." />
      <div style={{ marginTop: 24 }}>
        <Area />
      </div>
    </Escena>
  );
}

// ---------------------------------------------------------------- 5. histograma: método 3
const HIST = [1, 2, 4, 7, 10, 9, 6, 3, 1]; // ilustrativo: EAC final de proyectos anteriores, bins de 2M desde 104M

function Histograma() {
  const frame = useCurrentFrame();
  const x0 = 20;
  const Wc = ANCHO - 40;
  const Hc = 560;
  const desde = 104;
  const hasta = 122;
  const sx = (v: number) => x0 + ((v - desde) / (hasta - desde)) * Wc;
  const bw = Wc / HIST.length;
  const max = Math.max(...HIST);
  const marcas = avance(frame, 60, 14);
  return (
    <svg width={ANCHO} height={Hc + 90} style={{ overflow: "visible" }}>
      {HIST.map((c, i) => {
        const a = avance(frame, 12 + i * 4, 18);
        const h = (c / max) * (Hc - 40) * a;
        const lo = desde + i * 2;
        const dentro = lo + 1 >= EAC1 && lo + 1 <= EAC2;
        return <rect key={i} x={x0 + i * bw + 4} y={Hc - h} width={bw - 8} height={h} rx={4} fill={dentro ? P.acento : P.texto} opacity={dentro ? 0.95 : 0.25} />;
      })}
      <line x1={x0} x2={x0 + Wc} y1={Hc} y2={Hc} stroke={P.texto} strokeOpacity={0.4} strokeWidth={2} />
      {[
        { v: EAC1, t: "① 110M", c: P.texto },
        { v: EAC2, t: "② 116,7M", c: P.acento },
      ].map((m) => (
        <g key={m.t} opacity={marcas}>
          <line x1={sx(m.v)} x2={sx(m.v)} y1={0} y2={Hc} stroke={m.c} strokeWidth={3} strokeDasharray="10 8" />
          <text x={sx(m.v)} y={-14} textAnchor="middle" fontSize={28} fontWeight={800} fill={m.c}>{m.t}</text>
        </g>
      ))}
      {[104, 110, 116, 122].map((v) => (
        <text key={v} x={sx(v)} y={Hc + 40} textAnchor="middle" fontSize={24} fill={P.texto} opacity={0.6}>{v}M</text>
      ))}
      <text x={x0} y={Hc + 82} fontSize={22} fill={P.texto} opacity={0.55}>EAC final de proyectos anteriores (ilustrativo)</text>
    </svg>
  );
}

function Historico() {
  return (
    <Escena>
      <Etiqueta>3 · TENDENCIA HISTÓRICA</Etiqueta>
      <Titulo size={50}>El CPI temprano suele recuperarse: la respuesta cae entre 1 y 2.</Titulo>
      <div style={{ marginTop: 90 }}>
        <Histograma />
      </div>
    </Escena>
  );
}

// ---------------------------------------------------------------- 6. lección y 7. cierre
function Leccion() {
  return (
    <AbsoluteFill style={{ padding: `0 ${MARGEN}px`, justifyContent: "center" }}>
      <Linea />
      <Titulo size={72}>Reporta un rango, no un número.</Titulo>
      <Aparece retraso={14}>
        <div style={{ marginTop: 34, fontSize: 52, fontWeight: 800, color: P.acento }}>VAC: −10M a −16,7M</div>
      </Aparece>
      <Aparece retraso={28}>
        <div style={{ marginTop: 34, fontSize: 36, lineHeight: 1.35, opacity: 0.9 }}>Explica causa · impacto · acción correctiva.</div>
      </Aparece>
      <Aparece retraso={44}>
        <div style={{ marginTop: 18, fontSize: 36, fontWeight: 700 }}>Un solo EAC esconde el riesgo.</div>
      </Aparece>
    </AbsoluteFill>
  );
}

function Cierre() {
  return (
    <AbsoluteFill style={{ padding: `0 ${MARGEN}px`, justifyContent: "center" }}>
      <Titulo size={66}>¿Qué método reporta tu proyecto?</Titulo>
      <Aparece retraso={10}>
        <div style={{ marginTop: 24, fontSize: 44, color: P.acento, fontWeight: 800 }}>Responde 1, 2 o 3 en los comentarios.</div>
      </Aparece>
      <Aparece retraso={26} style={{ marginTop: 80 }}>
        <div style={{ width: 120, height: 6, background: P.acento, marginBottom: 30 }} />
        <div style={{ fontSize: 46, fontWeight: 800 }}>Carlos Riveros</div>
        <div style={{ marginTop: 14, fontSize: 26, opacity: 0.7, lineHeight: 1.4 }}>
          #01 · Basado en AACE, Skills & Knowledge of Cost Engineering (6.ª ed.)
          <br />
          Próximo: costo vs. precio, la cadena de márgenes
        </div>
      </Aparece>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- marco
function Cabecera() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 84, left: MARGEN, right: MARGEN }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 3, fontWeight: 600 }}>
        <span style={{ color: P.acento }}>INGENIERÍA DE COSTOS EN 30 SEGUNDOS</span>
        <span style={{ opacity: 0.6 }}>#01</span>
      </div>
      <div style={{ marginTop: 18, height: 4, background: RET[1] }}>
        <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: P.acento }} />
      </div>
    </div>
  );
}

export function CostosEAC01() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fundido = (a: number, b: number) =>
    interpolate(frame, [a, a + 8, b - 8, b], [a === 0 ? 1 : 0, 1, 1, b >= durationInFrames ? 1 : 0], clamp);
  const bloque = (r: readonly [number, number], el: React.ReactNode) => (
    <Sequence from={r[0]} durationInFrames={r[1] - r[0]}>
      <AbsoluteFill style={{ opacity: fundido(r[0], r[1]) }}>{el}</AbsoluteFill>
    </Sequence>
  );
  const volumen = interpolate(frame, [0, 15, durationInFrames - 40, durationInFrames], [0, 0.8, 0.8, 0], clamp);
  return (
    <AbsoluteFill style={{ background: P.fondo, color: P.texto, fontFamily: FUENTE }}>
      <Audio src={staticFile("musica.wav")} volume={volumen} />
      <Cabecera />
      {bloque(T.gancho, <Gancho />)}
      {bloque(T.datos, <Datos />)}
      {bloque(T.cpi, <IndiceCPI />)}
      {bloque(T.metodos, <Metodos />)}
      {bloque(T.historico, <Historico />)}
      {bloque(T.leccion, <Leccion />)}
      {bloque(T.cierre, <Cierre />)}
    </AbsoluteFill>
  );
}

export const COSTOS_EAC_01 = { id: "CostosEAC01", durationInFrames: 900, fps: 30, width: 1080, height: 1350 } as const;
