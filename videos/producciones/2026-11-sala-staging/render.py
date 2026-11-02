"""Reel 9:16 de 30 s: sala vacía → construcción de los muebles → propuesta final.

Estilo renovación / venta inmobiliaria (home staging). Todo local y gratis:
PIL + numpy para la imagen, numpy para la música (original, sin copyright) y ffmpeg para el MP4.

    python render.py                # → salida/sala-staging.mp4
    python render.py --preview 9.2  # → salida/preview.png (un fotograma)

Fotos en fuentes/ (no versionadas): 1-vacia, 3-decorada, 4-tapete (mismo encuadre) y 5-propuesta.
"""

import argparse
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = Path(__file__).resolve().parent
FUENTES = AQUI / "fuentes"
SALIDA = AQUI / "salida"

W, H, FPS, DUR = 1080, 1920, 30, 30.0
SW, SH = 941, 1671  # tamaño de las fotos verticales alineadas
SR = 44100

FONT_DIR = Path("/usr/share/fonts/opentype/inter")
F_BOLD = str(FONT_DIR / "Inter-Bold.otf")
F_MED = str(FONT_DIR / "Inter-Medium.otf")
F_SEMI = str(FONT_DIR / "Inter-SemiBold.otf")

BLANCO = (255, 255, 255)
CALIDO = (255, 236, 205)  # luz cálida neutra para contornos y acentos (no es color de marca)


# ---------------------------------------------------------------- utilidades
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, t0, t1):
    return clamp((t - t0) / (t1 - t0)) if t1 > t0 else float(t >= t1)


def ease(x):  # ease in-out cúbica
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_back(x, s=1.4):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def cargar(nombre, tam=(SW, SH)):
    im = Image.open(FUENTES / nombre).convert("RGB")
    if tam:
        im = im.resize(tam, Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255.0


def poligono(puntos, feather=6):
    m = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(m).polygon(puntos, fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m).astype(np.float32)[..., None] / 255.0


def desplazar(a, dy):
    """Mueve un array verticalmente dy px (rellena con ceros, sin envolver)."""
    dy = int(round(dy))
    if dy == 0:
        return a
    out = np.zeros_like(a)
    if dy > 0:
        out[dy:] = a[:-dy]
    else:
        out[:dy] = a[-dy:]
    return out


def contorno(capa, mascara):
    """Líneas tipo plano (blueprint) de un mueble: bordes de la capa dentro de su máscara."""
    g = Image.fromarray((capa * 255).astype(np.uint8)).convert("L").filter(ImageFilter.GaussianBlur(1.2))
    e = np.asarray(g.filter(ImageFilter.FIND_EDGES)).astype(np.float32) / 255.0
    e = np.clip((e - 0.06) * 6, 0, 1) * (mascara[..., 0] > 0.5)
    lineas = Image.fromarray((e * 255).astype(np.uint8))
    glow = np.asarray(lineas.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    return np.clip(e + glow * 1.6, 0, 1)[..., None]


def camara(img, zoom, cx=0.5, cy=0.5):
    """Recorta img (h,w,3 float) con zoom y centro relativos y la lleva a W×H."""
    h, w = img.shape[:2]
    cw, ch = w / zoom, w / zoom * H / W
    if ch > h:
        ch = h
        cw = h * W / H
    x0 = clamp(cx * w - cw / 2, 0, w - cw)
    y0 = clamp(cy * h - ch / 2, 0, h - ch)
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    return pil.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))


