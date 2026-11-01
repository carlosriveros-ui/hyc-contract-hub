import { renderVideo } from "@revideo/renderer";

// Revideo manda telemetría anónima (PostHog) por defecto; la desactivamos.
process.env.DISABLE_TELEMETRY = "true";

// Proyectos disponibles: npm run render -- <nombre>
const PROYECTOS: Record<string, string> = {
  "resumen-contrato": "./src/project.tsx",
  presentacion: "./src/presentacion.tsx",
};

async function render() {
  const nombre = process.argv[2] ?? "resumen-contrato";
  const projectFile = PROYECTOS[nombre];
  if (!projectFile) throw new Error(`Proyecto desconocido "${nombre}". Opciones: ${Object.keys(PROYECTOS).join(", ")}`);

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
