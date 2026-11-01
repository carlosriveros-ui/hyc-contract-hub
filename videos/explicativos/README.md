# Animaciones explicativas — Project Leader Lab (Manim)

Animaciones didácticas para **Project Leader Lab** (conceptos de gestión de proyectos dibujándose paso a paso).
Ver `CONTEXT.md` → "REGLA: Videos". No usar para HYC ni para Carlos Riveros.

## Instalación (una vez)

Requiere **Python 3.11+**.

```bash
cd videos/explicativos
python -m venv .venv
# Windows: .venv\Scripts\activate    ·    Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

- Windows / Mac: `pip` trae todo lo necesario. Hace falta **FFmpeg** en el PATH (`winget install ffmpeg` / `brew install ffmpeg`).
- Linux: antes instalar `sudo apt install libpango1.0-dev libcairo2-dev pkg-config ffmpeg`.
- LaTeX **no** es necesario mientras se use `Text()`. Solo si se quieren fórmulas (`MathTex`) hay que instalar LaTeX (MiKTeX en Windows).

## Uso

```bash
manim -pqm curva_s.py CurvaS                              # vista previa, calidad media
manim -qh --resolution 1080,1080 curva_s.py CurvaS        # cuadrado para LinkedIn
```

Los videos quedan en `media/videos/...` (ignorado por git). Se pueden pasar por
`videos/editor` (MoviePy) para unirlos con grabaciones o agregarles música.

## Escenas

- `ia_con_criterio.py` → `IAConCriterio`: "¿Qué parte del informe puede preparar la IA y qué debe validar el responsable?" (1:1, 1080×1080, ~34 s). Pilar IA aplicada; cierre con el slogan aprobado. Ya trae el formato cuadrado: `manim -qh ia_con_criterio.py IAConCriterio`.
- `curva_s.py` → `CurvaS`: "¿Vas atrasado? Léelo en la curva S" (planeado vs real, ~16 s).
