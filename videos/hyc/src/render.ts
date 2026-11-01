import { renderVideo } from "@revideo/renderer";

// Revideo manda telemetría anónima (PostHog) por defecto; la desactivamos.
process.env.DISABLE_TELEMETRY = "true";

async function render() {
  const file = await renderVideo({
    projectFile: "./src/project.tsx",
    // variables: { datos: { cliente: "...", contrato: "...", sedes: 0, actividadesCompletadas: 0, actividadesTotales: 0 } },
    settings: {
      outFile: "resumen-contrato.mp4",
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
