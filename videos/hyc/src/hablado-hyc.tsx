/** @jsxImportSource @revideo/2d/lib */
// HYC Proyectos — video hablado (grabación de Carlos + animación de marca), 9:16 1080×1920.
// Revideo por regla (CLAUDE.md). Paleta videos/marcas.json. Cifras confirmadas: 201 proyectos ·
// 650.000 m² intervenidos · +20 años. Sin logo hasta tener el archivo ORIGINAL (nunca recrearlo).
// Fuente: videos/producciones/2026-11-presentaciones/fuentes/hyc.mp4 (render: npm run render -- hablado).
//
// Composición alternada (pedido de Carlos): pantalla completa con su imagen ↔ media página (su imagen
// en una mitad, animación en la otra) ↔ gráfico a pantalla completa. Todos los datos se animan (conteos).
// La fuente se convierte a all-intra en render.ts (evita cuadros congelados del decodificador web).
import {
  makeProject, createRef, all, sequence, waitFor, tween, easeOutCubic, easeInOutCubic, easeOutBack,
  type ThreadGenerator, type Reference,
} from "@revideo/core";
import { makeScene2D, Rect, Txt, Layout, Video, Line, Node } from "@revideo/2d";
import MARCAS from "../../marcas.json";
import SUBS from "../../producciones/2026-11-presentaciones/subtitulos-hyc.json";

const { rojo: ROJO, negro: NEGRO, blanco: BLANCO } = MARCAS.hyc;
const FUENTE = "Gotham, Montserrat, Arial, sans-serif";
const W = 1080;
const H = 1920;
const FIN_AUDIO = 40.6; // s — fin de la voz (corta el silencio final)
const FIN = 43.2;       // s — fin del video (cierre rojo)
const Y = (px: number) => px - H / 2; // px desde arriba → coordenada del lienzo (centro = 0)

// ---- Plan de composición (cambios en los cortes de frase) ----------------------------------
type Modo = "completo" | "arriba" | "abajo" | "grafico";
const PLAN: { desde: number; modo: Modo }[] = [
  { desde: 0, modo: "completo" },   // gancho
  { desde: 4.6, modo: "arriba" },   // quiénes somos: video arriba, +20 años y verbos abajo
  { desde: 11.5, modo: "grafico" }, // 201 proyectos · 650.000 m² a pantalla completa
  { desde: 16.5, modo: "completo" },// "un cliente no compra una obra…"
  { desde: 24.3, modo: "arriba" },  // cómo trabajamos: lista animada abajo
  { desde: 31.9, modo: "abajo" },   // servicios arriba, video abajo
  { desde: 37.4, modo: "grafico" }, // cierre rojo
];
const modoEn = (t: number) => [...PLAN].reverse().find((p) => t >= p.desde)!.modo;
// Posición de los subtítulos (px desde arriba) según la composición; null = se ocultan (el gráfico ya lo dice)
// En media página van al borde de la mitad de video (arriba) o al pie del panel gráfico (abajo), sin tapar la boca
const SUB_Y: Record<Modo, number | null> = { completo: 1450, arriba: 850, abajo: 860, grafico: null };

type Linea = { inicio: number; fin: number; palabras: { t: string; inicio: number; fin: number }[] };
const fmt = (n: number) => Math.round(n).toLocaleString("es-CO");

