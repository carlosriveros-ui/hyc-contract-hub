import { renderVideo } from "@revideo/renderer";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

// Revideo manda telemetría anónima (PostHog) por defecto; la desactivamos.
process.env.DISABLE_TELEMETRY = "true";

// Proyectos disponibles: npm run render -- <nombre>
const PROYECTOS: Record<string, string> = {
  "resumen-contrato": "./src/project.tsx",
  presentacion: "./src/presentacion.tsx",
  hablado: "./src/hablado-hyc.tsx", // usa videos/producciones/2026-11-presentaciones/fuentes/hyc.mp4
};

// Videos fuente de los proyectos "hablado". Se copian a public/ (ignorada en git) porque Revideo sirve
// los archivos desde ahí y, sobre todo, el renderer extrae el AUDIO desde public/ (no respeta viteConfig.publicDir).
const FUENTES: Record<string, string[]> = { hablado: ["../producciones/2026-11-presentaciones/fuentes/hyc.mp4"] };

function prepararFuentes(nombre: string) {
  // ffmpeg incluido con Revideo (@ffmpeg-installer)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpeg: string = require("@ffmpeg-installer/ffmpeg").path;
  for (const origen of FUENTES[nombre] ?? []) {
    if (!fs.existsSync(origen)) throw new Error(`Falta la grabación ${origen}`);
    fs.mkdirSync("public", { recursive: true });
    const destino = path.join("public", path.basename(origen));
    // All-intra (-g 1) a 30 fps constantes: el decodificador del navegador puede ir a cualquier cuadro sin
    // reconstruir los anteriores. Con el GOP original se saltaba cuadros y la imagen quedaba congelada a ratos.
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", origen, "-r", "30", "-c:v", "libx264", "-g", "1",
      "-bf", "0", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "copy", destino]);
  }
}

async function render() {
  const nombre = process.argv[2] ?? "resumen-contrato";
  const projectFile = PROYECTOS[nombre];
  if (!projectFile) throw new Error(`Proyecto desconocido "${nombre}". Opciones: ${Object.keys(PROYECTOS).join(", ")}`);
  prepararFuentes(nombre);

  const file = await renderVideo({
    projectFile,
    // variables: { datos: { cliente: "...", contrato: "...", sedes: 0, actividadesCompletadas: 0, actividadesTotales: 0 } },
    settings: {
      outFile: `${nombre}.mp4`,
      logProgress: true,
      // Usa el Chrome local si PUPPETEER_EXECUTABLE_PATH está definido
      puppeteer: process.env.PUPPETEER_EXECUTABLE_PATH
        ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ["--no-sandbox"] }
        : undefined,
    },
  });
  console.log(`Video generado: ${file}`);
}

render();
