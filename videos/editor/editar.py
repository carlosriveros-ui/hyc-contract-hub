"""Editor de video real (grabaciones) con MoviePy — sirve para todas las marcas.

Une clips, los ajusta a un formato, pone logo de la marca, título inicial y música.

Ejemplo:
  python editar.py --marca hyc --clips obra1.mp4 obra2.mp4 \
      --formato 16:9 --titulo "Mantenimiento sede Norte" --musica fondo.mp3 \
      --salida salida/sede-norte.mp4
"""
import argparse
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

FORMATOS = {"16:9": (1920, 1080), "1:1": (1080, 1080), "9:16": (1080, 1920)}
FADE = 0.5


def hex_a_rgb(color):
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))


def ajustar(clip, ancho, alto):
    """Escala y recorta al centro para llenar el formato sin bandas negras."""
    escala = max(ancho / clip.w, alto / clip.h)
    clip = clip.resized(escala)
    return clip.cropped(x_center=clip.w / 2, y_center=clip.h / 2, width=ancho, height=alto)


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
    a = p.parse_args()

    marca = MARCAS[a.marca]
    ancho, alto = FORMATOS[a.formato]

    partes = []
    if a.titulo:
        fondo = ColorClip((ancho, alto), color=hex_a_rgb(marca["color"]), duration=3)
        texto = TextClip(
            font=a.fuente, text=a.titulo, font_size=int(alto * 0.07), color="white",
            size=(int(ancho * 0.85), None), method="caption", text_align="center", duration=3,
            margin=(0, int(alto * 0.03)),  # evita que MoviePy corte las letras de abajo
        ).with_position("center")
        partes.append(CompositeVideoClip([fondo, texto]))

    for ruta in a.clips:
        clip = ajustar(VideoFileClip(ruta), ancho, alto)
        if a.sin_audio_original:
            clip = clip.without_audio()
        partes.append(clip.with_effects([vfx.FadeIn(FADE), vfx.FadeOut(FADE)]))

    video = concatenate_videoclips(partes, method="compose")

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


if __name__ == "__main__":
    main()