const escena = makeScene2D("hablado-hyc", function* (view) {
  view.fill(NEGRO);

  // Ventana con recorte: la grabación entera (pantalla completa) o recortada a cara y hombros (media página)
  const ventana = createRef<Rect>();
  const video = createRef<Video>();
  view.add(
    <Rect ref={ventana} width={W} height={H} clip>
      <Video ref={video} src={"/hyc.mp4"} width={W} height={H} />
    </Rect>,
  );
  video().play();
  const capaGraficos = createRef<Node>();
  const capaSubs = createRef<Node>();
  view.add(<Node ref={capaGraficos} />);
  view.add(<Node ref={capaSubs} />);

  // ---- Utilidades de tiempo: el hilo principal lleva un reloj absoluto ------------------------
  let reloj = 0;
  function* hasta(t: number): ThreadGenerator {
    if (t > reloj) {
      yield* waitFor(t - reloj);
      reloj = t;
    }
  }
  function* durante(seg: number, ...anims: ThreadGenerator[]): ThreadGenerator {
    yield* all(...anims);
    reloj += seg;
  }

  // ---- Transiciones de la ventana de video ----------------------------------------------------
  // En media página se muestra la franja 150–1110 px de la grabación (cara y hombros).
  const D = 0.6;
  const aCompleto = () => all(ventana().height(H, D, easeInOutCubic), ventana().y(0, D, easeInOutCubic), video().y(0, D, easeInOutCubic));
  // Abajo se sube un poco el encuadre (200 en vez de 330) para que no corte la boca/mentón
  const aMedia = (pos: "arriba" | "abajo") =>
    all(ventana().height(H / 2, D, easeInOutCubic), ventana().y(pos === "arriba" ? -H / 4 : H / 4, D, easeInOutCubic),
      video().y(pos === "arriba" ? 330 : 200, D, easeInOutCubic));

  // Panel negro de media página (la otra mitad) con una franja roja vertical de marca
  function panelMitad(pos: "arriba" | "abajo") {
    const p = createRef<Rect>();
    capaGraficos().add(
      <Rect ref={p} width={W} height={H / 2} y={pos === "abajo" ? H / 4 : -H / 4} fill={NEGRO} opacity={0} clip>
        <Rect x={-W / 2 + 40} width={10} height={H / 2} fill={ROJO} />
      </Rect>,
    );
    return p;
  }

  function txt(props: { ref?: Reference<Txt>; text: string; y: number; x?: number; size: number; peso?: number; color?: string; esp?: number; op?: number }) {
    return (
      <Txt ref={props.ref} text={props.text} x={props.x ?? 0} y={props.y} fontFamily={FUENTE} fontWeight={props.peso ?? 800}
        fontSize={props.size} fill={props.color ?? BLANCO} letterSpacing={props.esp ?? 0} opacity={props.op ?? 0} />
    );
  }
  const aparecer = <T extends Txt | Rect | Layout>(r: Reference<T>, s = 0.35) => all(r().opacity(1, s), r().scale(1, s, easeOutBack));
  const contar = (r: Reference<Txt>, desde: number, a: number, s: number, suf = "", pre = "") =>
    tween(s, (v) => r().text(`${pre}${fmt(desde + (a - desde) * easeOutCubic(v))}${suf}`));

  // ---- Subtítulos (hilo paralelo): se ubican según la composición y se ocultan en los gráficos --
  function* subtitulos(): ThreadGenerator {
    const lineas = SUBS as Linea[];
    let ahora = 0;
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const fin = Math.min(lineas[i + 1]?.inicio ?? Infinity, l.fin + 0.6);
      yield* waitFor(Math.max(0, l.inicio - ahora));
      ahora = Math.max(ahora, l.inicio);
      const y = SUB_Y[modoEn(l.inicio + 0.05)];
      if (y === null) continue;
      const palabras = l.palabras.map(() => createRef<Txt>());
      const caja = createRef<Rect>();
      capaSubs().add(
        <Rect ref={caja} y={Y(y) + 45} layout direction="row" wrap="wrap" justifyContent="center" gap={14}
          maxWidth={920} padding={[16, 28]} radius={16} fill={NEGRO + "d9"}>
          {l.palabras.map((w, k) => (
            <Txt ref={palabras[k]} text={w.t} fontFamily={FUENTE} fontWeight={800} fontSize={54} fill={BLANCO} opacity={0.5} />
          ))}
        </Rect>,
      );
      for (let k = 0; k < l.palabras.length; k++) {
        yield* waitFor(Math.max(0, l.palabras[k].inicio - ahora));
        ahora = Math.max(ahora, l.palabras[k].inicio);
        palabras[k]().opacity(1);
      }
      yield* waitFor(Math.max(0, fin - ahora));
      ahora = Math.max(ahora, fin);
      caja().remove();
    }
  }

  // ---- Línea de tiempo de la composición -------------------------------------------------------
  function* composicion(): ThreadGenerator {
    // B · 4.6–11.5 · video arriba · abajo: nombre, +20 años contando, verbos
    yield* hasta(4.6);
    const pB = panelMitad("abajo");
    const nom = createRef<Txt>(), veinte = createRef<Txt>(), anos = createRef<Txt>(), col = createRef<Txt>();
    const verbos = ["CONSTRUYENDO", "MANTENIENDO", "INTERVINIENDO"].map(() => createRef<Txt>());
    const barras = [0, 1, 2].map(() => createRef<Rect>());
    pB().add(
      <>
        {txt({ ref: nom, text: "HYC PROYECTOS DE INGENIERÍA", y: -400, size: 34, peso: 500, esp: 6 })}
        {txt({ ref: veinte, text: "+0", y: -270, x: -230, size: 170 })}
        {txt({ ref: anos, text: "AÑOS DE\nEXPERIENCIA", y: -270, x: 170, size: 46, peso: 700 })}
        {/* Sin fragmentos <> dentro de map: Revideo no los renderiza */}
        {barras.map((r, i) => (
          <Rect ref={r} x={-300} y={-110 + i * 80} width={0} height={8} fill={ROJO} offset={[-1, 0]} />
        ))}
        {verbos.map((r, i) => (
          <Txt ref={r} text={["CONSTRUYENDO", "MANTENIENDO", "INTERVINIENDO"][i]} x={-180} y={-110 + i * 80} offset={[-1, 0]}
            fontFamily={FUENTE} fontWeight={800} fontSize={50} fill={BLANCO} opacity={0} />
        ))}
        {txt({ ref: col, text: "EN COLOMBIA", y: 150, size: 34, peso: 500, esp: 8, color: ROJO })}
      </>,
    );
    [nom, veinte, anos, col, ...verbos].forEach((r) => r().scale(0.9));
    yield* durante(D, aMedia("arriba"), pB().opacity(1, D));
    yield* hasta(5.2);
    yield* durante(0.35, aparecer(nom));
    yield* hasta(7.2);
    yield* durante(0.9, aparecer(veinte, 0.3), contar(veinte, 0, 20, 0.9, "", "+"), aparecer(anos, 0.4));
    const momentos = [7.86, 8.82, 9.62];
    for (let i = 0; i < 3; i++) {
      yield* hasta(momentos[i]);
      yield* durante(0.35, aparecer(verbos[i]), barras[i]().width(90, 0.35, easeOutCubic));
    }
    yield* hasta(10.8);
    yield* durante(0.35, aparecer(col));

    // C · 11.5–16.5 · gráfico completo: 201 proyectos y 650.000 m² con cuadrícula
    yield* hasta(11.4);
    const pC = createRef<Rect>();
    const lbl = createRef<Txt>(), n201 = createRef<Txt>(), proy = createRef<Txt>(), n650 = createRef<Txt>(), inter = createRef<Txt>();
    const sep = createRef<Rect>();
    const COLS = 12, FILAS = 5, TAM = 56, GAP = 10;
    const celdas = Array.from({ length: COLS * FILAS }, () => createRef<Rect>());
    capaGraficos().add(
      <Rect ref={pC} width={W} height={H} fill={NEGRO} x={W}>
        <Rect x={-W / 2 + 40} width={10} height={H} fill={ROJO} />
        {txt({ ref: lbl, text: "HYC EN CIFRAS", y: Y(380), size: 34, peso: 500, esp: 10, color: ROJO })}
        {txt({ ref: n201, text: "0", y: Y(560), size: 210 })}
        {txt({ ref: proy, text: "PROYECTOS", y: Y(700), size: 54, peso: 700, esp: 6 })}
        <Rect ref={sep} y={Y(790)} width={0} height={6} fill={ROJO} />
        {txt({ ref: n650, text: "0 m²", y: Y(930), size: 150 })}
        {txt({ ref: inter, text: "INTERVENIDOS", y: Y(1060), size: 54, peso: 700, esp: 6 })}
        {celdas.map((r, i) => (
          <Rect ref={r} width={TAM} height={TAM} radius={4} stroke={BLANCO + "55"} lineWidth={2} fill={NEGRO}
            x={(i % COLS - (COLS - 1) / 2) * (TAM + GAP)} y={Y(1200) + Math.floor(i / COLS) * (TAM + GAP) + TAM / 2} />
        ))}
      </Rect>,
    );
    [lbl, n201, proy, n650, inter].forEach((r) => r().scale(0.9));
    yield* durante(0.5, pC().x(0, 0.5, easeOutCubic), pB().opacity(0, 0.4));
    pB().remove();
    yield* durante(0.3, aparecer(lbl));
    yield* hasta(12.0);
    yield* durante(0.9, aparecer(n201, 0.3), contar(n201, 0, 201, 0.9), aparecer(proy, 0.5));
    yield* hasta(13.55);
    // 650.000 m²: el conteo y la cuadrícula se llenan juntos (cada celda ≈ 10.833 m²)
    yield* durante(1.5,
      sep().width(600, 0.5, easeOutCubic),
      aparecer(n650, 0.3),
      contar(n650, 0, 650000, 1.5, " m²"),
      sequence(1.4 / celdas.length, ...celdas.map((c) => all(c().fill(ROJO, 0.15), c().stroke(ROJO, 0.15)))),
    );
    yield* hasta(15.45);
    yield* durante(0.35, aparecer(inter));

    // D · 16.5–24.3 · su imagen a pantalla completa
    yield* hasta(16.4);
    yield* durante(D, aCompleto(), pC().x(-W, D, easeInOutCubic));
    pC().remove();

    // E · 24.3–31.9 · video arriba · abajo: cómo trabajamos (chulos que se dibujan)
    yield* hasta(24.3);
    const pE = panelMitad("abajo");
    const tit = createRef<Txt>();
    const items = [
      { t: "PROCESOS DE CALIDAD\nCERTIFICADOS", en: 26.2, y: -250 },
      { t: "UN EQUIPO QUE DA LA\nCARA EN LA OBRA", en: 28.5, y: -70 },
      { t: "NO SOLO EN LA PROPUESTA", en: 30.45, y: 90, rojo: true },
    ];
    const itTxt = items.map(() => createRef<Txt>());
    const checks = items.map(() => createRef<Line>());
    pE().add(
      <>
        {txt({ ref: tit, text: "CÓMO TRABAJAMOS", y: -400, size: 34, peso: 500, esp: 10, color: ROJO })}
        {items.map((it, i) => (
          <Line ref={checks[i]} points={[[-420, it.y], [-395, it.y + 26], [-345, it.y - 30]]} stroke={it.rojo ? BLANCO : ROJO}
            lineWidth={12} lineCap="round" lineJoin="round" end={0} />
        ))}
        {items.map((it, i) => (
          <Txt ref={itTxt[i]} text={it.t} x={-310} y={it.y} offset={[-1, 0]} fontFamily={FUENTE} fontWeight={800}
            fontSize={it.rojo ? 40 : 46} lineHeight={56} fill={it.rojo ? ROJO : BLANCO} opacity={0} />
        ))}
      </>,
    );
    tit().scale(0.9);
    yield* durante(D, aMedia("arriba"), pE().opacity(1, D));
    yield* hasta(24.6);
    yield* durante(0.35, aparecer(tit));
    for (let i = 0; i < items.length; i++) {
      yield* hasta(items[i].en);
      yield* durante(0.45, checks[i]().end(1, 0.45, easeOutCubic), itTxt[i]().opacity(1, 0.35), itTxt[i]().x(-300, 0.35, easeOutCubic));
    }

    // F · 31.9–37.4 · servicios arriba · video abajo
    yield* hasta(31.9);
    const pF = panelMitad("arriba");
    const preg = createRef<Txt>();
    const servicios = [
      { t: "CONSTRUCCIÓN", en: 33.7 },
      { t: "MANTENIMIENTO", en: 34.6 },
      { t: "INTERVENTORÍA", en: 35.6 },
    ];
    const tarjetas = servicios.map(() => createRef<Rect>());
    const boton = createRef<Rect>();
    pF().add(
      <>
        {txt({ ref: preg, text: "¿TIENES UN PROYECTO?", y: -140, size: 44, peso: 800 })}
        {servicios.map((s, i) => (
          <Rect ref={tarjetas[i]} y={-30 + i * 100} x={-W} width={640} height={80} fill={BLANCO + "12"} radius={6}
            layout direction="row" alignItems="center" gap={24} padding={[0, 24]}>
            <Rect width={10} height={48} fill={ROJO} />
            <Txt text={`0${i + 1}`} fontFamily={FUENTE} fontWeight={800} fontSize={34} fill={ROJO} />
            <Txt text={s.t} fontFamily={FUENTE} fontWeight={800} fontSize={42} fill={BLANCO} letterSpacing={2} />
          </Rect>
        ))}
        <Rect ref={boton} y={280} width={520} height={96} radius={48} fill={ROJO} opacity={0} scale={0.6}
          layout justifyContent="center" alignItems="center">
          <Txt text="CONVERSEMOS  →" fontFamily={FUENTE} fontWeight={800} fontSize={44} fill={BLANCO} letterSpacing={3} />
        </Rect>
      </>,
    );
    preg().scale(0.9);
    yield* durante(D, aMedia("abajo"), pE().opacity(0, D), pF().opacity(1, D));
    pE().remove();
    yield* hasta(32.6);
    yield* durante(0.35, aparecer(preg));
    for (let i = 0; i < servicios.length; i++) {
      yield* hasta(servicios[i].en);
      yield* durante(0.4, tarjetas[i]().x(0, 0.4, easeOutCubic));
    }
    yield* hasta(36.6);
    yield* durante(0.45, boton().opacity(1, 0.3), boton().scale(1, 0.45, easeOutBack));
    yield* durante(0.5, boton().scale(1.06, 0.25).to(1, 0.25));

    // G · 37.4–43.2 · cierre rojo: las palabras aparecen al decirlas
    yield* hasta(37.4);
    const pG = createRef<Rect>();
    const hyc = createRef<Txt>(), cons = createRef<Txt>(), conf = createRef<Txt>(), web = createRef<Txt>();
    const lineaG = createRef<Rect>();
    capaGraficos().add(
      <Rect ref={pG} width={W} height={H} x={W} fill={ROJO}>
        {[0, 1, 2].map((i) => (
          <Rect x={-W / 2 + 70 + i * 32} width={14} height={H} fill={NEGRO} opacity={0.35} />
        ))}
        {txt({ ref: hyc, text: "HYC PROYECTOS DE INGENIERÍA", y: Y(650), size: 36, peso: 500, esp: 6 })}
        {txt({ ref: cons, text: "CONSTRUIMOS", y: Y(860), size: 112, esp: 4 })}
        {txt({ ref: conf, text: "CONFIANZA", y: Y(1000), size: 112, esp: 4 })}
        <Rect ref={lineaG} y={Y(1130)} width={0} height={8} fill={BLANCO} />
        {txt({ ref: web, text: "hycproyectos.com", y: Y(1230), size: 42, peso: 500 })}
      </Rect>,
    );
    [hyc, cons, conf, web].forEach((r) => r().scale(0.85));
    yield* durante(0.55, pG().x(0, 0.55, easeOutCubic), pF().opacity(0, 0.4));
    pF().remove();
    yield* hasta(37.75);
    yield* durante(0.35, aparecer(hyc));
    yield* hasta(39.1);
    yield* durante(0.35, aparecer(cons));
    yield* hasta(39.6);
    yield* durante(0.35, aparecer(conf));
    yield* durante(0.5, lineaG().width(160, 0.5, easeOutCubic), aparecer(web, 0.5));
    yield* hasta(FIN_AUDIO);
    video().pause();
    yield* hasta(FIN);
  }

  yield* all(subtitulos(), composicion());
});

export default makeProject({
  scenes: [escena],
  settings: { shared: { size: { x: W, y: H } } },
});
