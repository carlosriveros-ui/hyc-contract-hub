/** @jsxImportSource @revideo/2d/lib */
// Videos de HYC Proyectos → Revideo (ver REGLA en CONTEXT.md)
import { makeProject, createRef, useScene, all, waitFor, easeOutCubic } from "@revideo/core";
import { makeScene2D, Rect, Txt } from "@revideo/2d";

import MARCAS from "../../marcas.json";

// Paleta HYC (videos/marcas.json). El logo de HYC se usa original, nunca recoloreado.
const { rojo: HYC_ROJO, negro: HYC_NEGRO, blanco: HYC_BLANCO } = MARCAS.hyc;

// Variables por defecto; se sobreescriben desde render.ts (renderVideo({ variables }))
const DEFAULTS = {
  cliente: "Cliente de ejemplo",
  contrato: "Mantenimiento integral 2026",
  sedes: 12,
  actividadesCompletadas: 87,
  actividadesTotales: 120,
};

const resumenContrato = makeScene2D("resumen-contrato", function* (view) {
  const v = { ...DEFAULTS, ...useScene().variables.get("datos", DEFAULTS)() };
  const pct = v.actividadesTotales > 0 ? v.actividadesCompletadas / v.actividadesTotales : 0;

  view.fill(HYC_ROJO);

  const titulo = createRef<Txt>();
  const cliente = createRef<Txt>();
  const resumen = createRef<Txt>();
  const barra = createRef<Rect>();
  const porcentaje = createRef<Txt>();
  const BAR_W = 1200;

  view.add(
    <>
      <Txt ref={cliente} text={v.cliente} y={-120} fontSize={40} fill={HYC_BLANCO + "cc"} fontFamily="Inter, sans-serif" opacity={0} />
      <Txt ref={titulo} text={v.contrato} y={-20} fontSize={80} fontWeight={800} fill={HYC_BLANCO} fontFamily="Inter, sans-serif" opacity={0} />
      <Txt ref={resumen} text={`${v.sedes} sedes · ${v.actividadesCompletadas}/${v.actividadesTotales} actividades`} y={-150} fontSize={48} fill={HYC_BLANCO} fontFamily="Inter, sans-serif" opacity={0} />
      <Rect width={BAR_W} height={48} radius={24} fill={HYC_BLANCO + "33"} clip opacity={0} ref={barra}>
        <Rect x={-BAR_W / 2} offset={[-1, 0]} width={0} height={48} fill={HYC_BLANCO} />
      </Rect>
      {/* Franja inferior en negro HYC. Si se agrega el logo, usar el archivo original sin recolorear. */}
      <Rect y={1080 / 2 - 50} width={1920} height={100} fill={HYC_NEGRO}>
        <Txt text={MARCAS.hyc.nombre} fontSize={32} fontWeight={700} fill={HYC_BLANCO} fontFamily="Inter, sans-serif" />
      </Rect>
      <Txt ref={porcentaje} text="0%" y={140} fontSize={96} fontWeight={800} fill={HYC_BLANCO} fontFamily="Inter, sans-serif" opacity={0} />
    </>,
  );

  yield* all(cliente().opacity(1, 0.6), titulo().opacity(1, 0.6), titulo().y(-40, 0.6, easeOutCubic));
  yield* waitFor(1.4);
  yield* all(cliente().opacity(0, 0.4), titulo().opacity(0, 0.4));

  yield* all(resumen().opacity(1, 0.4), barra().opacity(1, 0.4), porcentaje().opacity(1, 0.4));
  const relleno = barra().children()[0] as Rect;
  yield* all(
    relleno.width(BAR_W * pct, 1.5, easeOutCubic),
    porcentaje().text(`${Math.round(pct * 100)}%`, 1.5),
  );
  yield* waitFor(1.5);
});

export default makeProject({
  scenes: [resumenContrato],
  variables: { datos: DEFAULTS },
  settings: { shared: { size: { x: 1920, y: 1080 } } },
});
