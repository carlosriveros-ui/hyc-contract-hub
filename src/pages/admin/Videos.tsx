// Videos de marca personal (Carlos Riveros / ProjectLeader) con Remotion.
// Los videos de HYC se hacen con Revideo en videos/hyc — ver REGLA en CONTEXT.md.
import { useState } from "react";
import { Player } from "@remotion/player";
import { AppShell } from "@/components/AppShell";
import { PostMarcaPersonal, type Marca } from "@/remotion/PostMarcaPersonal";
import { POST_DEFAULT_PROPS, POST_MARCA_PERSONAL } from "@/remotion/config";

export default function Videos() {
  const [marca, setMarca] = useState<Marca>("carlos-riveros");
  return (
    <AppShell title="Videos · Marca Personal">
      <div className="bg-surface border border-border rounded-lg shadow-card p-4 max-w-xl">
        <div className="flex gap-2 mb-3">
          {(["carlos-riveros", "projectleader"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMarca(m)}
              className={`px-3 py-1 rounded-md text-sm border ${marca === m ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              {m === "carlos-riveros" ? "Carlos Riveros" : "ProjectLeader"}
            </button>
          ))}
        </div>
        <Player
          component={PostMarcaPersonal}
          inputProps={{ ...POST_DEFAULT_PROPS, marca }}
          durationInFrames={POST_MARCA_PERSONAL.durationInFrames}
          fps={POST_MARCA_PERSONAL.fps}
          compositionWidth={POST_MARCA_PERSONAL.width}
          compositionHeight={POST_MARCA_PERSONAL.height}
          style={{ width: "100%", aspectRatio: "1 / 1" }}
          controls
          loop
        />
      </div>
    </AppShell>
  );
}
