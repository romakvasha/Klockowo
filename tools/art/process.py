# Сирі картинки design/v2/gen/<id>.(webp|jpg|png) → src/assets/v2/<group>/<id>.webp (D2a, docs/DESIGN_V2.md §5).
#   фони (cut: false) — 1920×1080 «cover» по центру;
#   решта — вирізання фону rembg (isnet-general-use, alpha matting), суцільне нутро, без дрібних плям, обрізка країв,
#   персонажі й споруди ≤ 768 px заввишки (≤ 1024 завширшки), предмети, цифри й руки ≤ 512 px.
# Перелік і групи — з tools/art/assets.mjs. Запуск: python tools/art/process.py [id ...]   (без id — усі, що є в gen/)
import json, os, subprocess, sys, time
from multiprocessing import Pool

import numpy as np
from PIL import Image
from scipy import ndimage

GEN, OUT = 'design/v2/gen', 'src/assets/v2'
SMALL = {'items', 'digits', 'hands'}
WORK = {'small': 1024, 'big': 1280}  # rembg і matting — на зменшеній копії: швидше й уміщається в пам'ять, а для ≤ 768 px якості досить
PAD = 6
# Кадри рота — правки kubik-idle того самого розміру: маска й рамка обрізки беруться з idle, щоб кадри лягали піксель у піксель.
FRAMES = {f'kubik-talking-{m}': 'kubik-idle' for m in 'aeo'}

_session = None


def manifest():
    js = "import('./tools/art/assets.mjs').then(m => console.log(JSON.stringify(m.ASSETS.map(a => ({ id: a.id, group: a.group, cut: a.cut })))))"
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], text=True))


def source(id_):
    for ext in ('webp', 'png', 'jpg', 'jpeg'):
        p = f'{GEN}/{id_}.{ext}'
        if os.path.exists(p): return p
    return None


def fit(im, w, h):
    s = min(1, w / im.width, h / im.height)
    return im if s == 1 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def clean_alpha(rgba):
    """Прозорий шум → 0; плями, менші за 0,1 % найбільшої частини (і за 64 px), — геть (кинуті цеглинки лишаються)."""
    a = np.array(rgba.getchannel('A'))
    a[a < 8] = 0
    lab, n = ndimage.label(a > 32)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = sizes >= max(64, sizes.max() * 0.001)
        grown = ndimage.binary_dilation(keep[lab], iterations=3)  # м'які краї біля збережених частин
        a[~grown] = 0
    rgba.putalpha(Image.fromarray(a))
    return rgba


def fill_inside(rgba, src):
    """Усередині фігури rembg іноді робить напівпрозорим те, що схоже на тло (сіра ніжка грибка на білому):
    там, де колір помітно відрізняється від однотонного тла, непрозорість стає повною, а колір — з оригіналу. Краї не чіпаються."""
    s = np.asarray(src, np.float32)
    ring = np.concatenate([s[:8].reshape(-1, 3), s[-8:].reshape(-1, 3), s[:, :8].reshape(-1, 3), s[:, -8:].reshape(-1, 3)])
    dist = np.linalg.norm(s - np.median(ring, 0), axis=2)
    solid = np.clip((dist - 12) / 28, 0, 1) * 255
    px = np.array(rgba)
    inside = ndimage.binary_erosion(px[..., 3] > 16, iterations=4) & (solid > px[..., 3])
    px[inside, 3] = solid[inside]
    px[inside, :3] = s[inside]
    return Image.fromarray(px)


def init():
    global _session
    from rembg import new_session
    _session = new_session('isnet-general-use')


def cut(im):
    from rembg import remove
    try:
        out = remove(im, session=_session, alpha_matting=True, alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15, alpha_matting_erode_size=8)
    except MemoryError:
        out = remove(im, session=_session)  # без matting — краї трохи грубші
    return clean_alpha(fill_inside(out.convert('RGBA'), im))


def work(a):
    t = time.time()
    src = source(a['id'])
    if not src: return a['id'], 'missing', 0
    im = Image.open(src).convert('RGB')
    dst = f"{OUT}/{a['group']}/{a['id']}.webp"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not a['cut']:
        cover(im, 1920, 1080).save(dst, 'WEBP', quality=80, method=6)
    else:
        small = a['group'] in SMALL
        im = fit(im, *[WORK['small' if small else 'big']] * 2)
        if a['id'] in FRAMES:
            ref = fit(Image.open(source(FRAMES[a['id']])).convert('RGB'), *[WORK['big']] * 2)
            assert ref.size == im.size, f"{a['id']}: розмір не як у {FRAMES[a['id']]}"
            mask = cut(ref).getchannel('A')
            out = im.convert('RGBA')
            out.putalpha(mask)
        else:
            out = cut(im)
            mask = out.getchannel('A')
        l, t2, r, b = mask.point(lambda v: 255 if v > 8 else 0).getbbox()
        out = out.crop((max(0, l - PAD), max(0, t2 - PAD), min(out.width, r + PAD), min(out.height, b + PAD)))
        out = fit(out, 512, 512) if small else fit(out, 1024, 768)
        out.save(dst, 'WEBP', quality=85, method=6)
    w, h = Image.open(dst).size
    return a['id'], f'{w}x{h} {os.path.getsize(dst) // 1024} KB', round(time.time() - t, 1)


if __name__ == '__main__':
    only = set(sys.argv[1:])
    todo = [a for a in manifest() if (not only or a['id'] in only) and source(a['id'])]
    print(len(todo), 'images', flush=True)
    with Pool(3, initializer=init) as pool:
        for id_, info, sec in pool.imap_unordered(work, todo):
            print(f'{id_:24} {info:20} {sec}s', flush=True)
