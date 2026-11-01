import { Player } from "@remotion/player";
import { AppShell } from "@/components/AppShell";
import { ResumenContrato, RESUMEN_CONTRATO } from "@/remotion/ResumenContrato";

export default function Videos() {
  return (
    <AppShell title="Videos">
      <div className="bg-surface border border-border rounded-lg shadow-card p-4">
        <h2 className="text-lg font-bold mb-3">Resumen de contrato (ejemplo)</h2>
        <Player
          component={ResumenContrato}
          inputProps={{
            cliente: "Cliente de ejemplo",
            contrato: "Mantenimiento integral 2026",
            sedes: 12,
            actividadesCompletadas: 87,
            actividadesTotales: 120,
          }}
          durationInFrames={RESUMEN_CONTRATO.durationInFrames}
          fps={RESUMEN_CONTRATO.fps}
          compositionWidth={RESUMEN_CONTRATO.width}
          compositionHeight={RESUMEN_CONTRATO.height}
          style={{ width: "100%", aspectRatio: "16 / 9" }}
          controls
          loop
        />
      </div>
    </AppShell>
  );
}
