"""Project Leader Lab — "IA con criterio: qué prepara la IA y qué valida el responsable".

Didáctico 1:1 (1080×1080) para LinkedIn. Solo Project Leader Lab (ver REGLA: Videos en CONTEXT.md).
Contenido según la base de marca (videos/marca-pll.md): pilar "IA aplicada" (transversal, con revisión
humana); voz: pregunta → una idea central → aplicación → acción. Sin cifras ni promesas de resultados.
Slogan aprobado: "Lidera proyectos con criterio y propósito". Sin LaTeX: todo el texto es Text().

Render:
  manim -pqm ia_con_criterio.py IAConCriterio     # vista previa
  manim -qh ia_con_criterio.py IAConCriterio      # 1080×1080 final
"""
import json
from pathlib import Path

from manim import (
    DOWN, ITALIC, LEFT, RIGHT, UP, Arrow, Create, FadeIn, FadeOut, GrowArrow, Line,
    Rectangle, RoundedRectangle, Scene, Text, VGroup, Write, config, LaggedStart,
)

# --- Marca (videos/marcas.json) ------------------------------------------------
_P = json.loads((Path(__file__).parent.parent / "marcas.json").read_text(encoding="utf-8"))["projectleader"]
FONDO, TEXTO, ACENTO = _P["fondo"], _P["texto"], _P["acento"]
RETICULA = _P["reticula"]           # ["#1D1C17", "#2A271F"] — discreta
SECUNDARIO = "#8C887D"              # gris cálido derivado del texto, para apoyos
FUENTE = "Inter"                    # aproximación (no fuente oficial); Pango reemplaza si falta
SERIF = "DejaVu Serif"              # énfasis serif itálico puntual

# --- Formato cuadrado -----------------------------------------------------------
config.pixel_width = 1080
config.pixel_height = 1080
config.frame_width = 8
config.frame_height = 8
config.background_color = FONDO
Text.set_default(color=TEXTO, font=FUENTE)


def t(texto, size=28, **kw):
    return Text(texto, font_size=size, **kw)


