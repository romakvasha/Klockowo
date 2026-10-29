from PIL import Image, ImageDraw
import glob, os
fs = sorted(glob.glob('design/v2/photos/*.jpg'))
W, H = 344, 192
sheet = Image.new('RGB', (W*5, (H+18)*((len(fs)+4)//5)), 'white')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    src = Image.open(f).convert('RGB'); im = src.copy(); im.thumbnail((W, H))
    x, y = (i % 5) * W, (i // 5) * (H + 18)
    sheet.paste(im, (x, y)); d.text((x + 4, y + H + 2), os.path.basename(f) + ' ' + str(src.size), fill='black')
sheet.save('design/v2/work/contact.jpg', quality=85)
print(len(fs))
