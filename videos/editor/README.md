# Editor de video (MoviePy)

Para editar **grabaciones reales** (obras, visitas, entrevistas) de cualquier marca:
HYC Proyectos, Carlos Riveros o ProjectLeader. Ver `CONTEXT.md` → "REGLA: Videos".

## Instalación (una vez)

```bash
cd videos/editor
python -m venv .venv
# Windows: .venv\Scripts\activate    ·    Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

FFmpeg viene incluido (imageio-ffmpeg); no hay que instalarlo aparte.

## Uso

```bash
python editar.py --marca hyc --clips obra1.mp4 obra2.mp4 --titulo "Sede Norte" --salida salida/sede-norte.mp4
python editar.py --marca carlos-riveros --clips charla.mp4 --formato 9:16 --musica fondo.mp3
```

Opciones: `--formato 16:9|1:1|9:16`, `--titulo`, `--fuente archivo.ttf`, `--musica`,
`--volumen-musica 0.25`, `--sin-audio-original`. `python editar.py -h` para ver todo.

Logos: `marcas/<hyc|carlos-riveros|projectleader>/logo.png` (PNG transparente).
Colores en `marcas.py`.
