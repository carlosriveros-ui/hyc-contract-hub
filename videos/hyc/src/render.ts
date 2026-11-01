import { renderVideo } from "@revideo/renderer";
import * as fs from "fs";
import * as path from "path";

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
  for (const origen of FUENTES[nombre] ?? []) {
    if (!fs.existsSync(origen)) throw new Error(`Falta la grabación ${origen}`);
    fs.mkdirSync("public", { recursive: true });
    fs.copyFileSync(origen, path.join("public", path.basename(origen)));
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
