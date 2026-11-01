// Entry point para Remotion Studio / render: npx remotion studio src/remotion/index.ts
import { Composition } from "remotion";
import { PostMarcaPersonal } from "./PostMarcaPersonal";
import { PresentacionCarlos } from "./PresentacionCarlos";
import { PresentacionPLL } from "./PresentacionPLL";
import { ReelCarlos } from "./ReelCarlos";
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
  </>
);
