"""
Run once to generate the JARVIS PWA icons.
Requires: pip install Pillow
"""
import math
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow first: pip install Pillow")
    raise

os.makedirs("assets", exist_ok=True)

def make_icon(size):
    img = Image.new("RGBA", (size, size), (6, 10, 18, 255))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    r = int(size * 0.38)

    # Outer ring arcs
    arc_color = (26, 143, 255, 255)
    lw = max(2, size // 64)
    bbox = [cx - r, cy - r, cx + r, cy + r]
    for start, end in [(5, 234), (259, 462), (497, 704)]:
        draw.arc(bbox, start, end, fill=arc_color, width=lw)

    # Inner ring
    r2 = int(r * 0.78)
    bbox2 = [cx - r2, cy - r2, cx + r2, cy + r2]
    draw.arc(bbox2, 0, 360, fill=(0, 200, 255, 140), width=max(1, lw // 2))

    # Center fill
    r3 = int(r * 0.65)
    draw.ellipse([cx - r3, cy - r3, cx + r3, cy + r3], fill=(5, 18, 40, 240))

    # JARVIS text
    font_size = max(8, int(size * 0.14))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "JARVIS"
    bbox_t = draw.textbbox((0, 0), text, font=font)
    tw = bbox_t[2] - bbox_t[0]
    th = bbox_t[3] - bbox_t[1]
    draw.text((cx - tw // 2, cy - th // 2), text, fill=(255, 255, 255, 255), font=font)

    return img

for sz in [192, 512]:
    icon = make_icon(sz)
    path = f"assets/icon-{sz}.png"
    icon.save(path)
    print(f"Saved {path}")

print("Icons generated.")
