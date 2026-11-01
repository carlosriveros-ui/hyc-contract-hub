"""Configuración de marcas para el editor (ver REGLA: Videos en CONTEXT.md).

Logos: poner un PNG con fondo transparente en marcas/<clave>/logo.png.
Colores: TODO reemplazar por los oficiales de cada marca.
"""
from pathlib import Path

BASE = Path(__file__).parent / "marcas"

MARCAS = {
    "hyc": {"nombre": "HYC Proyectos", "color": "#CC0607", "logo": BASE / "hyc" / "logo.png"},
    "carlos-riveros": {"nombre": "Carlos Riveros", "color": "#0f172a", "logo": BASE / "carlos-riveros" / "logo.png"},
    "projectleader": {"nombre": "ProjectLeader", "color": "#111827", "logo": BASE / "projectleader" / "logo.png"},
}
