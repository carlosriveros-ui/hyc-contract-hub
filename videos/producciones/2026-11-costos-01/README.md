# Producción 2026-11 — "Ingeniería de costos en 60 segundos" #01: Tu presupuesto no es tu pronóstico

Video de **Carlos Riveros** (marca personal → Remotion), LinkedIn feed **4:5 (1080×1350)**, **30 s**, en español, con música.
Composición: `src/remotion/costos/CostosEAC01.tsx` (`CostosEAC01`).

## Cifras (aprobadas por Carlos, 2-nov-2026)

BAC 100M · 60 % completado · AC 70M → EV 60M · CPI 0,86 · EAC① = AC + (BAC − EV) = 110M ·
EAC② = BAC ÷ CPI ≈ 116,7M · VAC −10M a −16,7M.
Los otros paquetes de la gráfica de burbujas y el histograma de proyectos anteriores son **ilustrativos** (se rotulan así en el video).

## Escenas

| s | Escena | Gráfica |
|---|---|---|
| 0–3 | Gancho: "Tu presupuesto no es tu pronóstico." | — |
| 3–8 | Datos del paquete | Barras BAC / EV / AC con la brecha −10M |
| 8–13 | CPI = EV ÷ AC = 0,86 · "Cada $1,00 produce $0,86" | Burbujas (avance × CPI × presupuesto) |
| 13–20 | Métodos 1 y 2 | Área: costo acumulado + proyecciones a 110M y 116,7M, rango sombreado |
| 20–24 | Método 3, tendencia histórica | Histograma del EAC final de proyectos anteriores |
| 24–27 | Lección: reportar un rango + causa, impacto y acción | — |
| 27–30 | Pregunta (1, 2 o 3) + firma, fuente AACE y próximo episodio | — |

## Render

```bash
python3 videos/producciones/2026-11-costos-01/musica.py   # → fuentes/musica.wav (música original, sin copyright)
npx remotion render src/remotion/index.ts CostosEAC01 videos/producciones/2026-11-costos-01/salida/costos-eac-01.mp4 \
  --public-dir=videos/producciones/2026-11-costos-01/fuentes
```
