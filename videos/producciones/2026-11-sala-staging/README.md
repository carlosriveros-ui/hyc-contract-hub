# Producción 2026-11 — Reel de home staging: sala vacía → propuesta final

Reel vertical 9:16 (1080×1920, 30 fps, **30 s**) estilo renovación / venta inmobiliaria, con música.
Hecho con fotos (no grabaciones), por eso no hay voz ni subtítulos. **Sin marca**: no lleva logo ni colores de HYC,
Carlos o PLL (se puede añadir una tarjeta de cierre con marca si Carlos lo pide).

## Fuentes (`fuentes/`, no versionadas)

| Archivo | Qué es |
|---|---|
| `1-vacia.png` | Sala vacía (foto real) |
| `2-muebles-real.jpg` | Sala con sofá y mesa (foto real; no se usa en el corte) |
| `3-decorada.png` | Propuesta: sofá + mesa + centro de mesa (mismo encuadre que la vacía) |
| `4-tapete.png` | Propuesta + tapete (mismo encuadre) |
| `5-propuesta.png` | Propuesta final con notas (centro de mesa, cojines y manta, espejo y consola, tapete) |

## Guion visual

| Tiempo | Escena |
|---|---|
| 0–3 s | ANTES · "Una sala vacía" — acercamiento lento |
| 3–4,5 s | Paso 1 · Luz cálida (la sala vacía toma la luz de la propuesta) |
| 4,6–8 s | Paso 2 · Mobiliario — se dibuja el plano del sofá y "cae" en su sitio; mesa auxiliar y puff suben desde abajo |
| 8,3–11 s | Paso 3 · Mesa de centro (plano + caída con rebote) |
| 11–14 s | Paso 4 · Centro de mesa (bandeja, vela, florero) |
| 14–17,5 s | Paso 5 · Tapete — se desenrolla del frente al fondo |
| 17,5–21,5 s | DESPUÉS · "Lista para vivir" — la cámara se aleja |
| 21,5–25 s | Comparación antes/después con divisor deslizante |
| 25–30 s | Propuesta final con sus notas + "¿Listo para transformar tu espacio?" |

Música **original generada por el script** (chill house, 120 bpm; sin copyright): pad, bajo, bombo, palmas,
hats, arpegio, "whoosh" en los cambios de escena y un "pop" cada vez que aterriza un mueble (en tiempo con el ritmo).

## Render

```bash
python3 render.py                # → salida/sala-staging.mp4 (≈3 min)
python3 render.py --preview 9.2  # → salida/preview.png (un fotograma para revisar)
```

Requiere solo `numpy`, `Pillow` y `ffmpeg` en el PATH. Fuente tipográfica: Inter (`/usr/share/fonts/opentype/inter`).
Las máscaras de cada mueble están dibujadas a mano sobre el encuadre de 941×1671 (`preparar()`); si cambian las fotos, hay que ajustarlas.