class IAConCriterio(Scene):
    def construct(self):
        # Identidad PLL: retícula técnica discreta + marco dorado + etiqueta
        reticula = VGroup(
            *[Line([x, -3.7, 0], [x, 3.7, 0], color=RETICULA[0], stroke_width=1) for x in range(-3, 4)],
            *[Line([-3.7, y, 0], [3.7, y, 0], color=RETICULA[0], stroke_width=1) for y in range(-3, 4)],
        )
        marco = Rectangle(width=7.4, height=7.4, color=ACENTO, stroke_width=2)
        etiqueta = t("P R O J E C T   L E A D E R   L A B", 14, color=ACENTO).move_to([0, 3.4, 0])
        self.add(reticula)
        self.play(Create(marco, run_time=1.2), FadeIn(etiqueta, run_time=1.2))

        # 1. Pregunta
        pregunta = VGroup(
            t("¿Qué parte del informe", 40, weight="BOLD"),
            t("puede preparar la IA", 40, weight="BOLD"),
            t("y qué debe validar", 40, weight="BOLD"),
            t("el responsable?", 40, weight="BOLD", color=ACENTO),
        ).arrange(DOWN, buff=0.18)
        self.play(FadeIn(pregunta, shift=UP * 0.2))
        self.wait(2.2)
        self.play(FadeOut(pregunta))

        # 2. Informe → dos columnas
        doc = RoundedRectangle(width=1.5, height=1.0, corner_radius=0.08, color=TEXTO, stroke_width=2)
        lineas = VGroup(*[Line([-0.5, 0, 0], [0.5 - 0.25 * (i == 2), 0, 0], color=SECUNDARIO, stroke_width=2) for i in range(3)])
        lineas.arrange(DOWN, buff=0.16, aligned_edge=LEFT).move_to(doc)
        informe = VGroup(doc, lineas).move_to([0, 2.35, 0])
        rot_inf = t("Informe de avance", 20, color=SECUNDARIO).next_to(informe, RIGHT, buff=0.25)
        self.play(Create(doc), Create(lineas), FadeIn(rot_inf))

        def columna(titulo, items, color_titulo):
            cab = t(titulo, 20, weight="BOLD", color=color_titulo)
            filas = VGroup(*[t(f"·  {i}", 19) for i in items]).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
            return VGroup(cab, filas).arrange(DOWN, aligned_edge=LEFT, buff=0.35)

        # Cada columna a un lado del separador central, con aire (evita que se toquen)
        ia = columna("La IA puede preparar", ["Resumen del avance", "Escenarios comparados", "Borrador del informe"], TEXTO)
        resp = columna("El responsable valida", ["Datos de origen", "Supuestos", "La decisión final"], ACENTO)
        ia.move_to([0, 0.15, 0]).shift(LEFT * (ia.get_right()[0] + 0.12))
        resp.move_to([0, 0.15, 0]).shift(RIGHT * (0.48 - resp.get_left()[0]))
        sep = Line([0.18, 1.45, 0], [0.18, -1.25, 0], color=RETICULA[1], stroke_width=2)
        f_ia = Arrow(informe.get_bottom(), ia.get_top() + UP * 0.05, color=SECUNDARIO, stroke_width=3, buff=0.1)
        f_resp = Arrow(informe.get_bottom(), resp.get_top() + UP * 0.05, color=ACENTO, stroke_width=3, buff=0.1)

        self.play(GrowArrow(f_ia), FadeIn(ia[0]))
        self.play(LaggedStart(*[FadeIn(f, shift=RIGHT * 0.15) for f in ia[1]], lag_ratio=0.35))
        self.wait(0.6)
        self.play(Create(sep), GrowArrow(f_resp), FadeIn(resp[0]))
        self.play(LaggedStart(*[FadeIn(f, shift=RIGHT * 0.15) for f in resp[1]], lag_ratio=0.35))
        self.wait(1.2)

        # 3. Ambas columnas convergen en la decisión
        decision = RoundedRectangle(width=4.2, height=0.75, corner_radius=0.12, color=ACENTO, stroke_width=2).move_to([0, -2.35, 0])
        rot_dec = t("Decisión con criterio", 26, weight="BOLD").move_to(decision)
        a1 = Arrow(ia.get_bottom(), decision.get_top() + LEFT * 0.8, color=SECUNDARIO, stroke_width=3, buff=0.12)
        a2 = Arrow(resp.get_bottom(), decision.get_top() + RIGHT * 0.8, color=ACENTO, stroke_width=3, buff=0.12)
        self.play(GrowArrow(a1), GrowArrow(a2))
        self.play(Create(decision), FadeIn(rot_dec))
        self.wait(2.5)

        diagrama = VGroup(informe, rot_inf, ia, resp, sep, f_ia, f_resp, a1, a2, decision, rot_dec)
        self.play(FadeOut(diagrama))

        # 4. Idea central (manifiesto de la base de marca)
        idea = VGroup(
            t("La IA amplía el análisis.", 36, weight="BOLD"),
            t("El criterio orienta la decisión.", 36, weight="BOLD", color=ACENTO),
        ).arrange(DOWN, buff=0.35)
        self.play(FadeIn(idea[0], shift=UP * 0.15))
        self.play(FadeIn(idea[1], shift=UP * 0.15))
        self.wait(2.2)
        self.play(FadeOut(idea))

        # 5. Acción + cierre de marca
        cta = VGroup(t("¿Cómo aplicarías esta idea", 32), t("en tu proyecto?", 32)).arrange(DOWN, buff=0.15)
        self.play(FadeIn(cta, shift=UP * 0.15))
        self.wait(2.0)
        self.play(FadeOut(cta))

        nombre = t("Project Leader Lab", 44, weight="BOLD")
        linea1 = t("Lidera proyectos con", 30)
        linea2 = Text("criterio y propósito", font=SERIF, slant=ITALIC, font_size=34, color=ACENTO)
        cierre = VGroup(nombre, linea1, linea2).arrange(DOWN, buff=0.25)
        self.play(FadeIn(nombre, shift=UP * 0.15))
        self.play(FadeIn(linea1), FadeIn(linea2))
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects])
