/** @jsxImportSource @revideo/2d/lib */
// HYC Proyectos — presentación corta de marca (1080×1080, LinkedIn / Instagram).
// Revideo por regla (CLAUDE.md). Paleta de videos/marcas.json.
// Cifras: SOLO datos confirmados por Carlos (1-nov-2026): 201 proyectos, 650.000 m² INTERVENIDOS
// (no "construidos") y +20 años de experiencia, todos de HYC. NO usar 167 proyectos ni 405.000 m² (descartados),
// ni sumar m² por categorías (se solapan), ni atribuir estas cifras a Carlos o a Project Leader Lab.
// Sin logo hasta tener el archivo ORIGINAL (nunca recrearlo ni recolorearlo).
import { makeProject, createRef, all, sequence, waitFor, tween, easeOutCubic, easeInOutCubic } from "@revideo/core";
import { makeScene2D, Rect, Txt, Layout } from "@revideo/2d";
import MARCAS from "../../marcas.json";

const { rojo: ROJO, negro: NEGRO, blanco: BLANCO } = MARCAS.hyc;
// Tipografía HYC (brand-hyc): Gotham → Montserrat → Arial, fuentes instaladas localmente.
const FUENTE = "Gotham, Montserrat, Arial, sans-serif";
const L = 1080;

const fmt = (n: number) => Math.round(n).toLocaleString("es-CO");

const presentacion = makeScene2D("presentacion-hyc", function* (view) {
  view.fill(NEGRO);

  // --- 1. Apertura: franjas verticales rojas (motivo de marca) + nombre
  const franjas = createRef<Layout>();
  const nombre = createRef<Txt>();
  const sub = createRef<Txt>();
  view.add(
    <>
      <Layout ref={franjas} x={-L / 2 + 70} layout gap={18} direction="row">
        {[0, 1, 2].map(() => (
          <Rect width={14} height={0} fill={ROJO} />
        ))}
      </Layout>
      <Txt ref={nombre} x={40} y={-30} fontFamily={FUENTE} fontWeight={800} fontSize={76} fill={BLANCO}
        letterSpacing={2} text="HYC PROYECTOS" opacity={0} />
      <Txt ref={sub} x={40} y={50} fontFamily={FUENTE} fontWeight={500} fontSize={34} fill={BLANCO + "bb"}
        text="DE INGENIERÍA" letterSpacing={10} opacity={0} />
    </>,
  );
  yield* sequence(0.12, ...franjas().children().map((r) => (r as Rect).height(L, 0.6, easeOutCubic)));
  yield* all(nombre().opacity(1, 0.5), nombre().y(-50, 0.5, easeOutCubic), sub().opacity(1, 0.6));
  yield* waitFor(1);
  yield* all(nombre().opacity(0, 0.4), sub().opacity(0, 0.4));

  // --- 2. Cifras con conteo
  const cifras = [
    { valor: 201, sufijo: "", texto: "proyectos" },
    { valor: 650000, sufijo: " m²", texto: "intervenidos" },
    { valor: 20, sufijo: "", prefijo: "+", texto: "años de experiencia" },
  ];
  const bloques = cifras.map(() => createRef<Layout>());
  const numeros = cifras.map(() => createRef<Txt>());
  view.add(
    <Layout x={60} layout direction="column" gap={48} alignItems="start">
      {cifras.map((c, i) => (
        <Layout ref={bloques[i]} direction="column" gap={6} opacity={0}>
          <Rect width={64} height={8} fill={ROJO} marginBottom={10} />
          <Txt ref={numeros[i]} fontFamily={FUENTE} fontWeight={800} fontSize={110} fill={BLANCO}
            text={`${c.prefijo ?? ""}0${c.sufijo}`} />
          {/* Etiqueta en blanco: rojo sobre negro en texto pequeño no da contraste suficiente */}
          <Txt fontFamily={FUENTE} fontWeight={500} fontSize={34} fill={BLANCO + "cc"} text={c.texto.toUpperCase()} letterSpacing={4} />
        </Layout>
      ))}
    </Layout>,
  );
  for (let i = 0; i < cifras.length; i++) {
    const c = cifras[i];
    // El texto se actualiza dentro del tween (un texto calculado con función falla fuera del contexto de escena)
    yield* all(
      bloques[i]().opacity(1, 0.3),
      tween(1.1, (v) => numeros[i]().text(`${c.prefijo ?? ""}${fmt(easeOutCubic(v) * c.valor)}${c.sufijo}`)),
    );
  }
  yield* waitFor(1.2);
  yield* all(...bloques.map((b) => b().opacity(0, 0.4)));

  // --- 3. Cierre: fondo rojo sólido + slogan en blanco (pauta de cierre brand-hyc)
  const cierre = createRef<Rect>();
  const slogan = createRef<Txt>();
  const web = createRef<Txt>();
  view.add(
    <>
      <Rect ref={cierre} width={L} height={L} x={L} fill={ROJO} />
      <Txt ref={slogan} y={-20} fontFamily={FUENTE} fontWeight={800} fontSize={64} fill={BLANCO}
        letterSpacing={6} textAlign="center" text={"CONSTRUIMOS\nCONFIANZA"} opacity={0} />
      <Txt ref={web} y={330} fontFamily={FUENTE} fontWeight={500} fontSize={30} fill={BLANCO}
        text="www.hycproyectos.com" opacity={0} />
    </>,
  );
  yield* cierre().x(0, 0.7, easeInOutCubic);
  yield* all(slogan().opacity(1, 0.6), slogan().y(-40, 0.6, easeOutCubic));
  yield* web().opacity(1, 0.4);
  yield* waitFor(2);
});

export default makeProject({
  scenes: [presentacion],
  settings: { shared: { size: { x: L, y: L } } },
});
