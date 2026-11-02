import sys
from PIL import Image
names = sys.argv[1:]
ims = [Image.open(f'design/v2/cut/{n}.png') for n in names]
h = 400
row = [im.resize((int(im.width * h / im.height), h)) for im in ims]
sheet = Image.new('RGB', (sum(i.width for i in row) + 20 * len(row), h + 20), (255, 0, 160))
x = 10
for im in row:
    sheet.paste(im, (x, 10), im); x += im.width + 20
sheet.save('design/v2/work/check.jpg', quality=88)