# ---------------------------------------------------------------- preparación
def preparar():
    vacia = cargar("1-vacia.png")
    deco = cargar("3-decorada.png")
    tapete = cargar("4-tapete.png")

    # "Luz cálida": igualar color de la sala vacía al de la decorada, medido en paredes/techo
    ref = slice(0, 860)
    m1, s1 = vacia[ref].mean((0, 1)), vacia[ref].std((0, 1))
    m3, s3 = deco[ref].mean((0, 1)), deco[ref].std((0, 1))
    calida = np.clip((vacia - m1) / s1 * s3 + m3, 0, 1)

    # Mesa sin centro de mesa: tapar bandeja, vela y sombras con madera limpia del mismo tablero
    mesa_sola = deco.copy()
    x0, y0, x1, y1 = 420, 872, 690, 1000
    parche = Image.fromarray((deco[935:985, 330:450] * 255).astype(np.uint8))
    parche = np.asarray(parche.resize((x1 - x0, y1 - y0), Image.BICUBIC)).astype(np.float32) / 255
    el = Image.new("L", (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(el).ellipse((4, 4, x1 - x0 - 4, y1 - y0 - 4), fill=255)
    el = np.asarray(el.filter(ImageFilter.GaussianBlur(7))).astype(np.float32)[..., None] / 255
    mesa_sola[y0:y1, x0:x1] = mesa_sola[y0:y1, x0:x1] * (1 - el) + parche * el

    # Sofá sin mesa: donde la mesa tapa el sofá, estirar el faldón y la alfombra que están a su izquierda
    sofa_solo = deco.copy()
    mesa_dura = poligono([(270, 916), (500, 890), (500, 1030), (270, 1030)], feather=9)
    # perfil vertical del sofá justo a la izquierda (col. 262-270), desplazado con su pendiente (~-0,13 px/px)
    perfil = deco[820:1090, 262:271].mean(1)
    grano = np.random.default_rng(3).normal(0, 0.012, (170, 500 - 276, 1)).astype(np.float32)  # tela, no plano
    relleno = np.zeros((170, 500 - 276, 3), np.float32)
    for j in range(relleno.shape[1]):
        sub = int(round(0.13 * (j + 276 - 266)))
        relleno[:, j] = perfil[40 + sub: 210 + sub] + grano[:, j]
    relleno = np.clip(relleno, 0, 1)
    zona = (slice(860, 1030), slice(276, 500))
    mm = mesa_dura[zona]
    sofa_solo[zona] = sofa_solo[zona] * (1 - mm) + relleno * mm

    piezas = {
        "sofa": poligono([(0, 690), (240, 712), (440, 790), (492, 812), (492, 995), (250, 1022),
                          (118, 1012), (108, 1245), (0, 1250)]),
        "lateral": poligono([(0, 1150), (70, 1150), (250, 1480), (255, 1671), (0, 1671)]),
        "puff": poligono([(500, 1671), (520, 1420), (620, 1352), (941, 1335), (941, 1671)]),
        "mesa": poligono([(285, 922), (560, 890), (822, 902), (822, 1010), (838, 1110), (610, 1300),
                          (410, 1300), (235, 1090), (282, 985)], feather=10),
        "deco": poligono([(462, 712), (712, 712), (712, 905), (660, 975), (455, 975), (452, 905)], feather=8),
    }
    capas = {"sofa": sofa_solo, "lateral": deco, "puff": deco, "mesa": mesa_sola, "deco": deco}
    lineas = {k: contorno(capas[k], piezas[k]) for k in piezas}

    # Tapete: diferencia entre la foto con tapete y sin tapete, suavizada, solo en el piso
    d = np.abs(tapete - deco).max(2)
    m = Image.fromarray(((d > 0.1) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9))
    m = m.filter(ImageFilter.GaussianBlur(14)).point(lambda v: 255 if v > 110 else 0)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
    m[:930] = 0
    mask_tapete = m

    propuesta = Image.open(FUENTES / "5-propuesta.png").convert("RGB")
    return dict(vacia=vacia, calida=calida, deco=deco, tapete=tapete, piezas=piezas, capas=capas,
                lineas=lineas, mask_tapete=mask_tapete, propuesta=propuesta)


# Cronología de la construcción (s). Los "aterrizajes" caen en tiempo de la música (120 bpm).
PASOS = [  # pieza, inicio contorno, inicio caída, fin caída, tipo de entrada, desplazamiento
    ("sofa", 4.6, 5.4, 6.0, "cae", -70),
    ("lateral", 6.5, 7.0, 7.5, "sube", 420),
    ("puff", 6.6, 7.0, 7.5, "sube", 420),
    ("mesa", 8.3, 9.0, 9.5, "cae", -90),
    ("deco", 11.0, 11.5, 12.0, "cae", -40),
]
T_TAPETE = (14.2, 16.0)
T_FUSION = (16.0, 16.6)

TEXTOS = [  # inicio, fin, etiqueta, título
    (0.3, 2.9, "ANTES", "Una sala vacía"),
    (3.0, 4.5, "PASO 1", "Luz cálida"),
    (4.6, 8.1, "PASO 2", "Mobiliario"),
    (8.3, 10.8, "PASO 3", "Mesa de centro"),
    (11.0, 13.9, "PASO 4", "Centro de mesa"),
    (14.1, 17.3, "PASO 5", "Tapete"),
    (17.6, 21.3, "DESPUÉS", "Lista para vivir"),
    (25.2, 30.0, "PROPUESTA FINAL", "Cada detalle suma"),
]


# ---------------------------------------------------------------- composición
def construccion(R, t):
    """Fotograma (SH×SW) de la etapa de construcción en el tiempo t."""
    img = R["vacia"] * (1 - ease(prog(t, 3.0, 4.5))) + R["calida"] * ease(prog(t, 3.0, 4.5))
    brillo = np.zeros((SH, SW, 1), np.float32)

    for pieza, t_lin, t_ini, t_fin, modo, dy0 in PASOS:
        if t < t_lin:
            continue
        mask, capa, lin = R["piezas"][pieza], R["capas"][pieza], R["lineas"][pieza]
        # 1) plano: las líneas se dibujan de izquierda a derecha y se apagan cuando aterriza
        p = ease(prog(t, t_lin, t_ini + 0.15))
        barrido = np.clip((np.linspace(0, 1, SW)[None, :, None] - p * 1.15) * -12, 0, 1)
        a_lin = 1 - ease(prog(t, t_ini + 0.2, t_fin + 0.2))
        if a_lin > 0:
            brillo = np.maximum(brillo, lin * barrido * a_lin * 0.9)
        # 2) el mueble entra (cae con rebote o sube desde abajo) y aparece
        if t >= t_ini:
            q = prog(t, t_ini, t_fin)
            dy = dy0 * (1 - (ease_back(q) if modo == "cae" else ease_out(q)))
            alfa = ease_out(clamp(q * 1.8))
            m = desplazar(mask, dy) * alfa
            img = img * (1 - m) + desplazar(capa, dy) * m

    # Tapete: se desenrolla desde el frente hacia el fondo, con un brillo en el borde
    if t >= T_TAPETE[0]:
        q = ease(prog(t, *T_TAPETE))
        y_borde = SH - q * (SH - 900)
        ys = np.arange(SH, dtype=np.float32)[:, None, None]
        wipe = np.clip((ys - y_borde) / 30, 0, 1)
        m = R["mask_tapete"] * wipe
        img = img * (1 - m) + R["tapete"] * m
        if q < 1:
            borde = np.exp(-((ys - y_borde) / 14) ** 2) * R["mask_tapete"]
            img = img + borde * 0.25

    if t >= T_FUSION[0]:  # fundido a la foto completa para unificar luz y bordes
        f = ease(prog(t, *T_FUSION))
        img = img * (1 - f) + R["tapete"] * f

    if brillo.max() > 0:
        tinte = np.array(CALIDO, np.float32) / 255
        img = img * (1 - brillo * 0.55) + tinte * brillo
    return img


def ajustar_con_fondo(pil, zoom=1.0):
    """Encaja una imagen horizontal en 9:16 con fondo desenfocado de la misma imagen."""
    fondo = pil.resize((int(pil.width * H / pil.height), H), Image.LANCZOS)
    x = (fondo.width - W) // 2
    fondo = fondo.crop((x, 0, x + W, H)).filter(ImageFilter.GaussianBlur(40))
    fondo = Image.eval(fondo, lambda v: int(v * 0.55))
    w = int(W * zoom)
    h = int(pil.height * w / pil.width)
    frente = pil.resize((w, h), Image.LANCZOS)
    fondo.paste(frente, ((W - w) // 2, (H - h) // 2))
    return fondo


def antes_despues(R, t):
    a = camara(R["vacia"], 1.0)
    b = camara(R["tapete"], 1.0)
    q = prog(t, 21.6, 24.0)
    # el divisor barre de derecha a izquierda y vuelve al centro
    p = 0.92 - 0.8 * ease(clamp(q / 0.6)) + 0.38 * ease(clamp((q - 0.6) / 0.4))
    x = int(W * p)
    out = b.copy()
    out.paste(a.crop((0, 0, x, H)), (0, 0))
    d = ImageDraw.Draw(out)
    d.rectangle((x - 3, 0, x + 3, H), fill=BLANCO)
    d.ellipse((x - 34, H // 2 - 34, x + 34, H // 2 + 34), fill=BLANCO)
    d.polygon([(x - 8, H // 2 - 12), (x - 22, H // 2), (x - 8, H // 2 + 12)], fill=(40, 40, 40))
    d.polygon([(x + 8, H // 2 - 12), (x + 22, H // 2), (x + 8, H // 2 + 12)], fill=(40, 40, 40))
    f = ImageFont.truetype(F_BOLD, 44)
    for texto, xx in (("ANTES", 70), ("DESPUÉS", W - 70)):
        bb = d.textbbox((0, 0), texto, font=f)
        tw = bb[2] - bb[0]
        x0 = xx if xx < W / 2 else xx - tw - 48
        d.rounded_rectangle((x0, 330, x0 + tw + 48, 330 + 78), 39, fill=(20, 18, 16))
        d.text((x0 + 24, 330 + 15), texto, font=f, fill=BLANCO)
    return out


def oscurecer_arriba(pil, alfa):
    if alfa <= 0:
        return pil
    g = np.linspace(1, 0, 820) ** 1.6 * 0.62 * alfa
    arr = np.asarray(pil).astype(np.float32)
    arr[:820] *= (1 - g)[:, None, None]
    return Image.fromarray(arr.astype(np.uint8))


def poner_texto(pil, t):
    d = ImageDraw.Draw(pil, "RGBA")
    f_et = ImageFont.truetype(F_SEMI, 34)
    f_ti = ImageFont.truetype(F_BOLD, 92)
    for t0, t1, etiqueta, titulo in TEXTOS:
        if not (t0 <= t <= t1):
            continue
        a_in = ease_out(prog(t, t0, t0 + 0.45))
        a_out = 1 - ease(prog(t, t1 - 0.3, t1)) if t1 < DUR else 1
        a = a_in * a_out
        y = 330 + (1 - a_in) * 40
        x = 80
        # etiqueta con interletrado + línea
        cx = x
        for ch in etiqueta:
            d.text((cx, y), ch, font=f_et, fill=CALIDO + (int(255 * a),))
            cx += d.textlength(ch, font=f_et) + 6
        d.line((x, y + 56, x + 70 * a, y + 56), fill=CALIDO + (int(255 * a),), width=4)
        # sombra + título
        for off in ((0, 4), (0, 2)):
            d.text((x + off[0], y + 76 + off[1]), titulo, font=f_ti, fill=(0, 0, 0, int(110 * a)))
        d.text((x, y + 76), titulo, font=f_ti, fill=BLANCO + (int(255 * a),))
    return pil


def cierre(pil, t):
    """Llamado a la acción en la franja inferior del plano final."""
    a = ease_out(prog(t, 26.3, 26.9))
    if a <= 0:
        return pil
    d = ImageDraw.Draw(pil, "RGBA")
    f1 = ImageFont.truetype(F_BOLD, 50)
    f2 = ImageFont.truetype(F_MED, 36)
    y = 1450 + (1 - a) * 30
    l1 = "¿Listo para transformar tu espacio?"
    l2 = "Renovación · Ambientación · Venta"
    for texto, f, yy, col in ((l1, f1, y, BLANCO), (l2, f2, y + 86, CALIDO)):
        tw = d.textlength(texto, font=f)
        d.text(((W - tw) / 2, yy), texto, font=f, fill=col + (int(255 * a),))
    return pil


def fotograma(R, t):
    if t < 17.5:
        z = 1.0 + 0.06 * ease(prog(t, 0, 3.0)) + 0.10 * ease(prog(t, 3.0, 17.5))
        cx = 0.5 - 0.04 * ease(prog(t, 3.0, 17.5))
        cy = 0.55 + 0.03 * ease(prog(t, 3.0, 17.5))
        out = camara(construccion(R, t), z, cx, cy)
    elif t < 21.5:
        q = ease(prog(t, 17.5, 21.5))
        out = camara(R["tapete"], 1.16 - 0.14 * q, 0.46 + 0.04 * q, 0.58 - 0.06 * q)
    elif t < 25.0:
        out = antes_despues(R, t)
    else:
        out = ajustar_con_fondo(R["propuesta"], 1.0 + 0.10 * ease(prog(t, 25.0, 30.0)))

    # transiciones: destello en 21.5 y fundido a la propuesta en 25
    if 21.2 <= t < 21.8:
        f = 1 - abs(t - 21.5) / 0.3
        out = Image.blend(out, Image.new("RGB", (W, H), BLANCO), clamp(f) * 0.85)
    if 25.0 <= t < 25.5:
        prev = antes_despues(R, 24.99)
        out = Image.blend(prev, out, ease(prog(t, 25.0, 25.5)))

    texto_activo = any(t0 - 0.1 <= t <= t1 + 0.1 for t0, t1, *_ in TEXTOS)
    if t < 21.2 or t >= 25.0:
        out = oscurecer_arriba(out, 1.0 if texto_activo else 0.0)
    out = poner_texto(out, t)
    out = cierre(out, t)
    if t > DUR - 0.5:
        out = Image.blend(out, Image.new("RGB", (W, H)), ease(prog(t, DUR - 0.5, DUR)) * 0.9)
    return out


# ---------------------------------------------------------------- música
def musica(ruta):
    """Música original (chill house, 120 bpm): pad + bajo + bombo + palmas + hats + arpegio + efectos."""
    n = int(SR * DUR)
    tt = np.arange(n) / SR
    beat = 0.5
    rng = np.random.default_rng(7)
    L = np.zeros(n)

    def nota(m):
        return 440.0 * 2 ** ((m - 69) / 12)

    def lowpass(x, fc):
        a = np.exp(-2 * np.pi * fc / SR)
        y = np.empty_like(x)
        acc = 0.0
        # filtro de un polo, vectorizado por bloques sería más rápido; 30 s es manejable
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc
            y[i] = acc
        return y

    acordes = [  # Fmaj7, G6, Em7, Am7 (un compás = 2 s cada uno)
        [53, 57, 60, 64], [55, 59, 62, 64], [52, 55, 59, 62], [57, 60, 64, 67]]
    bajos = [41, 43, 40, 45]

    # Pad
    pad = np.zeros(n)
    for c in range(15):
        s, e = int(c * 2 * SR), int((c + 1) * 2 * SR)
        seg = tt[: e - s]
        env = np.minimum(1, seg / 0.3) * np.minimum(1, (2.0 - seg) / 0.3 + 0.2)
        for m in acordes[c % 4]:
            for det in (-0.08, 0.08):
                f = nota(m + det)
                pad[s:e] += (2 * ((seg * f) % 1) - 1) * env * 0.05
    pad = lowpass(pad, 1400)

    # Bombo y "sidechain"
    kick = np.zeros(n)
    duck = np.ones(n)
    k_len = int(0.35 * SR)
    kt = np.arange(k_len) / SR
    k_wave = np.sin(2 * np.pi * (45 * kt + (110 / 18) * (1 - np.exp(-18 * kt)))) * np.exp(-kt * 9)
    for b in np.arange(3.0, DUR - 1.0, beat):
        i = int(b * SR)
        kick[i:i + k_len] += k_wave[: n - i] * 0.9
        dl = min(int(0.25 * SR), n - i)
        duck[i:i + dl] = np.minimum(duck[i:i + dl], 0.45 + 0.55 * np.linspace(0, 1, dl) ** 0.7)

    # Bajo (corcheas)
    bajo = np.zeros(n)
    for b8 in np.arange(4.5, DUR - 1.0, beat / 2):
        c = int(b8 // 2) % 4
        i, ln = int(b8 * SR), int(0.22 * SR)
        st = np.arange(min(ln, n - i)) / SR
        f = nota(bajos[c])
        bajo[i:i + len(st)] += (np.sin(2 * np.pi * f * st) + 0.3 * np.sin(4 * np.pi * f * st)) * np.exp(-st * 8) * 0.32

    # Hats (contratiempo) y palmas (2 y 4)
    hats = np.zeros(n)
    ruido = rng.standard_normal(int(0.2 * SR))
    hp = ruido - lowpass(ruido, 6000)
    for b in np.arange(4.75, DUR - 1.0, beat):
        i, ln = int(b * SR), int(0.06 * SR)
        hats[i:i + ln] += hp[:ln] * np.exp(-np.arange(ln) / SR * 60) * 0.18
    palma = lowpass(ruido, 2500) - lowpass(ruido, 900)
    for b in np.arange(6.5, DUR - 1.0, 2 * beat):
        i, ln = int(b * SR), int(0.15 * SR)
        palma_env = np.exp(-np.arange(ln) / SR * 25)
        hats[i:i + ln] += palma[:ln] * palma_env * 0.9

    # Arpegio "pluck" (semicorcheas) desde el paso 3
    arp = np.zeros(n)
    patron = [0, 1, 2, 3, 2, 1, 3, 2]
    for k, b16 in enumerate(np.arange(8.0, DUR - 1.5, beat / 2)):
        c = int(b16 // 2) % 4
        m = acordes[c][patron[k % 8]] + 12
        i, ln = int(b16 * SR), int(0.3 * SR)
        st = np.arange(min(ln, n - i)) / SR
        f = nota(m)
        tri = 2 * np.abs(2 * ((st * f) % 1) - 1) - 1
        arp[i:i + len(st)] += tri * np.exp(-st * 14) * 0.09

    # Efectos: "whoosh" antes de cambios de escena y "pop" al aterrizar cada mueble
    fx = np.zeros(n)
    for tc in (3.0, 17.5, 21.5, 25.0):
        ln = int(0.9 * SR)
        i = int((tc - 0.8) * SR)
        r = rng.standard_normal(ln)
        sw = np.sin(np.linspace(0, np.pi, ln)) ** 2
        fx[i:i + ln] += (r - lowpass(r, 1500)) * sw * 0.12
    for _, _, _, t_fin, _, _ in PASOS:
        i, ln = int(t_fin * SR), int(0.12 * SR)
        st = np.arange(ln) / SR
        fx[i:i + ln] += np.sin(2 * np.pi * (500 * st + 1800 * st ** 2)) * np.exp(-st * 30) * 0.25

    L = pad * duck * 1.0 + kick + bajo * duck + hats + arp * duck + fx
    # intro sólo pad; fundido final
    L *= np.minimum(1, tt / 0.8) * np.clip((DUR - tt) / 1.5, 0, 1)
    d = int(0.012 * SR)
    R_ = np.concatenate([np.zeros(d), L[:-d]]) * 0.6 + L * 0.4 + arp * duck * 0.3
    estereo = np.stack([L, R_], 1)
    estereo = np.tanh(estereo * 1.3) / np.tanh(1.3)
    estereo /= np.abs(estereo).max() / 0.89
    pcm = (estereo * 32767).astype(np.int16)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", type=float, help="Guardar solo el fotograma de este segundo")
    ap.add_argument("--salida", default=str(SALIDA / "sala-staging.mp4"))
    args = ap.parse_args()
    SALIDA.mkdir(exist_ok=True)
    R = preparar()

    if args.preview is not None:
        fotograma(R, args.preview).save(SALIDA / "preview.png")
        return

    wav = SALIDA / "musica.wav"
    musica(wav)
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-i", str(wav), "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
         args.salida], stdin=subprocess.PIPE)
    total = int(DUR * FPS)
    for k in range(total):
        ff.stdin.write(fotograma(R, k / FPS).tobytes())
        if k % 90 == 0:
            print(f"{k}/{total}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("Listo:", args.salida)


if __name__ == "__main__":
    main()
