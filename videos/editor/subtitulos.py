"""Subtítulos automáticos con faster-whisper (transcripción local, sin enviar audio a internet).

La primera vez descarga el modelo desde HuggingFace (tiny ≈ 75 MB, small ≈ 480 MB, medium ≈ 1.5 GB).
"""
from dataclasses import dataclass

MAX_PALABRAS = 6
MAX_SEGUNDOS = 2.5
PAUSA = 0.6  # segundos de silencio que fuerzan una línea nueva


@dataclass
class Linea:
    inicio: float
    fin: float
    texto: str


def transcribir(ruta_audio, modelo="small", idioma="es"):
    """Devuelve líneas cortas (estilo redes sociales) con tiempos por palabra."""
    from faster_whisper import WhisperModel

    m = WhisperModel(modelo, device="auto", compute_type="int8")
    segmentos, _ = m.transcribe(ruta_audio, language=idioma, word_timestamps=True, vad_filter=True)

    lineas, actual = [], []
    for seg in segmentos:
        for w in seg.words or []:
            if actual and w.start - actual[-1].end > PAUSA:  # pausa real → nueva línea
                lineas.append(_linea(actual))
                actual = []
            actual.append(w)
            if len(actual) >= MAX_PALABRAS or (actual[-1].end - actual[0].start) >= MAX_SEGUNDOS or w.word.rstrip().endswith((".", "?", "!")):
                lineas.append(_linea(actual))
                actual = []
    if actual:
        lineas.append(_linea(actual))
    return lineas


def _linea(palabras):
    return Linea(palabras[0].start, palabras[-1].end, "".join(w.word for w in palabras).strip())


def _ts(t):
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)):03}"


def guardar_srt(lineas, ruta):
    with open(ruta, "w", encoding="utf-8") as f:
        for i, l in enumerate(lineas, 1):
            f.write(f"{i}\n{_ts(l.inicio)} --> {_ts(l.fin)}\n{l.texto}\n\n")


def clips_subtitulos(lineas, ancho, alto, fuente=None):
    """TextClips blancos con borde negro, centrados abajo."""
    from moviepy import TextClip

    tam = int(min(ancho, alto) * 0.065)
    y = int(alto * (0.72 if alto > ancho else 0.80))  # en vertical más arriba (la interfaz de la app tapa abajo)
    clips = []
    for l in lineas:
        txt = TextClip(
            font=fuente, text=l.texto, font_size=tam, color="white", stroke_color="black",
            stroke_width=max(2, tam // 12), method="caption", size=(int(ancho * 0.85), None),
            text_align="center", margin=(0, int(tam * 0.4)),
            duration=max(0.1, l.fin - l.inicio),
        )
        clips.append(txt.with_start(l.inicio).with_position(("center", y)))
    return clips
