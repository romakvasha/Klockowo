# Вирізає персонажів із фото (rembg) у design/v2/cut/<name>.png, обрізаючи прозорі краї.
import sys
from PIL import Image
from rembg import new_session, remove
session = new_session(sys.argv[1])
for spec in sys.argv[2:]:
    name, src, *box = spec.split(':')
    im = Image.open(f'design/v2/photos/{src}.jpg').convert('RGB')
    if box: im = im.crop(tuple(int(v) for v in box[0].split(',')))
    out = remove(im, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=15, alpha_matting_erode_size=8)
    out = out.crop(out.getbbox())
    out.save(f'design/v2/cut/{name}.png', optimize=True)
    print(name, out.size)
