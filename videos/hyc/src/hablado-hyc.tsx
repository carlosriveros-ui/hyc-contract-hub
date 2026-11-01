/** @jsxImportSource @revideo/2d/lib */
// HYC Proyectos — video hablado (grabación de Carlos + animación de marca), 9:16 1080×1920.
// Revideo por regla (CLAUDE.md). Paleta videos/marcas.json. Cifras confirmadas: 201 proyectos ·
// 650.000 m² intervenidos · +20 años. Sin logo hasta tener el archivo ORIGINAL (nunca recrearlo).
// Fuente: videos/producciones/2026-11-presentaciones/fuentes/hyc.mp4 (render: npm run render -- hablado).
import { makeProject, createRef, all, waitFor, easeOutCubic, type ThreadGenerator } from "@revideo/core";
import { makeScene2D, Rect, Txt, Layout, Video } from "@revideo/2d";
import MARCAS from "../../marcas.json";
import SUBS from "../../producciones/2026-11-presentaciones/subtitulos-hyc.json";

const { rojo: ROJO, negro: NEGRO, blanco: BLANCO } = MARCAS.hyc;
const FUENTE = "Gotham, Montserrat, Arial, sans-serif";
const W = 1080;
const H = 1920;
const FIN_VIDEO = 40.6; // s — corta el silencio final
const CIERRE = 2.6;
const Y = (px: number) => px - H / 2; // coordenadas en px desde arriba → centro del lienzo
const X = (px: number) => px - W / 2;

type Linea = { inicio: number; fin: number; palabras: { t: string; inicio: number; fin: number }[] };

const escena = makeScene2D("hablado-hyc", function* (view) {
  const video = createRef<Video>();
  // La fuente se convierte a all-intra en render.ts (evita cuadros congelados del decodificador web).
  view.add(<Video ref={video} src={"/hyc.mp4"} width={W} height={H} />);
  video().play();

  // ---- Subtítulos: línea a línea, palabra dicha en blanco pleno y el resto atenuado
  function* subtitulos(): ThreadGenerator {
    const lineas = SUBS as Linea[];
    let ahora = 0;
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const fin = Math.min(lineas[i + 1]?.inicio ?? Infinity, l.fin + 0.6);
      yield* waitFor(Math.max(0, l.inicio - ahora));
      ahora = Math.max(ahora, l.inicio);
      const palabras = l.palabras.map(() => createRef<Txt>());
      const caja = createRef<Rect>();
      view.add(
        <Rect ref={caja} y={Y(1450) + 50} layout direction="row" wrap="wrap" justifyContent="center" gap={14}
          maxWidth={920} padding={[18, 30]} radius={18} fill={NEGRO + "d9"}>
          {l.palabras.map((w, k) => (
            <Txt ref={palabras[k]} text={w.t} fontFamily={FUENTE} fontWeight={800} fontSize={58} fill={BLANCO} opacity={0.5} />
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

  // ---- Panel de marca: barra roja + texto blanco sobre negro HYC
  function panel(texto: string, y: number, tam = 44) {
    const ref = createRef<Rect>();
    view.add(
      <Rect ref={ref} x={X(72)} y={Y(y)} offset={[-1, 0]} layout direction="row" alignItems="center" gap={22}
        padding={[16, 28, 16, 0]} fill={NEGRO + "e6"} radius={4} opacity={0}>
        <Rect width={10} height={tam * 1.3} fill={ROJO} />
        <Txt text={texto} fontFamily={FUENTE} fontWeight={800} fontSize={tam} fill={BLANCO} letterSpacing={2} />
      </Rect>,
    );
    return ref;
  }
  function* mostrar(ref: ReturnType<typeof createRef<Rect>>, en: number, hasta: number, desde = 0): ThreadGenerator {
    yield* waitFor(en - desde);
    ref().x(ref().x() - 30);
    yield* all(ref().opacity(1, 0.3), ref().x(ref().x() + 30, 0.3, easeOutCubic));
    yield* waitFor(hasta - en - 0.6);
    yield* ref().opacity(0, 0.3);
  }

  function* rotulos(): ThreadGenerator {
    const nombre = panel("HYC PROYECTOS DE INGENIERÍA", 1170, 38);
    const anos = panel("+20 AÑOS", 1110);
    const proy = panel("201 PROYECTOS", 1200);
    const m2 = panel("650.000 m² INTERVENIDOS", 1290);
    const cons = panel("CONSTRUCCIÓN", 1110, 40);
    const mant = panel("MANTENIMIENTO", 1200, 40);
    const inter = panel("INTERVENTORÍA", 1290, 40);
    yield* all(
      mostrar(nombre, 5.0, 7.1),
      mostrar(anos, 7.2, 16.4),
      mostrar(proy, 12.0, 16.4),
      mostrar(m2, 13.6, 16.4),
      mostrar(cons, 33.7, 37.5),
      mostrar(mant, 34.6, 37.5),
      mostrar(inter, 35.6, 37.5),
    );
  }

  yield* all(subtitulos(), rotulos(), waitFor(FIN_VIDEO));

  // ---- Tarjeta final: fondo rojo, franjas, slogan y web (pauta de cierre brand-hyc)
  video().pause();
  const fondo = createRef<Rect>();
  const txt = createRef<Layout>();
  view.add(
    <>
      <Rect ref={fondo} width={W} height={H} x={W} fill={ROJO} />
      <Layout ref={txt} layout direction="column" alignItems="center" gap={28} opacity={0}>
        <Txt text="HYC PROYECTOS DE INGENIERÍA" fontFamily={FUENTE} fontWeight={500} fontSize={34} letterSpacing={6} fill={BLANCO} />
        <Txt text={"CONSTRUIMOS\nCONFIANZA"} textAlign="center" fontFamily={FUENTE} fontWeight={800} fontSize={104} letterSpacing={4} fill={BLANCO} marginTop={40} />
        <Rect width={120} height={8} fill={BLANCO} marginTop={50} />
        <Txt text="hycproyectos.com" fontFamily={FUENTE} fontWeight={500} fontSize={40} fill={BLANCO} marginTop={30} />
      </Layout>
      {[0, 1, 2].map((i) => (
        <Rect x={X(70 + i * 32)} width={14} height={H} fill={NEGRO} opacity={0.35} />
      ))}
    </>,
  );
  yield* fondo().x(0, 0.5, easeOutCubic);
  yield* txt().opacity(1, 0.4);
  yield* waitFor(CIERRE - 0.9);
});

export default makeProject({
  scenes: [escena],
  settings: { shared: { size: { x: W, y: H } } },
});
