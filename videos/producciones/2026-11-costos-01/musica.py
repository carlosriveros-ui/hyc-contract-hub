"""Música de fondo original (sin copyright) para "Ingeniería de costos en 60 s" #01 — 30 s, 120 bpm.

Tono reflexivo/corporativo: pad (Am7 – Fmaj7 – C – G), bajo suave, bombo desde el gancho,
arpegio desde el CPI, hats y un "whoosh" antes de cada cambio de escena (alineados con la composición
src/remotion/costos/CostosEAC01.tsx). Solo numpy.

    python3 musica.py  # → fuentes/musica.wav
"""

import wave
from pathlib import Path

import numpy as np

SR, DUR, BEAT = 44100, 30.0, 0.5
CAMBIOS = [3.0, 8.0, 13.0, 20.0, 24.0, 27.0]  # inicio de cada escena (s)
SALIDA = Path(__file__).resolve().parent / "fuentes" / "musica.wav"


def nota(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filtro(x, lo=None, hi=None):
    """Pasa-banda suave por FFT (lo/hi en Hz)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * g, len(x))


def main():
    n = int(SR * DUR)
    tt = np.arange(n) / SR
    rng = np.random.default_rng(11)
    acordes = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]]  # Am7 Fmaj7 C G
    bajos = [45, 41, 36, 43]

    pad = np.zeros(n)
    for c in range(15):
        s, e = int(c * 2 * SR), int((c + 1) * 2 * SR)
        seg = tt[: e - s]
        env = np.minimum(1, seg / 0.4) * np.clip((2.0 - seg) / 0.4, 0.25, 1)
        for m in acordes[c % 4]:
            for det in (-0.07, 0.07):
                pad[s:e] += (2 * ((seg * nota(m + det)) % 1) - 1) * env * 0.045
    pad = filtro(pad, hi=1100)

    kick, duck = np.zeros(n), np.ones(n)
    kl = int(0.32 * SR)
    kt = np.arange(kl) / SR
    kw = np.sin(2 * np.pi * (48 * kt + (100 / 20) * (1 - np.exp(-20 * kt)))) * np.exp(-kt * 10)
    for b in np.arange(3.0, DUR - 1.0, BEAT):
        i = int(b * SR)
        kick[i:i + kl] += kw[: n - i] * 0.75
        dl = min(int(0.25 * SR), n - i)
        duck[i:i + dl] = np.minimum(duck[i:i + dl], 0.5 + 0.5 * np.linspace(0, 1, dl) ** 0.7)

    bajo = np.zeros(n)
    for b in np.arange(3.0, DUR - 1.0, BEAT):
        c = int(b // 2) % 4
        i, ln = int(b * SR), int(0.4 * SR)
        st = np.arange(min(ln, n - i)) / SR
        f = nota(bajos[c])
        bajo[i:i + len(st)] += (np.sin(2 * np.pi * f * st) + 0.25 * np.sin(4 * np.pi * f * st)) * np.exp(-st * 5) * 0.3

    ruido = filtro(rng.standard_normal(n), lo=7000)
    hats = np.zeros(n)
    for b in np.arange(8.25, DUR - 1.0, BEAT):
        i, ln = int(b * SR), int(0.05 * SR)
        hats[i:i + ln] += ruido[i:i + ln] * np.exp(-np.arange(ln) / SR * 70) * 0.5

    arp = np.zeros(n)
    patron = [0, 2, 1, 3, 2, 1, 3, 0]
    for k, b in enumerate(np.arange(8.0, DUR - 1.5, BEAT / 2)):
        c = int(b // 2) % 4
        i, ln = int(b * SR), int(0.35 * SR)
        st = np.arange(min(ln, n - i)) / SR
        f = nota(acordes[c][patron[k % 8]] + 12)
        arp[i:i + len(st)] += (np.sin(2 * np.pi * f * st) + 0.3 * np.sin(6 * np.pi * f * st)) * np.exp(-st * 11) * 0.07

    fx = np.zeros(n)
    sw = filtro(rng.standard_normal(n), lo=800, hi=6000)
    for tc in CAMBIOS:
        ln = int(0.8 * SR)
        i = int((tc - 0.7) * SR)
        fx[i:i + ln] += sw[i:i + ln] * np.sin(np.linspace(0, np.pi, ln)) ** 2 * 0.18

    mezcla = pad * duck + kick + bajo * duck + hats + arp * duck + fx
    mezcla *= np.minimum(1, tt / 1.0) * np.clip((DUR - tt) / 1.5, 0, 1)
    d = int(0.015 * SR)
    der = np.concatenate([np.zeros(d), mezcla[:-d]]) * 0.5 + mezcla * 0.5 + arp * duck * 0.4
    est = np.tanh(np.stack([mezcla, der], 1) * 1.2)
    est /= np.abs(est).max() / 0.89
    SALIDA.parent.mkdir(exist_ok=True)
    with wave.open(str(SALIDA), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    print("Listo:", SALIDA)


if __name__ == "__main__":
    main()
