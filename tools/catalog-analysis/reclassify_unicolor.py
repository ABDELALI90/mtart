import json
from pathlib import Path

from extract_unicolor import family_from_rgb

paths = [
    Path(r"E:\art carreaux ciment\ART\src\Services\Catalog\MTArt.Catalog.Infrastructure\SeedData\unicolor-import.json"),
    Path(r"E:\art carreaux ciment\ART\import\extracted\unicolor\unicolor-import.json"),
]
for path in paths:
    payload = json.loads(path.read_text(encoding="utf-8"))
    for color in payload["colors"]:
        r, g, b = (int(part) for part in color["rgb"].split(","))
        color["family"] = family_from_rgb(r, g, b)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("updated", path)
