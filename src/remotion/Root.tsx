// Entry point para Remotion Studio / render (npx remotion studio src/remotion/index.ts)
import { Composition } from "remotion";
import { ResumenContrato, RESUMEN_CONTRATO } from "./ResumenContrato";

export const RemotionRoot = () => (
  <Composition
    {...RESUMEN_CONTRATO}
    component={ResumenContrato}
    defaultProps={{
      cliente: "Cliente de ejemplo",
      contrato: "Mantenimiento integral 2026",
      sedes: 12,
      actividadesCompletadas: 87,
      actividadesTotales: 120,
    }}
  />
);
