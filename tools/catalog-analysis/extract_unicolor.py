"""Extract MT ART Collection UNICOLOR swatches from the official PDF.

Reads both pages, detects every color chip, OCRs the reference printed on the
white label, samples RGB from the chip CENTER (never the label/border), and
writes:
  import/extracted/unicolor/swatches/{code}.png
  import/extracted/unicolor/unicolor-import.json
  src/Web/mtart-web/public/images/colors/unicolor-{code}.png
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import cv2
import numpy as np
import pymupdf
from PIL import Image, ImageDraw, ImageFont, ImageOps
from rapidocr_onnxruntime import RapidOCR

REPO = Path(__file__).resolve().parents[2]
PDF_DIR = REPO / "import" / "colors"
OUT_DIR = REPO / "import" / "extracted" / "unicolor"
SWATCH_DIR = OUT_DIR / "swatches"
WEB_DIR = REPO / "src" / "Web" / "mtart-web" / "public" / "images" / "colors"
SEED_JSON = REPO / "src" / "Services" / "Catalog" / "MTArt.Catalog.Infrastructure" / "SeedData" / "unicolor-import.json"
RENDER_DPI = 600
FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\arialbd.ttf"),
    Path(r"C:\Windows\Fonts\arial.ttf"),
    Path(r"C:\Windows\Fonts\calibrib.ttf"),
    Path(r"C:\Windows\Fonts\calibri.ttf"),
]


def find_pdf() -> Path:
    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        raise FileNotFoundError(f"No UNICOLOR PDF in {PDF_DIR}")
    return pdfs[0]


def render_pages(pdf_path: Path) -> list[np.ndarray]:
    doc = pymupdf.open(pdf_path)
    pages = []
    for index, page in enumerate(doc):
        pix = page.get_pixmap(dpi=RENDER_DPI, alpha=False)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        pages.append(img)
        print(f"rendered page {index + 1}: {img.shape[1]}x{img.shape[0]} @ {RENDER_DPI} DPI")
    return pages


def near_white(img: np.ndarray, thresh: int = 230) -> np.ndarray:
    return (img[:, :, 0] > thresh) & (img[:, :, 1] > thresh) & (img[:, :, 2] > thresh)


def band_runs(mask_1d: np.ndarray, min_len: int) -> list[tuple[int, int]]:
    runs = []
    start = None
    for i, on in enumerate(mask_1d):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= min_len:
                runs.append((start, i))
            start = None
    if start is not None and len(mask_1d) - start >= min_len:
        runs.append((start, len(mask_1d)))
    return runs


def find_labels(img: np.ndarray) -> list[tuple[int, int, int, int]]:
    """White reference-number plates sit in the top-left of each chip, isolated by color."""
    h, w = img.shape[:2]
    footer = int(h * 0.90)
    white = near_white(img[:footer], thresh=228).astype(np.uint8) * 255
    contours, _ = cv2.findContours(white, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    labels = []
    for contour in contours:
        x, y, bw, bh = cv2.boundingRect(contour)
        area = bw * bh
        if bh < 20 or bw < 40:
            continue
        if area < 1500 or area > 14000:
            continue
        ratio = bw / max(bh, 1)
        if ratio < 1.4 or ratio > 3.8:
            continue
        fill = cv2.contourArea(contour) / max(area, 1)
        if fill < 0.70:
            continue
        labels.append((x, y, x + bw, y + bh))
    return labels


def cluster_axis(values: list[int], gap: float) -> list[list[int]]:
    if not values:
        return []
    order = sorted(range(len(values)), key=lambda i: values[i])
    groups: list[list[int]] = [[order[0]]]
    for index in order[1:]:
        if values[index] - values[groups[-1][-1]] <= gap:
            groups[-1].append(index)
        else:
            groups.append([index])
    return groups


def content_mask(img: np.ndarray) -> np.ndarray:
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    white = (r > 230) & (g > 230) & (b > 230)
    red_title = (r > 140) & (g < 90) & (b < 90)
    mask = (~white) & (~red_title)
    opened = cv2.morphologyEx(mask.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    return opened > 0


def dense_row_runs(mask: np.ndarray, min_density: float = 0.25, min_len: int | None = None) -> list[tuple[int, int]]:
    density = mask.mean(axis=1)
    if min_len is None:
        min_len = max(40, mask.shape[0] // 60)
    return band_runs(density > min_density, min_len=min_len)


def detect_cells(img: np.ndarray) -> list[dict]:
    """Infer a regular chip grid from the colored band (swatches share edges, no gutters)."""
    h, w = img.shape[:2]
    footer = int(h * 0.90)
    work = img[:footer]
    mask = content_mask(work)
    runs = dense_row_runs(mask)
    if not runs:
        return []
    # Page 1 is one continuous grid. Page 2 has a top strip then a large white/title gap.
    y0, y1 = runs[0]
    gap = max(80, int(h * 0.034))
    if len(runs) == 1 or (runs[1][0] - runs[0][1] > gap):
        y0, y1 = runs[0]
    else:
        y0, y1 = runs[0][0], runs[-1][1]

    xs = np.where(mask[y0:y1].any(axis=0))[0]
    if len(xs) == 0:
        return []
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    bw, bh = x1 - x0, y1 - y0
    if bw < 50 or bh < 40:
        return []

    best = None
    for cols in range(7, 11):
        cell = bw / cols
        rows = max(1, int(round(bh / cell)))
        err = abs(bh / rows - cell) + abs(rows * cell - bh) * 0.01
        cand = (err, cols, rows, cell)
        if best is None or cand < best:
            best = cand
    _, n_cols, n_rows, _ = best
    cell_w = bw / n_cols
    cell_h = bh / n_rows
    print(f"  grid {n_cols}x{n_rows} cell={cell_w:.1f}x{cell_h:.1f} band={bw}x{bh}")

    cells = []
    inset = max(3, int(min(cell_w, cell_h) * 0.01))
    for row in range(n_rows):
        for col in range(n_cols):
            cx0 = int(round(x0 + col * cell_w)) + inset
            cy0 = int(round(y0 + row * cell_h)) + inset
            cx1 = int(round(x0 + (col + 1) * cell_w)) - inset
            cy1 = int(round(y0 + (row + 1) * cell_h)) - inset
            # Label is consistently the top-left plate of the chip.
            lw = max(20, int((cx1 - cx0) * 0.42))
            lh = max(14, int((cy1 - cy0) * 0.22))
            label = (cx0, cy0, min(cx1, cx0 + lw), min(cy1, cy0 + lh))
            cells.append({"box": (cx0, cy0, cx1, cy1), "label": label})
    return cells


def find_label_bbox(cell: np.ndarray) -> tuple[int, int, int, int] | None:
    h, w = cell.shape[:2]
    roi = cell[: max(8, int(h * 0.42)), : max(8, int(w * 0.55))]
    white = near_white(roi).astype(np.uint8) * 255
    white = cv2.morphologyEx(white, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=2)
    contours, _ = cv2.findContours(white, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    best_area = 0
    roi_area = roi.shape[0] * roi.shape[1]
    for contour in contours:
        x, y, bw, bh = cv2.boundingRect(contour)
        area = bw * bh
        if area < 80 or area > roi_area * 0.85:
            continue
        if bw < 12 or bh < 8:
            continue
        if bw / max(bh, 1) < 1.1:
            continue
        if x > roi.shape[1] * 0.35 or y > roi.shape[0] * 0.45:
            continue
        if area > best_area:
            best_area = area
            best = (x, y, x + bw, y + bh)
    return best


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def digit_templates() -> dict[str, np.ndarray]:
    templates: dict[str, np.ndarray] = {}
    fonts = []
    for path in FONT_CANDIDATES:
        if path.exists():
            for size in (36, 44, 52, 64):
                fonts.append(ImageFont.truetype(str(path), size=size))
    if not fonts:
        fonts = [ImageFont.load_default()]
    for digit in "0123456789":
        variants = []
        for font in fonts:
            canvas = Image.new("L", (48, 80), 255)
            draw = ImageDraw.Draw(canvas)
            draw.text((6, 6), digit, fill=0, font=font)
            arr = np.array(canvas) < 160
            ys, xs = np.where(arr)
            if len(xs) == 0:
                continue
            crop = arr[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
            variants.append(cv2.resize(crop.astype(np.uint8), (16, 24), interpolation=cv2.INTER_NEAREST))
        templates[digit] = variants or [np.zeros((24, 16), dtype=np.uint8)]
    return templates


TEMPLATES = digit_templates()
ENGINE = RapidOCR()


def score_digit(blob: np.ndarray) -> tuple[str, float]:
    blob = cv2.resize(blob.astype(np.uint8), (16, 24), interpolation=cv2.INTER_NEAREST)
    best_d, best_s = "?", -1.0
    for digit, variants in TEMPLATES.items():
        for tmpl in variants:
            overlap = np.logical_and(blob > 0, tmpl > 0).sum()
            union = np.logical_or(blob > 0, tmpl > 0).sum()
            score = overlap / union if union else 0.0
            if score > best_s:
                best_s = score
                best_d = digit
    return best_d, best_s


def split_digit_blobs(binary: np.ndarray) -> list[np.ndarray]:
    """Split a 3-digit label by vertical gaps, then connected components as fallback."""
    h, w = binary.shape
    col = (binary > 0).mean(axis=0)
    ink = np.where(col > 0.08)[0]
    if len(ink) < 4:
        return []
    # Find gaps in the ink span.
    span = binary[:, ink[0] : ink[-1] + 1]
    col2 = (span > 0).mean(axis=0)
    gap = col2 < 0.08
    segments = []
    start = None
    for i, filled in enumerate(~gap):
        if filled and start is None:
            start = i
        elif not filled and start is not None:
            if i - start >= 3:
                segments.append((start, i))
            start = None
    if start is not None and span.shape[1] - start >= 3:
        segments.append((start, span.shape[1]))

    blobs = []
    for a, b in segments:
        piece = span[:, a:b]
        ys, xs = np.where(piece > 0)
        if len(xs) == 0:
            continue
        crop = piece[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        if crop.shape[0] < h * 0.28:
            continue
        blobs.append(crop > 0)
    if 2 <= len(blobs) <= 4:
        return blobs

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    comps = []
    for i in range(1, num_labels):
        x, y, bw, bh, area = stats[i]
        if area < 8 or bh < h * 0.28:
            continue
        comps.append((x, binary[y : y + bh, x : x + bw] > 0))
    comps.sort(key=lambda item: item[0])
    return [blob for _, blob in comps]


def ocr_label(cell: np.ndarray, label: tuple[int, int, int, int]) -> str:
    x0, y0, x1, y1 = label
    # Extra padding so RapidOCR sees the full plate.
    h, w = cell.shape[:2]
    pad = max(6, int(min(h, w) * 0.012))
    crop = cell[max(0, y0 - pad) : min(h, y1 + pad), max(0, x0 - pad) : min(w, x1 + pad)]
    if crop.size == 0:
        return ""
    result, _ = ENGINE(crop)
    texts = []
    if result:
        for item in result:
            texts.append(str(item[1]))
    digits = re.sub(r"\D", "", "".join(texts))
    if 3 <= len(digits) <= 4:
        return digits
    # Fallback: template matching on binarized digits.
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY) if crop.ndim == 3 else crop
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))
    blobs = split_digit_blobs(binary)
    if not blobs:
        return digits
    guessed = []
    for blob in blobs:
        digit, score = score_digit(blob)
        guessed.append(digit if score >= 0.22 else "")
    fallback = "".join(ch for ch in guessed if ch.isdigit())
    return fallback or digits


def sample_center_rgb(cell: np.ndarray, label: tuple[int, int, int, int] | None) -> tuple[int, int, int]:
    h, w = cell.shape[:2]
    cx0, cy0 = int(w * 0.35), int(h * 0.35)
    cx1, cy1 = int(w * 0.80), int(h * 0.80)
    mask = np.ones((h, w), dtype=bool)
    # Ignore borders and the white reference label.
    border = max(3, min(h, w) // 18)
    mask[:border, :] = False
    mask[-border:, :] = False
    mask[:, :border] = False
    mask[:, -border:] = False
    if label is not None:
        lx0, ly0, lx1, ly1 = label
        mask[max(0, ly0 - 2) : min(h, ly1 + 4), max(0, lx0 - 2) : min(w, lx1 + 4)] = False
    mask[:cy0, :] = False
    mask[cy1:, :] = False
    mask[:, :cx0] = False
    mask[:, cx1:] = False
    pixels = cell[mask]
    if len(pixels) < 20:
        # Fallback: a small window just below-right of center.
        y, x = h // 2, w // 2
        window = cell[y : y + max(8, h // 8), x : x + max(8, w // 8)]
        pixels = window.reshape(-1, 3)
    median = np.median(pixels.astype(np.float32), axis=0)
    return int(median[0]), int(median[1]), int(median[2])


def rgb_to_hsv(r: int, g: int, b: int) -> tuple[float, float, float]:
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(rf, gf, bf), min(rf, gf, bf)
    v = mx
    d = mx - mn
    s = 0.0 if mx == 0 else d / mx
    if d == 0:
        h = 0.0
    elif mx == rf:
        h = (60 * ((gf - bf) / d) + 360) % 360
    elif mx == gf:
        h = (60 * ((bf - rf) / d) + 120) % 360
    else:
        h = (60 * ((rf - gf) / d) + 240) % 360
    return h, s, v


def family_from_rgb(r: int, g: int, b: int) -> str:
    h, s, v = rgb_to_hsv(r, g, b)
    if v < 0.26:
        return "Black"
    if 28 <= h <= 55 and v >= 0.88 and 0.08 <= s < 0.22:
        return "Cream"
    if 150 <= h <= 200 and s >= 0.10 and v >= 0.45:
        return "Turquoise"
    if s < 0.14:
        if v >= 0.94:
            return "White"
        if v >= 0.88 and 28 <= h <= 70:
            return "Cream"
        if v >= 0.36:
            return "Grey"
        return "Black"
    if s < 0.20 and 0.36 <= v < 0.86:
        if 22 <= h <= 48 and s >= 0.13 and v >= 0.72:
            return "Beige"
        if 270 <= h <= 330:
            return "Purple"
        return "Grey"
    if 15 <= h <= 50 and v < 0.52 and s >= 0.25:
        return "Brown"
    if 18 <= h <= 48 and 0.55 <= v < 0.84 and s < 0.42:
        return "Beige"
    if h < 10 or h >= 348:
        if v < 0.40 and s < 0.35:
            return "Purple" if 300 <= h or h < 20 else "Brown"
        return "Pink" if v >= 0.72 and s < 0.55 else "Red"
    if h < 18:
        return "Pink" if v >= 0.70 else ("Brown" if v < 0.50 else "Orange")
    if h < 32:
        return "Orange" if v >= 0.50 else "Brown"
    if h < 42:
        return "Orange" if s >= 0.50 else "Beige"
    if h < 62:
        return "Yellow" if v >= 0.50 else "Brown"
    if h < 155:
        return "Green"
    if h < 185:
        return "Turquoise"
    if h < 255:
        return "Blue"
    if h < 320:
        return "Purple"
    return "Pink"


def extract_cell(img: np.ndarray, box: tuple[int, int, int, int], label_abs: tuple[int, int, int, int] | None) -> dict | None:
    x0, y0, x1, y1 = box
    cell = img[y0:y1, x0:x1]
    if cell.size == 0 or cell.shape[0] < 20 or cell.shape[1] < 20:
        return None
    if near_white(cell, thresh=245).mean() > 0.92:
        return None
    if label_abs is not None:
        label = (label_abs[0] - x0, label_abs[1] - y0, label_abs[2] - x0, label_abs[3] - y0)
    else:
        label = find_label_bbox(cell)
    code = ocr_label(cell, label) if label else ""
    r, g, b = sample_center_rgb(cell, label)
    return {
        "code": code,
        "box": [int(x0), int(y0), int(x1), int(y1)],
        "rgb": [r, g, b],
        "hex": f"#{r:02X}{g:02X}{b:02X}",
        "family": family_from_rgb(r, g, b),
        "cell": cell,
        "label": label,
    }


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SWATCH_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DIR.mkdir(parents=True, exist_ok=True)

    pdf = find_pdf()
    print(f"PDF: {pdf.name}")
    pages = render_pages(pdf)

    detected: list[dict] = []
    failed: list[dict] = []
    overlay_dir = OUT_DIR / "debug"
    overlay_dir.mkdir(exist_ok=True)

    for page_index, img in enumerate(pages, start=1):
        cells = detect_cells(img)
        print(f"page {page_index}: {len(cells)} swatch cells")
        overlay = img.copy()
        for entry in cells:
            box = entry["box"]
            item = extract_cell(img, box, entry.get("label"))
            if item is None:
                continue
            item["page"] = page_index
            code = item["code"]
            ok = code.isdigit() and 3 <= len(code) <= 4
            color = (0, 180, 0) if ok else (220, 30, 30)
            x0, y0, x1, y1 = item["box"]
            cv2.rectangle(overlay, (x0, y0), (x1, y1), color, 2)
            cv2.putText(overlay, code or "?", (x0 + 4, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            if ok:
                detected.append(item)
            else:
                failed.append({"page": page_index, "box": item["box"], "read": code, "hex": item["hex"]})
                if item.get("label"):
                    lx0, ly0, lx1, ly1 = item["label"]
                    crop = item["cell"][max(0, ly0) : ly1, max(0, lx0) : lx1]
                    if crop.size:
                        Image.fromarray(crop).save(overlay_dir / f"fail-p{page_index}-{x0}-{y0}.png")
        Image.fromarray(overlay).save(overlay_dir / f"overlay-page-{page_index}.png")

    # Deduplicate by code (keep first / higher-quality later page overwrite if same).
    by_code: dict[str, dict] = {}
    duplicates = 0
    for item in detected:
        code = item["code"]
        if code in by_code:
            duplicates += 1
            continue
        by_code[code] = item

    colors = []
    for code, item in sorted(by_code.items(), key=lambda kv: int(kv[0])):
        filename = f"unicolor-{code}.png"
        swatch = Image.fromarray(item["cell"])
        swatch.save(SWATCH_DIR / f"{code}.png", format="PNG", compress_level=3)
        swatch.save(WEB_DIR / filename, format="PNG", compress_level=3)
        swatch.save(WEB_DIR / f"unicolor-{code}.webp", format="WEBP", quality=92, method=6)
        r, g, b = item["rgb"]
        colors.append(
            {
                "code": code,
                "name": code,
                "rgb": f"{r},{g},{b}",
                "hex": item["hex"],
                "family": item["family"],
                "imageUrl": f"/images/colors/{filename}",
                "source": "UNICOLOR",
                "page": item["page"],
                "materialType": "CementTile",
            }
        )

    payload = {
        "sourceCatalog": "Collection UNICOLOR.pdf",
        "source": "UNICOLOR",
        "pageCount": len(pages),
        "detected": len(detected) + len(failed),
        "imported": len(colors),
        "duplicatesInPdf": duplicates,
        "failed": failed,
        "colors": colors,
    }
    OUT_DIR.joinpath("unicolor-import.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    SEED_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print("--- UNICOLOR extract ---")
    print("total swatches detected:", len(detected) + len(failed))
    print("ocr ok / unique codes:", len(colors))
    print("duplicate detections skipped:", duplicates)
    print("failed references:", [f.get("read") or f["box"] for f in failed])
    print("codes:", [c["code"] for c in colors])
    print("wrote", SEED_JSON)
    return 0 if colors and not failed else 1


if __name__ == "__main__":
    sys.exit(main())
