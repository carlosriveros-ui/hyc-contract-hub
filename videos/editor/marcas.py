"""Configuración de marcas para el editor (ver REGLA: Videos en CONTEXT.md).

Colores: vienen de videos/marcas.json (paleta de trabajo de la guía visual aprobada).
Logos: poner el PNG ORIGINAL (fondo transparente) en marcas/<clave>/logo.png.
       El logo de HYC no se recolorea nunca.
"""
import json
from pathlib import Path

BASE = Path(__file__).parent / "marcas"
_PALETA = json.loads((Path(__file__).parent.parent / "marcas.json").read_text(encoding="utf-8"))
_HYC = _PALETA["hyc"]

# color = fondo de la portada · texto = color del título
MARCAS = {
    "hyc": {"nombre": _HYC["nombre"], "color": _HYC["rojo"], "texto": _HYC["blanco"], "logo": BASE / "hyc" / "logo.png"},
    **{
        clave: {"nombre": p["nombre"], "color": p["fondo"], "texto": p["texto"], "acento": p["acento"], "logo": BASE / clave / "logo.png"}
        for clave, p in _PALETA.items()
        if clave in ("carlos-riveros", "projectleader")
    },
}
