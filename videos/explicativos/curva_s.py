"""ProjectLeader — "¿Vas atrasado? Léelo en la curva S" (animación didáctica con Manim).

Solo para ProjectLeader (ver REGLA: Videos en CONTEXT.md). No usa LaTeX: todo el texto es Text().

Render:
  manim -pqm curva_s.py CurvaS          # calidad media, abre el video
  manim -qh --resolution 1080,1080 curva_s.py CurvaS   # cuadrado para LinkedIn
"""
import numpy as np
from manim import (
    DOWN, LEFT, RIGHT, UP, Axes, Create, DashedLine, Dot, FadeIn, FadeOut,
    Scene, Text, Write, VGroup, config,
)

# TODO: colores oficiales de ProjectLeader
FONDO = "#111827"
ACENTO = "#f59e0b"
PLAN = "#94a3b8"
REAL = ACENTO
ALERTA = "#ef4444"
FUENTE = "Inter"  # si no está instalada, Pango usa una de reemplazo

config.background_color = FONDO


def curva_s(t, k=10, t0=0.5):
    """Avance acumulado (0–100 %) con forma de S."""
    return 100 / (1 + np.exp(-k * (t - t0)))


class CurvaS(Scene):
    def construct(self):
        titulo = Text("¿Vas atrasado? Léelo en la curva S", font=FUENTE, font_size=40, weight="BOLD").to_edge(UP)
        self.play(Write(titulo))

        ejes = Axes(
            x_range=[0, 1, 0.25], y_range=[0, 100, 25], x_length=9, y_length=4.8,
            axis_config={"color": "#475569", "include_numbers": False},
            tips=False,
        ).shift(DOWN * 0.4)
        lbl_x = Text("Tiempo", font=FUENTE, font_size=22, color="#cbd5e1").next_to(ejes.x_axis, DOWN)
        lbl_y = Text("% avance", font=FUENTE, font_size=22, color="#cbd5e1").next_to(ejes.y_axis, UP).shift(RIGHT * 0.3)
        self.play(Create(ejes), FadeIn(lbl_x, lbl_y))

        plan = ejes.plot(lambda t: curva_s(t), x_range=[0, 1], color=PLAN, stroke_width=4)
        lbl_plan = Text("Planeado", font=FUENTE, font_size=24, color=PLAN).next_to(plan.get_end(), LEFT).shift(UP * 0.3)
        self.play(Create(plan, run_time=2), FadeIn(lbl_plan))

        hoy = 0.6
        real = ejes.plot(lambda t: curva_s(t, k=9, t0=0.6), x_range=[0, hoy], color=REAL, stroke_width=6)
        lbl_real = Text("Real", font=FUENTE, font_size=24, color=REAL).next_to(real.get_end(), RIGHT)
        self.play(Create(real, run_time=2), FadeIn(lbl_real))

        p_plan = ejes.c2p(hoy, curva_s(hoy))
        p_real = ejes.c2p(hoy, curva_s(hoy, k=9, t0=0.6))
        linea_hoy = DashedLine(ejes.c2p(hoy, 0), ejes.c2p(hoy, 100), color="#64748b")
        lbl_hoy = Text("Hoy", font=FUENTE, font_size=22, color="#cbd5e1").next_to(linea_hoy, UP, buff=0.1)
        self.play(Create(linea_hoy), FadeIn(lbl_hoy), FadeIn(Dot(p_plan, color=PLAN)), FadeIn(Dot(p_real, color=REAL)))

        brecha = DashedLine(p_plan, p_real, color=ALERTA, stroke_width=6)
        diff = curva_s(hoy) - curva_s(hoy, k=9, t0=0.6)
        lbl_brecha = Text(f"−{diff:.0f} puntos", font=FUENTE, font_size=28, color=ALERTA, weight="BOLD").next_to(brecha, RIGHT)
        self.play(Create(brecha), Write(lbl_brecha))
        self.wait(0.5)

        mensaje = VGroup(
            Text("La distancia vertical", font=FUENTE, font_size=26),
            Text("entre las curvas", font=FUENTE, font_size=26),
            Text("es tu atraso real.", font=FUENTE, font_size=26, color=ACENTO, weight="BOLD"),
        ).arrange(DOWN, aligned_edge=LEFT)
        mensaje.next_to(ejes.c2p(0.67, 30), RIGHT, buff=0).align_to(ejes.c2p(0.67, 30), LEFT)
        self.play(FadeIn(mensaje, shift=UP * 0.2))
        self.wait(2)

        firma = Text("ProjectLeader", font=FUENTE, font_size=30, color=ACENTO, weight="BOLD").to_edge(DOWN, buff=0.2).to_edge(RIGHT)
        self.play(FadeIn(firma))
        self.wait(1.5)
        self.play(*[FadeOut(m) for m in self.mobjects])
