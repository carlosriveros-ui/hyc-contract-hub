"""Convierte transcripciones (faster-whisper, tiempos por palabra) en subtítulos corregidos.

Uso: python hacer_subtitulos.py transcripts.json
Escribe subtitulos-<marca>.json: [{"inicio","fin","palabras":[{"t","inicio","fin"}]}]
Las correcciones son contra el guion grabado (errores del reconocimiento de voz).
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).parent
MAX_CHARS = 24   # por línea, legible en móvil a tamaño grande
PAUSA = 0.45     # segundos de silencio que fuerzan línea nueva

VIDEOS = {
    "WA0004": ("hyc", {
        "HAC": "HYC", "interveniendo": "interviniendo", "Proyecto,": "Proyectos.",
        "650": "650", "construimos": "Construimos",
    }),
    "WA0005": ("carlos", {
        "razón.": "razón:", "¿Cómo": "cómo", "decisiones?": "decisiones.", "incomplet.": "incompleta.",
    }),
    "WA0006": ("pll", {
        "lab": "Lab", "que@30": "qué", "Lab@32": "Lab.", "lidera": "Lidera", "projectleaderlab": "projectleaderlab.com", ".com": None,
    }),
}


def corregir(palabras, fixes):
    out = []
    for ini, fin, txt in palabras:
        t = txt.strip()
        clave_t = f"{t}@{int(ini)}"
        nuevo = fixes.get(clave_t, fixes.get(t, t))
        if nuevo is None:            # se une a la palabra anterior
            out[-1]["fin"] = fin
            continue
        out.append({"t": nuevo, "inicio": ini, "fin": fin})
    return out


# Palabras con las que una línea NO debe terminar (se ven colgando)
NO_TERMINAR = {"y", "e", "o", "de", "del", "la", "el", "los", "las", "en", "con", "que", "un", "una", "a",
               "por", "se", "tu", "tus", "lo", "al", "para", "sin", "me", "nos", "te", "mil", "es",
               "project", "leader"}  # no partir "Project Leader Lab"


def _txt(ws):
    return " ".join(x["t"] for x in ws)


def agrupar(palabras):
    lineas, actual = [], []
    for i, w in enumerate(palabras):
        if actual:
            pausa = w["inicio"] - actual[-1]["fin"] > PAUSA
            largo = len(_txt(actual + [w]))
            ultima = actual[-1]["t"].lower().strip(",")
            colgando = ultima in NO_TERMINAR or ultima.isdigit()
            if pausa or (largo > MAX_CHARS and not colgando) or largo > MAX_CHARS + 10:
                lineas.append(actual)
                actual = []
        actual.append(w)
        fin_frase = w["t"][-1] in ".?!:"
        coma_larga = w["t"][-1] == "," and len(_txt(actual)) > MAX_CHARS * 0.55
        if fin_frase or coma_larga:
            lineas.append(actual)
            actual = []
    if actual:
        lineas.append(actual)
    # Una palabra sola al final de una frase se une a la línea anterior si cabe
    unidas = []
    for l in lineas:
        if unidas and len(l) == 1 and len(_txt(unidas[-1] + l)) <= MAX_CHARS + 8 and l[0]["inicio"] - unidas[-1][-1]["fin"] < PAUSA:
            unidas[-1] = unidas[-1] + l
        else:
            unidas.append(l)
    return [{"inicio": l[0]["inicio"], "fin": l[-1]["fin"], "palabras": l} for l in unidas]


def main():
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for ruta, v in data.items():
        clave = next(k for k in VIDEOS if k in ruta)
        marca, fixes = VIDEOS[clave]
        lineas = agrupar(corregir(v["words"], fixes))
        (AQUI / f"subtitulos-{marca}.json").write_text(json.dumps(lineas, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"== {marca}: {len(lineas)} líneas")
        for l in lineas:
            print(f"  {l['inicio']:5.2f}-{l['fin']:5.2f}  {' '.join(w['t'] for w in l['palabras'])}")


if __name__ == "__main__":
    main()
