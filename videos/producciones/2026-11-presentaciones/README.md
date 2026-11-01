# Producción 2026-11 — videos de presentación (HYC · Carlos · PLL)

Grabaciones de Carlos (1-nov-2026, verticales) + animación de cada marca. Guiones: los de esta sesión
(skill `video-script-hyc`), grabados casi textuales. Ver `videos/PLAYBOOK.md` §3-A.

| Marca | Fuente (`fuentes/`, no versionada) | Herramienta | Composición | Duración |
|---|---|---|---|---|
| HYC Proyectos | `hyc.mp4` | Revideo | `videos/hyc/src/hablado-hyc.tsx` | 40,6 s + 2,6 s cierre |
| Carlos Riveros | `carlos.mp4` | Remotion | `src/remotion/hablado/HabladoCarlos.tsx` | 50,0 s + 2,5 s cierre |
| Project Leader Lab | `pll.mp4` | Remotion | `src/remotion/hablado/HabladoPLL.tsx` | 39,0 s + 2,5 s cierre |

## Flujo

1. Poner las grabaciones en `fuentes/` como `hyc.mp4`, `carlos.mp4`, `pll.mp4` (la carpeta ignora todo en git).
2. Transcribir con tiempos por palabra (faster-whisper; modelo `small` o ruta local) → `transcripts.json`.
3. `python hacer_subtitulos.py transcripts.json` → `subtitulos-{hyc,carlos,pll}.json`
   (corrige errores del reconocimiento contra el guion: "HAC"→"HYC", "incomplet"→"incompleta", etc.; líneas ≤ ~24 caracteres,
   sin terminar en "de/y/la…", sin partir "Project Leader Lab").
4. Render:
   - HYC: `cd videos/hyc && npm run render:hablado` → `videos/hyc/output/hablado.mp4`
   - Carlos: `npx remotion render src/remotion/index.ts HabladoCarlos carlos.mp4 --public-dir=videos/producciones/2026-11-presentaciones/fuentes`
   - PLL: `npx remotion render src/remotion/index.ts HabladoPLL pll.mp4 --public-dir=videos/producciones/2026-11-presentaciones/fuentes`

## Decisiones

- **Sin recorte de silencios:** el habla es continua (pausas < 0,6 s); auto-editor solo produciría saltos. Se recorta el silencio final.
- **Subtítulos** en caja oscura (camisa blanca de fondo), palabra dicha resaltada (Carlos/PLL: dorado; HYC: blanco pleno, porque el rojo sobre negro no da contraste).
- **Rótulos** sincronizados con lo que dice Carlos, en la zona del pecho (no tapan la cara) y dentro de la zona segura de Reels (15 % arriba/abajo libre).
  - HYC: nombre → +20 años / 201 proyectos / 650.000 m² intervenidos → servicios → cierre rojo "Construimos confianza".
  - Carlos: nombre y credenciales **tal como las dijo** (Gerente de proyectos · PMP · MBA · Docente de posgrado · Fundador de empresas) → OBRA/GERENCIA/IA (se ilumina el que explica) → "Comenta" → tarjeta final.
  - PLL: marco dorado + etiqueta todo el video → temas 01/02/03 → URL → tarjeta final con el slogan aprobado.
- **Resolución:** las grabaciones llegaron por WhatsApp a 478×850 y se escalan a 1080×1920 (se ven algo suaves).
  Para la versión final, enviar los archivos originales del celular (Drive o cable), no por WhatsApp.
- **Sin logo de HYC** hasta tener el archivo original.
