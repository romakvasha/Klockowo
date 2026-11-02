# Кадри рота Kubika (D4): з kubik-talking-a|e|o вирізаємо «мордочку» (овал з м'яким краєм) і кладемо її на кожну позу,
# де Kubik говорить у спокої: kubik-idle і kubik-w1…w7-idle (з аксесуаром світу — інша рамка й масштаб).
# Місце й масштаб мордочки на позі світу — пошуком збігу (skimage match_template) мордочки idle; колір — зсувом середнього
# по кільцю навколо овалу. Вихід: src/assets/v2/kubik/mouth/<base>-<a|e|o>.webp + src/characters/mouthFit.json
# ({base: {x, y, w, h}} — частки ширини/висоти картинки пози). Запуск: python tools/art/mouths.py
import json, os

import numpy as np
from PIL import Image
from skimage.feature import match_template

DIR = 'src/assets/v2/kubik'
OUT = f'{DIR}/mouth'
FIT = 'src/characters/mouthFit.json'
BASES = ['idle'] + [f'w{i}-idle' for i in range(1, 8)]
# овал мордочки в координатах kubik-idle (444×768): рот, щоки й підборіддя, без носа й очей
CX, CY, RX, RY, FEATHER = 221, 279, 84, 58, 12
# область для пошуку збігу: ніс, щоки, рот (очі й брови не беремо — в аксесуарах окуляри й шоломи)
MATCH = (120, 190, 325, 345)


def rgba(name):
    return np.asarray(Image.open(f'{DIR}/kubik-{name}.webp').convert('RGBA')).astype(np.float32)


def oval_alpha(w, h, cx, cy, rx, ry, feather):
    y, x = np.mgrid[0:h, 0:w]
    r = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)  # 1 — край овалу
    edge = feather / min(rx, ry)
    return np.clip((1 - r) / edge + 0.5, 0, 1)


def gray(a):
    return a[..., :3] @ np.float32([0.299, 0.587, 0.114])


def locate(idle, base):
    """Масштаб і зсув, з якими мордочка idle лягає на base: (s, dx, dy) — точка idle (x, y) → base (x*s+dx, y*s+dy)."""
    x0, y0, x1, y1 = MATCH
    tmpl_full = Image.fromarray(idle.astype(np.uint8))
    target = gray(base)
    best = (-1.0, 1.0, 0, 0)
    for s in np.arange(0.80, 1.121, 0.01):
        small = np.asarray(tmpl_full.resize((round(idle.shape[1] * s), round(idle.shape[0] * s)), Image.LANCZOS)).astype(np.float32)
        t = gray(small)[round(y0 * s):round(y1 * s), round(x0 * s):round(x1 * s)]
        if t.shape[0] > target.shape[0] or t.shape[1] > target.shape[1]: continue
        r = match_template(target, t)
        iy, ix = np.unravel_index(r.argmax(), r.shape)
        if r[iy, ix] > best[0]:
            best = (float(r[iy, ix]), float(s), ix - round(x0 * s), iy - round(y0 * s))
    return best


def main():
    os.makedirs(OUT, exist_ok=True)
    idle = rgba('idle')
    frames = {m: rgba(f'talking-{m}') for m in 'aeo'}
    pad = FEATHER + 2
    bx0, by0, bx1, by1 = CX - RX - pad, CY - RY - pad, CX + RX + pad, CY + RY + pad
    fit = {}
    for name in BASES:
        base = rgba(name)
        h, w = base.shape[:2]
        score, s, dx, dy = locate(idle, base) if name != 'idle' else (1.0, 1.0, 0, 0)
        # прямокутник мордочки на base
        px0, py0 = bx0 * s + dx, by0 * s + dy
        pw, ph = round((bx1 - bx0) * s), round((by1 - by0) * s)
        ix0, iy0 = round(px0), round(py0)
        alpha = oval_alpha(pw, ph, (CX - bx0) * s, (CY - by0) * s, RX * s, RY * s, FEATHER * s)
        ring = (oval_alpha(pw, ph, (CX - bx0) * s, (CY - by0) * s, RX * s * 1.25, RY * s * 1.25, 2) > 0.5) & (alpha < 0.05)
        under = base[iy0:iy0 + ph, ix0:ix0 + pw, :3]
        for m, frame in frames.items():
            crop = Image.fromarray(frame[by0:by1, bx0:bx1].astype(np.uint8)).resize((pw, ph), Image.LANCZOS)
            rgb = np.asarray(crop).astype(np.float32)[..., :3]
            if name != 'idle':  # підтягуємо колір хутра до пози світу (світло з іншої генерації трохи інше)
                ref = np.asarray(Image.fromarray(idle[by0:by1, bx0:bx1].astype(np.uint8)).resize((pw, ph), Image.LANCZOS)).astype(np.float32)[..., :3]
                rgb = rgb + (under[ring].mean(0) - ref[ring].mean(0))
            out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
            Image.fromarray(out, 'RGBA').save(f'{OUT}/{name}-{m}.webp', quality=88, method=6)
        fit[name] = {k: round(v, 5) for k, v in {'x': ix0 / w, 'y': iy0 / h, 'w': pw / w, 'h': ph / h}.items()}
        print(f'{name:8} score {score:.3f} scale {s:.2f} at {ix0},{iy0} size {pw}x{ph}')
    with open(FIT, 'w', encoding='utf-8') as f:
        json.dump(fit, f, indent=2)
        f.write('\n')


if __name__ == '__main__':
    main()
