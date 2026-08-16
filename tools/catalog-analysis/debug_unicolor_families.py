import colorsys
import json
from collections import defaultdict
from pathlib import Path

payload = json.loads(
    Path(r"E:\art carreaux ciment\ART\src\Services\Catalog\MTArt.Catalog.Infrastructure\SeedData\unicolor-import.json").read_text(
        encoding="utf-8"
    )
)
groups = defaultdict(list)
for color in payload["colors"]:
    r, g, b = (int(part) for part in color["rgb"].split(","))
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    groups[color["family"]].append(f"{color['code']} {color['hex']} h={h*360:.0f} s={s:.2f} v={v:.2f}")
for family, items in sorted(groups.items()):
    print(family, len(items))
    for item in items:
        print(" ", item)
