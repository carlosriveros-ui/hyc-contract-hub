// Entry point para Remotion Studio / render: npx remotion studio src/remotion/index.ts
import { Composition } from "remotion";
import { PostMarcaPersonal } from "./PostMarcaPersonal";
import { PresentacionCarlos } from "./PresentacionCarlos";
import { PresentacionPLL } from "./PresentacionPLL";
import { ReelCarlos } from "./ReelCarlos";
import { HabladoCarlos, CARLOS_FIN_VIDEO, CARLOS_CIERRE } from "./hablado/HabladoCarlos";
import { CostosEAC01, COSTOS_EAC_01 } from "./costos/CostosEAC01";
import { HabladoPLL, PLL_FIN_VIDEO, PLL_CIERRE } from "./hablado/HabladoPLL";
import { POST_DEFAULT_PROPS, POST_MARCA_PERSONAL, PRESENTACION_CARLOS, PRESENTACION_CARLOS_PROPS, PRESENTACION_PLL, PRESENTACION_PLL_PROPS, REEL_CARLOS, REEL_CARLOS_PROPS } from "./config";

export const RemotionRoot = () => (
  <>
    <Composition {...POST_MARCA_PERSONAL} component={PostMarcaPersonal} defaultProps={POST_DEFAULT_PROPS} />
    <Composition
      {...POST_MARCA_PERSONAL}
      id="PostProjectLeader"
      component={PostMarcaPersonal}
      defaultProps={{ ...POST_DEFAULT_PROPS, marca: "projectleader" as const }}
    />
    <Composition {...PRESENTACION_CARLOS} component={PresentacionCarlos} defaultProps={PRESENTACION_CARLOS_PROPS} />
    <Composition {...PRESENTACION_PLL} component={PresentacionPLL} defaultProps={PRESENTACION_PLL_PROPS} />
    <Composition {...REEL_CARLOS} component={ReelCarlos} defaultProps={REEL_CARLOS_PROPS} />
    {/* Videos hablados (grabación de Carlos + animación). Render con --public-dir videos/producciones/2026-11-presentaciones/fuentes */}
    <Composition id="HabladoCarlos" component={HabladoCarlos} fps={30} width={1080} height={1920}
      durationInFrames={Math.round((CARLOS_FIN_VIDEO + CARLOS_CIERRE) * 30)} />
    <Composition id="HabladoPLL" component={HabladoPLL} fps={30} width={1080} height={1920}
      durationInFrames={Math.round((PLL_FIN_VIDEO + PLL_CIERRE) * 30)} />
    {/* Ingeniería de costos en 30 s · #01 (4:5). Render con --public-dir videos/producciones/2026-11-costos-01/fuentes */}
    <Composition {...COSTOS_EAC_01} component={CostosEAC01} />
  </>
);
