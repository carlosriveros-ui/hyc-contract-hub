"""Editor de video real (grabaciones) con MoviePy — sirve para todas las marcas.

Une clips con transiciones, los ajusta a un formato, pone logo de la marca, título inicial y música.

Ejemplo:
  python editar.py --marca hyc --clips obra1.mp4 obra2.mp4 \
      --formato 16:9 --titulo "Mantenimiento sede Norte" --musica fondo.mp3 \
      --transicion deslizar --lado izquierda \
      --salida salida/sede-norte.mp4

Transiciones: cruzado (por defecto), deslizar, negro, corte.

Para charlas / videos hablando a cámara:
  python editar.py --marca carlos-riveros --clips charla.mp4 --formato 9:16 \
      --recortar-silencios --subtitulos
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from moviepy import (
    AudioFileClip,
    ColorClip,
    CompositeAudioClip,
    CompositeVideoClip,
    ImageClip,
    TextClip,
    VideoFileClip,
    afx,
    concatenate_videoclips,
    vfx,
)

from marcas import MARCAS
from subtitulos import clips_subtitulos, guardar_srt, transcribir

FORMATOS = {"16:9": (1920, 1080), "1:1": (1080, 1080), "9:16": (1080, 1920)}
TRANSICIONES = ("cruzado", "deslizar", "negro", "corte")
LADOS = ("izquierda", "derecha", "arriba", "abajo")
LADO_MOVIEPY = {"izquierda": "left", "derecha": "right", "arriba": "top", "abajo": "bottom"}


def hex_a_rgb(color):
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))


def ajustar(clip, ancho, alto):
    """Escala y recorta al centro para llenar el formato sin bandas negras."""
    escala = max(ancho / clip.w, alto / clip.h)
    clip = clip.resized(escala)
    return clip.cropped(x_center=clip.w / 2, y_center=clip.h / 2, width=ancho, height=alto)


def recortar_silencios(ruta, carpeta, margen):
    """Quita silencios y tiempos muertos con auto-editor; devuelve la ruta del clip recortado."""
    exe = shutil.which("auto-editor") or str(Path(sys.executable).parent / "auto-editor")
    salida = Path(carpeta) / f"{Path(ruta).stem}_recortado.mp4"
    print(f"Recortando silencios: {ruta}")
    subprocess.run([exe, str(ruta), "-o", str(salida), "--margin", margen, "--no-open"], check=True)
    return str(salida)


def unir(partes, transicion, duracion, lado):
    """Une los clips con la transición elegida.

    - cruzado:  el clip siguiente aparece encima del anterior (crossfade), con mezcla de audio.
    - deslizar: el clip siguiente entra deslizándose desde `lado` sobre el anterior.
    - negro:    cada clip baja a negro y el siguiente sube desde negro.
    - corte:    sin transición.
    """
    if transicion == "corte" or len(partes) == 1:
        return concatenate_videoclips(partes, method="compose")

    # La transición no puede durar más que la mitad del clip más corto
    d = min(duracion, min(c.duration for c in partes) / 2)

    if transicion == "negro":
        partes = [c.with_effects([vfx.FadeIn(d), vfx.FadeOut(d)]) for c in partes]
        return concatenate_videoclips(partes, method="compose")

    entrada = vfx.CrossFadeIn(d) if transicion == "cruzado" else vfx.SlideIn(d, LADO_MOVIEPY[lado])
    unidas = [partes[0]]
    for c in partes[1:]:
        unidas.append(c.with_effects([entrada]))
    # Audio: el anterior baja mientras el siguiente sube durante el solapamiento
    unidas = [
        c.with_effects([afx.AudioFadeIn(d) if i else afx.AudioFadeIn(0.01), afx.AudioFadeOut(d)])
        if c.audio is not None else c
        for i, c in enumerate(unidas)
    ]
    # Composición manual (concatenate_videoclips centra los clips y anularía el deslizamiento)
    colocadas, t = [], 0.0
    for c in unidas:
        colocadas.append(c.with_start(t))
        t += c.duration - d
    ancho, alto = partes[0].size
    video = CompositeVideoClip(colocadas, size=(ancho, alto)).with_duration(t + d)
    # Entrada y salida suaves del video completo
    return video.with_effects([vfx.FadeIn(d), vfx.FadeOut(d)])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--marca", required=True, choices=MARCAS)
    p.add_argument("--clips", nargs="+", required=True, help="Videos en orden")
    p.add_argument("--salida", default="salida/video.mp4")
    p.add_argument("--formato", default="16:9", choices=FORMATOS)
    p.add_argument("--titulo", help="Texto de portada (3 s) antes de los clips")
    p.add_argument("--fuente", help="Archivo .ttf/.otf para el título (opcional)")
    p.add_argument("--musica", help="Audio de fondo; se repite o corta a la duración del video")
    p.add_argument("--volumen-musica", type=float, default=0.25)
    p.add_argument("--sin-audio-original", action="store_true")
    p.add_argument("--transicion", default="cruzado", choices=TRANSICIONES, help="Entre clips (por defecto: cruzado)")
    p.add_argument("--duracion-transicion", type=float, default=0.8, help="Segundos (por defecto: 0.8)")
    p.add_argument("--lado", default="derecha", choices=LADOS, help="Desde dónde entra el clip con --transicion deslizar")
    p.add_argument("--recortar-silencios", action="store_true", help="Quita silencios de cada clip con auto-editor")
    p.add_argument("--margen-silencio", default="0.2s", help="Aire que se deja alrededor de lo hablado (por defecto 0.2s)")
    p.add_argument("--subtitulos", action="store_true", help="Transcribe con Whisper y quema subtítulos; guarda también un .srt")
    p.add_argument("--idioma", default="es", help="Idioma del audio para los subtítulos (por defecto es)")
    p.add_argument("--modelo-whisper", default="small", help="tiny, base, small (por defecto), medium, large-v3")
    a = p.parse_args()

    marca = MARCAS[a.marca]
    ancho, alto = FORMATOS[a.formato]

    partes = []
    if a.titulo:
        fondo = ColorClip((ancho, alto), color=hex_a_rgb(marca["color"]), duration=3)
        texto = TextClip(
            font=a.fuente, text=a.titulo, font_size=int(alto * 0.07), color=marca["texto"],
            size=(int(ancho * 0.85), None), method="caption", text_align="center", duration=3,
            margin=(0, int(alto * 0.03)),  # evita que MoviePy corte las letras de abajo
        ).with_position("center")
        partes.append(CompositeVideoClip([fondo, texto]))

    tmp = tempfile.mkdtemp(prefix="editor-")
    rutas = [recortar_silencios(r, tmp, a.margen_silencio) for r in a.clips] if a.recortar_silencios else a.clips

    for ruta in rutas:
        clip = ajustar(VideoFileClip(ruta), ancho, alto)
        if a.sin_audio_original:
            clip = clip.without_audio()
        partes.append(clip)

    video = unir(partes, a.transicion, a.duracion_transicion, a.lado)

    if a.subtitulos:
        if video.audio is None:
            print("Aviso: el video no tiene audio; no se generan subtítulos.")
        else:
            audio_tmp = str(Path(tmp) / "voz.wav")
            video.audio.write_audiofile(audio_tmp, fps=16000, nbytes=2, logger=None)
            print(f"Transcribiendo con Whisper ({a.modelo_whisper}, {a.idioma})...")
            lineas = transcribir(audio_tmp, a.modelo_whisper, a.idioma)
            srt = Path(a.salida).with_suffix(".srt")
            srt.parent.mkdir(parents=True, exist_ok=True)
            guardar_srt(lineas, srt)
            print(f"{len(lineas)} líneas de subtítulos · {srt}")
            video = CompositeVideoClip([video, *clips_subtitulos(lineas, ancho, alto, a.fuente)])

    logo_path = Path(marca["logo"])
    if logo_path.exists():
        logo = (
            ImageClip(str(logo_path))
            .resized(height=int(alto * 0.08))
            .with_duration(video.duration)
            .with_opacity(0.9)
        )
        margen = int(alto * 0.04)
        video = CompositeVideoClip([video, logo.with_position((ancho - logo.w - margen, margen))])
    else:
        print(f"Aviso: no hay logo en {logo_path}; el video sale sin logo.")

    if a.musica:
        musica = AudioFileClip(a.musica).with_effects(
            [afx.AudioLoop(duration=video.duration), afx.MultiplyVolume(a.volumen_musica), afx.AudioFadeOut(1.5)]
        )
        pistas = [musica] + ([video.audio] if video.audio is not None else [])
        video = video.with_audio(CompositeAudioClip(pistas))

    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    video.write_videofile(a.salida, fps=30, codec="libx264", audio_codec="aac")
    print(f"Video generado: {a.salida}")
    video.close()
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
