# Розміри картинок v2 (D4): src/assets/v2/<group>/<id>.webp → src/assets/v2/sizes.json {id: [w, h]}.
# Потрібні, щоб рамка фігури мала пропорції картинки ще до її завантаження (рот і картка лягають у частках рамки).
# Запуск після process.py: python tools/art/sizes.py
import glob, json, os

from PIL import Image

ROOT = 'src/assets/v2'
sizes = {}
for path in sorted(glob.glob(f'{ROOT}/*/*.webp')):
    with Image.open(path) as im:
        sizes[os.path.splitext(os.path.basename(path))[0]] = list(im.size)
with open(f'{ROOT}/sizes.json', 'w', encoding='utf-8') as f:
    f.write('{\n' + ',\n'.join(f'  "{k}": [{w}, {h}]' for k, (w, h) in sizes.items()) + '\n}\n')
print(len(sizes), 'sizes')
