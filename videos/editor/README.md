# Editor de video (MoviePy)

Para editar **grabaciones reales** (obras, visitas, entrevistas) de cualquier marca:
HYC Proyectos, Carlos Riveros o Project Leader Lab. Ver `CONTEXT.md` → "REGLA: Videos".

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
python editar.py --marca carlos-riveros --clips charla.mp4 broll.mp4 --formato 9:16 --transicion deslizar --lado abajo --musica fondo.mp3
```

Transiciones entre clips (`--transicion`):

| Valor | Efecto |
|---|---|
| `cruzado` (por defecto) | el clip siguiente aparece encima del anterior, con mezcla de audio |
| `deslizar` | el clip siguiente entra deslizándose; `--lado izquierda|derecha|arriba|abajo` |
| `negro` | baja a negro y sube desde negro |
| `corte` | sin transición |

Duración con `--duracion-transicion 0.8` (segundos; se limita a la mitad del clip más corto).

## Charlas y videos hablando a cámara

```bash
python editar.py --marca carlos-riveros --clips charla.mp4 --formato 9:16 --recortar-silencios --subtitulos
```

- `--recortar-silencios` — **auto-editor** quita silencios y tiempos muertos de cada clip antes de editar.
  `--margen-silencio 0.2s` controla cuánto aire queda alrededor de lo hablado.
  La primera vez auto-editor descarga su binario desde GitHub.
- `--subtitulos` — **faster-whisper** transcribe en tu computador (el audio no sale a internet), quema
  subtítulos cortos (máx. 6 palabras, blancos con borde negro) y guarda un `.srt` junto al video
  (útil para subir a LinkedIn/YouTube como subtítulos aparte).
  `--idioma es` (por defecto) y `--modelo-whisper tiny|base|small|medium|large-v3`
  (`small` por defecto: buen balance; la primera vez descarga el modelo, ~480 MB).
  Se transcribe antes de poner la música, para que no interfiera.
  `--modelo-whisper` también acepta la **ruta a un modelo local** (carpeta CTranslate2), útil si no hay acceso a HuggingFace.

Otras opciones: `--formato 16:9|1:1|9:16`, `--titulo`, `--fuente archivo.ttf`, `--musica`,
`--volumen-musica 0.25`, `--sin-audio-original`. `python editar.py -h` para ver todo.

Logos: `marcas/<hyc|carlos-riveros|projectleader>/logo.png` (PNG transparente, archivo **original**;
el logo de HYC nunca se recolorea). Colores: `videos/marcas.json` (compartido con las otras herramientas).
