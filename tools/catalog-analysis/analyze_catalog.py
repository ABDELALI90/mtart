"""MT ART catalog analyzer.

Reads the real MT ART PDF catalog and produces:
  - import/extracted/manifest.json  (one record per page: price, images, dominant colors)
  - import/extracted/images/        (original-quality embedded images, pXXX-iY.<ext>)
  - import/extracted/pages/         (150-dpi page renders for visual review/classification)

Usage:
  python analyze_catalog.py [path-to-pdf]

The manifest is the input for the Catalog import subsystem (AnalyzeCatalogCommand ingests
the same PDF server-side; this script exists for offline inspection and for pre-seeding
the import preview during development).
"""

from __future__ import annotations

import io
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PDF = REPO_ROOT / "import" / "catalogs" / "catalog_with_price.pdf"
OUT_DIR = REPO_ROOT / "import" / "extracted"

PRICE_RE = re.compile(r"price\s*:?\s*(\d+(?:[.,]\d+)?)\s*dh\s*/?\s*m", re.IGNORECASE)


def dominant_colors(img: Image.Image, count: int = 4) -> list[str]:
    """Return the most frequent colors of a heavily downscaled copy, as hex strings."""
    small = img.convert("RGB").resize((48, 48))
    quantized = small.quantize(colors=8, method=Image.Quantize.MEDIANCUT).convert("RGB")
    pixels = Counter(quantized.getdata())
    return ["#%02x%02x%02x" % c for c, _ in pixels.most_common(count)]


def analyze(pdf_path: Path) -> None:
    images_dir = OUT_DIR / "images"
    pages_dir = OUT_DIR / "pages"
    images_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf_path)
    pages: list[dict] = []

    for index in range(doc.page_count):
        page = doc[index]
        page_no = index + 1
        text = page.get_text().strip()

        price_match = PRICE_RE.search(text)
        price = float(price_match.group(1).replace(",", ".")) if price_match else None

        page_images = []
        for img_index, info in enumerate(page.get_images(full=True), start=1):
            xref = info[0]
            extracted = doc.extract_image(xref)
            ext = extracted["ext"]
            data = extracted["image"]
            pil = Image.open(io.BytesIO(data))
            width, height = pil.size

            # Skip decorative slivers (lines, page furniture).
            if width < 120 or height < 120:
                continue

            file_name = f"p{page_no:03d}-i{img_index}.{ext}"
            (images_dir / file_name).write_bytes(data)
            page_images.append(
                {
                    "file": file_name,
                    "width": width,
                    "height": height,
                    "format": ext,
                    "aspectRatio": round(width / height, 3),
                    "dominantColors": dominant_colors(pil),
                    "sizeBytes": len(data),
                }
            )

        render = page.get_pixmap(dpi=150)
        render.save(pages_dir / f"p{page_no:03d}.png")

        pages.append(
            {
                "page": page_no,
                "importId": f"CAT-P{page_no:03d}",
                "priceDhPerM2": price,
                "text": text[:1500],
                "images": page_images,
            }
        )
        if page_no % 25 == 0:
            print(f"  processed {page_no}/{doc.page_count} pages", flush=True)

    manifest = {
        "sourceCatalog": pdf_path.name,
        "pageCount": doc.page_count,
        "pages": pages,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    with_price = sum(1 for p in pages if p["priceDhPerM2"] is not None)
    total_images = sum(len(p["images"]) for p in pages)
    prices = sorted({p["priceDhPerM2"] for p in pages if p["priceDhPerM2"] is not None})
    print(f"pages: {doc.page_count}")
    print(f"pages with price: {with_price}")
    print(f"extracted images: {total_images}")
    print(f"distinct prices (DH/m2): {prices}")


if __name__ == "__main__":
    analyze(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF)
