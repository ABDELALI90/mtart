"""Offline Moroccan tile photo → clean editable SVG mould.

PHOTO → identify tile → extract repeat unit → rectify → quantize
→ segment closed color regions → clean → simplify → reconstruct
→ validate → SVG

No Canny-on-photo tracing. No SVG is better than a wrong SVG.
"""
from __future__ import annotations

import json
import math
import shutil
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

REPO = Path(__file__).resolve().parents[2]
WEB = REPO / "src" / "Web" / "mtart-web"
EXTRACTED = REPO / "import" / "extracted" / "images"
CATALOGUE = WEB / "public" / "moulds" / "catalogue.json"
OUT_SVG = WEB / "public" / "moulds" / "moroccan"
OUT_REVIEW = WEB / "public" / "moulds" / "review"
OLD_IMPORTED = WEB / "public" / "moulds" / "imported"
REJECTED_DIR = OLD_IMPORTED / "_rejected"
REVIEW_JSON = WEB / "public" / "moulds" / "vectorize-review.json"
MOULDS_JSON = WEB / "public" / "moulds" / "moulds.json"

SIZE = 512
PUBLISH_MIN = 0.80
UPLOAD_MIN = 0.58
VISUAL_REJECT = {"MOR-026"}
MIN_REGION_RATIO = 0.005
MAX_REGIONS = 8
MIN_REGIONS = 2
MAX_VERTICES = 36
STROKE = "#666666"
FILL = "#FFFFFF"


@dataclass
class RegionPath:
    key: str
    points: np.ndarray  # Nx2 in pixel coords of SIZE canvas
    area: float
    kind: str = "polygon"  # polygon | circle
    circle: tuple[float, float, float] | None = None  # cx, cy, r


@dataclass
class Result:
    reference: str
    source_image: str | None
    status: str
    confidence: float = 0.0
    iou: float = 0.0
    svg_url: str | None = None
    crop_url: str | None = None
    preview_url: str | None = None
    reason: str | None = None
    regions: list[dict] = field(default_factory=list)
    repeat_unit: str = "1x1"
    region_count: int = 0
    published: bool = False


def ensure_dirs() -> None:
    OUT_SVG.mkdir(parents=True, exist_ok=True)
    for leftover in OUT_SVG.glob("MOR-*.svg"):
        leftover.unlink()
    OUT_REVIEW.mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)


def archive_old_traces() -> int:
    moved = 0
    if not OLD_IMPORTED.exists():
        return 0
    for svg in OLD_IMPORTED.glob("MOR-*.svg"):
        dest = REJECTED_DIR / svg.name
        shutil.move(str(svg), str(dest))
        moved += 1
    return moved


def resolve_source(source_image: str | None, thumbnail: str | None) -> Path | None:
    names: list[str] = []
    for value in (source_image, thumbnail):
        if value:
            names.append(Path(value).name)
    dirs = [
        EXTRACTED,
        WEB / "public" / "images" / "import",
        WEB / "public" / "images" / "catalog",
        WEB / "public" / "images" / "catalog" / "web",
    ]
    for name in names:
        for folder in dirs:
            candidate = folder / name
            if candidate.exists():
                return candidate
    return None


def load_bgr(path: Path) -> np.ndarray:
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(path)
    return img


def square_crop(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    side = min(h, w)
    x = (w - side) // 2
    y = (h - side) // 2
    return img[y : y + side, x : x + side]


def ncc(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32).ravel()
    b = b.astype(np.float32).ravel()
    a -= a.mean()
    b -= b.mean()
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom < 1e-6:
        return 0.0
    return float(np.dot(a, b) / denom)


def detect_frame_inset(img: np.ndarray) -> int:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    corners = np.array(
        [gray[2, 2], gray[2, w - 3], gray[h - 3, 2], gray[h - 3, w - 3]],
        dtype=np.float32,
    )
    if corners.std() > 28:
        return 0
    edge = float(corners.mean())
    inset = 0
    limit = int(min(h, w) * 0.18)
    for d in range(limit):
        band = np.concatenate(
            [
                gray[d, d : w - d],
                gray[h - 1 - d, d : w - d],
                gray[d:h - d, d],
                gray[d:h - d, w - 1 - d],
            ]
        )
        if np.mean(np.abs(band.astype(np.float32) - edge)) < 22:
            inset = d + 1
        else:
            break
    return inset if inset > 6 else 0


def period_from_projection(values: np.ndarray, min_p: int, max_p: int) -> tuple[int, float]:
    x = values.astype(np.float32)
    x -= x.mean()
    ac = np.correlate(x, x, mode="full")
    ac = ac[len(ac) // 2 :]
    if ac[0] <= 1e-6:
        return 0, 0.0
    ac = ac / ac[0]
    ac[:min_p] = 0
    if max_p < len(ac):
        ac[max_p:] = 0
    peak = int(np.argmax(ac))
    score = float(ac[peak]) if peak else 0.0
    if peak < min_p or score < 0.28:
        return 0, 0.0
    return peak, score


def detect_repeat(gray: np.ndarray) -> tuple[int, str, float]:
    small = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(small, (5, 5), 0)
    best_n, best_score = 1, 0.0
    for n in (2, 3, 4, 5):
        ch = 256 // n
        ref = cv2.resize(blur[0:ch, 0:ch], (48, 48))
        scores = []
        for gy in range(n):
            for gx in range(n):
                if gx == 0 and gy == 0:
                    continue
                cell = cv2.resize(blur[gy * ch : (gy + 1) * ch, gx * ch : (gx + 1) * ch], (48, 48))
                scores.append(ncc(ref, cell))
        score = float(np.mean(scores)) if scores else 0.0
        if score > best_score:
            best_score, best_n = score, n
    h, w = gray.shape
    if best_n >= 2 and best_score >= 0.52:
        return min(h, w) // best_n, f"{best_n}x{best_n}", best_score
    min_p, max_p = 28, 128
    px, sx = period_from_projection(blur.mean(axis=0), min_p, max_p)
    py, sy = period_from_projection(blur.mean(axis=1), min_p, max_p)
    if px and py and min(sx, sy) >= 0.38:
        period = int(round((px + py) / 2 * (w / 256)))
        n = int(round(min(h, w) / max(period, 1)))
        if 2 <= n <= 5:
            return period, f"{n}x{n}", float(min(sx, sy))
    return min(h, w), "1x1", 0.45


def extract_unit(img: np.ndarray) -> tuple[np.ndarray, str, float]:
    squared = square_crop(img)
    inset = detect_frame_inset(squared)
    if inset:
        squared = squared[inset : squared.shape[0] - inset, inset : squared.shape[1] - inset]
    gray = cv2.cvtColor(squared, cv2.COLOR_BGR2GRAY)
    cell, unit, conf = detect_repeat(gray)
    h, w = squared.shape[:2]
    if unit != "1x1" and 16 < cell < min(h, w) * 0.7:
        grout = max(2, cell // 28)
        crop = squared[grout : cell - grout, grout : cell - grout]
        if crop.size == 0:
            crop = squared[:cell, :cell]
        return crop, unit, conf
    return squared, "1x1", conf


def find_tile_quad(img: np.ndarray) -> np.ndarray | None:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 40, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    h, w = gray.shape
    best = None
    best_area = 0.0
    for cnt in contours:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue
        area = cv2.contourArea(approx)
        if area < w * h * 0.35:
            continue
        if area > best_area:
            best_area = area
            best = approx.reshape(4, 2).astype(np.float32)
    if best is None:
        return None
    # Already almost the full frame → no warp needed.
    xs, ys = best[:, 0], best[:, 1]
    if xs.min() < w * 0.04 and ys.min() < h * 0.04 and xs.max() > w * 0.96 and ys.max() > h * 0.96:
        return None
    return order_quad(best)


def order_quad(pts: np.ndarray) -> np.ndarray:
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def warp_quad(img: np.ndarray, quad: np.ndarray, size: int = SIZE) -> np.ndarray:
    dest = np.array([[0, 0], [size - 1, 0], [size - 1, size - 1], [0, size - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(order_quad(np.asarray(quad, dtype=np.float32)), dest)
    return cv2.warpPerspective(img, matrix, (size, size), flags=cv2.INTER_LINEAR)


def rectify(img: np.ndarray) -> np.ndarray:
    quad = find_tile_quad(img)
    if quad is None:
        return cv2.resize(img, (SIZE, SIZE), interpolation=cv2.INTER_AREA)
    return warp_quad(img, quad)


def remove_grout_lines(img: np.ndarray) -> np.ndarray:
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=140, minLineLength=SIZE * 0.7, maxLineGap=6)
        if lines is None or len(lines) == 0:
            return img
        mask = np.zeros(gray.shape, np.uint8)
        count = 0
        for raw in lines:
            x1, y1, x2, y2 = [int(v) for v in np.ravel(raw)[:4]]
            dx, dy = abs(x2 - x1), abs(y2 - y1)
            if min(dx, dy) > 6:
                continue
            cv2.line(mask, (x1, y1), (x2, y2), 255, 2)
            count += 1
        if count < 2 or count > 12:
            return img
        return cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
    except Exception:
        return img


def choose_k(pixels: np.ndarray) -> tuple[np.ndarray, np.ndarray, int]:
    best = None
    n = pixels.shape[0]
    for k in (2, 3, 4, 5):
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.3)
        compactness, labels, centers = cv2.kmeans(
            pixels, k, None, criteria, 5, cv2.KMEANS_PP_CENTERS
        )
        labels = labels.reshape(-1)
        sizes = np.bincount(labels, minlength=k)
        if sizes.min() < n * MIN_REGION_RATIO:
            continue
        spread = float(np.mean([np.linalg.norm(centers[i] - centers[j]) for i in range(k) for j in range(i + 1, k)]))
        # Prefer fewer colors so anti-aliased photo edges do not become extra regions.
        score = compactness / n + 180.0 * (k - 2) - spread * 0.2
        if best is None or score < best[0]:
            best = (score, labels, centers, k)
    if best is None:
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.4)
        _, labels, centers = cv2.kmeans(pixels, 2, None, criteria, 4, cv2.KMEANS_PP_CENTERS)
        return labels.reshape(-1), centers, 2
    return best[1], best[2], best[3]


def quantize(img: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    smooth = cv2.bilateralFilter(img, 9, 60, 60)
    pixels = smooth.reshape(-1, 3).astype(np.float32)
    labels, centers, _ = choose_k(pixels)
    labels = labels.reshape(SIZE, SIZE)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    cleaned = np.zeros_like(labels)
    for color in np.unique(labels):
        mask = np.uint8(labels == color) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        cleaned[mask > 0] = color
    # fill leftover holes with nearest
    holes = cleaned == 0
    if holes.any() and not holes.all():
        cleaned[holes] = labels[holes]
    quantized = centers[cleaned].reshape(SIZE, SIZE, 3).astype(np.uint8)
    return cleaned, centers, quantized


def symmetry_scores(labels: np.ndarray) -> dict[str, float]:
    lab = labels.astype(np.float32)
    v = ncc(lab, np.fliplr(lab))
    h = ncc(lab, np.flipud(lab))
    r180 = ncc(lab, np.rot90(lab, 2))
    r90 = ncc(lab, np.rot90(lab, 1))
    return {"v": v, "h": h, "r180": r180, "r90": r90}


def enforce_symmetry(labels: np.ndarray, scores: dict[str, float]) -> np.ndarray:
    if scores["r90"] > 0.62 and scores["v"] > 0.6 and scores["h"] > 0.6:
        half = SIZE // 2
        quads = [
            labels[0:half, 0:half],
            np.fliplr(labels[0:half, half:]),
            np.flipud(labels[half:, 0:half]),
            np.fliplr(np.flipud(labels[half:, half:])),
        ]
        energy = []
        for q in quads:
            g = q.astype(np.float32)
            energy.append(float(cv2.Laplacian(g, cv2.CV_32F).var()))
        best = quads[int(np.argmin(energy))]
        top = np.hstack([best, np.fliplr(best)])
        return np.vstack([top, np.flipud(top)])
    if scores["r180"] > 0.72:
        rot = np.rot90(labels, 2)
        out = labels.copy()
        out[: SIZE // 2] = labels[: SIZE // 2]
        out[SIZE // 2 :] = rot[SIZE // 2 :]
        return out
    if scores["v"] > 0.78:
        left = labels[:, : SIZE // 2]
        return np.hstack([left, np.fliplr(left)])
    if scores["h"] > 0.78:
        top = labels[: SIZE // 2]
        return np.vstack([top, np.flipud(top)])
    return labels


def absorb_tiny(labels: np.ndarray) -> np.ndarray:
    out = labels.copy()
    min_area = int(SIZE * SIZE * MIN_REGION_RATIO)
    for color in np.unique(labels):
        mask = np.uint8(out == color)
        num, cc, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=4)
        for i in range(1, num):
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                continue
            x, y, w, h, _ = stats[i]
            roi = out[max(0, y - 1) : y + h + 1, max(0, x - 1) : x + w + 1]
            vals, counts = np.unique(roi[roi != color], return_counts=True)
            if len(vals):
                out[cc == i] = vals[np.argmax(counts)]
    return out


def circularity(cnt: np.ndarray) -> float:
    area = cv2.contourArea(cnt)
    peri = cv2.arcLength(cnt, True)
    if peri <= 1:
        return 0.0
    return float(4 * math.pi * area / (peri * peri))


def regular_polygon(center: tuple[float, float], radius: float, n: int, rotation: float) -> np.ndarray:
    pts = []
    for i in range(n):
        a = rotation + i * 2 * math.pi / n
        pts.append([center[0] + radius * math.cos(a), center[1] + radius * math.sin(a)])
    return np.array(pts, dtype=np.float32)


def star_polygon(center: tuple[float, float], r_out: float, r_in: float, n: int, rotation: float) -> np.ndarray:
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rotation + i * math.pi / n
        pts.append([center[0] + r * math.cos(a), center[1] + r * math.sin(a)])
    return np.array(pts, dtype=np.float32)


def reconstruct_contour(cnt: np.ndarray) -> tuple[np.ndarray, str, tuple[float, float, float] | None]:
    area = cv2.contourArea(cnt)
    peri = cv2.arcLength(cnt, True)
    circ = circularity(cnt)
    (cx, cy), radius = cv2.minEnclosingCircle(cnt)
    circle_area = math.pi * radius * radius
    if circ > 0.86 and area / max(circle_area, 1) > 0.78:
        return np.array([[cx, cy]]), "circle", (cx, cy, radius)

    epsilon = max(2.0, 0.022 * peri)
    approx = cv2.approxPolyDP(cnt, epsilon, True).reshape(-1, 2)
    while len(approx) > MAX_VERTICES:
        epsilon *= 1.4
        approx = cv2.approxPolyDP(cnt, epsilon, True).reshape(-1, 2)
        if epsilon > peri * 0.1:
            break
    if len(approx) < 3:
        approx = cv2.convexHull(cnt).reshape(-1, 2)

    if 4 <= len(approx) <= 6:
        hull = cv2.convexHull(approx).reshape(-1, 2)
        if len(hull) == 4:
            return hull.astype(np.float32), "polygon", None

    # 4-pointed star (compass) or 8-pointed star from radial peaks
    if 0.12 < circ < 0.72 and area > SIZE * SIZE * 0.02:
        pts = cnt.reshape(-1, 2).astype(np.float32)
        m = pts.mean(axis=0)
        ang = np.arctan2(pts[:, 1] - m[1], pts[:, 0] - m[0])
        dist = np.hypot(pts[:, 0] - m[0], pts[:, 1] - m[1])
        bins = 32
        idx = np.clip(((ang + math.pi) / (2 * math.pi) * bins).astype(int), 0, bins - 1)
        radial = np.zeros(bins)
        for i, d in zip(idx, dist):
            radial[i] = max(radial[i], d)
        peaks = []
        for i in range(bins):
            if radial[i] >= radial[i - 1] and radial[i] >= radial[(i + 1) % bins] and radial[i] > radial.mean() * 1.05:
                peaks.append(i)
        r_out = float(np.percentile(dist, 90))
        r_in = float(np.percentile(dist, 40))
        rot = (peaks[0] / bins) * 2 * math.pi - math.pi if peaks else -math.pi / 2
        if len(peaks) in (4, 8):
            n = 4 if len(peaks) == 4 else 8
            return star_polygon((float(m[0]), float(m[1])), r_out, max(r_in, r_out * 0.35), n, rot), "polygon", None

    return approx.astype(np.float32), "polygon", None


def is_border_junk(cnt: np.ndarray) -> bool:
    x, y, w, h = cv2.boundingRect(cnt)
    area = cv2.contourArea(cnt)
    touches = (x <= 2) + (y <= 2) + (x + w >= SIZE - 3) + (y + h >= SIZE - 3)
    thin = (h < SIZE * 0.18 and w > SIZE * 0.55) or (w < SIZE * 0.18 and h > SIZE * 0.55)
    if thin and touches:
        return True
    if touches >= 3 and area < SIZE * SIZE * 0.08:
        return True
    return False


def wraps_seamlessly(cnt: np.ndarray) -> bool:
    x, y, w, h = cv2.boundingRect(cnt)
    left = x <= 2
    right = x + w >= SIZE - 3
    top = y <= 2
    bottom = y + h >= SIZE - 3
    return (left and right) or (top and bottom)


def extract_paths(labels: np.ndarray) -> list[RegionPath]:
    colors, counts = np.unique(labels, return_counts=True)
    order = np.argsort(-counts)
    background = int(colors[order[0]])
    paths: list[RegionPath] = []
    index = 1
    min_area = SIZE * SIZE * MIN_REGION_RATIO
    for color in colors[order]:
        if int(color) == background:
            continue
        mask = np.uint8(labels == color) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        kept: list[RegionPath] = []
        for cnt in contours:
            if cv2.contourArea(cnt) < min_area:
                continue
            if is_border_junk(cnt) and not wraps_seamlessly(cnt):
                continue
            pts, kind, circle = reconstruct_contour(cnt)
            if kind == "polygon" and len(pts) < 3:
                continue
            kept.append(
                RegionPath(
                    key=f"region-{index}",
                    points=pts,
                    area=float(cv2.contourArea(cnt)),
                    kind=kind,
                    circle=circle,
                )
            )
        if not kept:
            continue
        # too many fragments of one color → noise
        if len(kept) > 18:
            continue
        paths.extend(kept)
        index += 1
        if index > MAX_REGIONS:
            break
    return paths


def rasterize(paths: list[RegionPath]) -> np.ndarray:
    canvas = np.zeros((SIZE, SIZE), np.int32)
    key_ids = {"background": 1}
    next_id = 2
    for path in paths:
        if path.key not in key_ids:
            key_ids[path.key] = next_id
            next_id += 1
        color = key_ids[path.key]
        if path.kind == "circle" and path.circle:
            cx, cy, r = path.circle
            cv2.circle(canvas, (int(cx), int(cy)), int(r), int(color), -1)
        else:
            pts = path.points.astype(np.int32).reshape(-1, 1, 2)
            cv2.fillPoly(canvas, [pts], int(color))
    return canvas


def mask_iou(a: np.ndarray, b: np.ndarray) -> float:
    # remap labels by overlap
    a_ids = [i for i in np.unique(a) if i != 0]
    b_ids = [i for i in np.unique(b) if i != 0]
    if not a_ids or not b_ids:
        return 0.0
    ious = []
    used = set()
    for aid in a_ids:
        am = a == aid
        best = 0.0
        best_b = None
        for bid in b_ids:
            if bid in used:
                continue
            bm = b == bid
            inter = np.logical_and(am, bm).sum()
            union = np.logical_or(am, bm).sum()
            val = float(inter / union) if union else 0.0
            if val > best:
                best = val
                best_b = bid
        if best_b is not None:
            used.add(best_b)
            ious.append(best)
    return float(np.mean(ious)) if ious else 0.0


def overlap_ratio(paths: list[RegionPath]) -> float:
    acc = np.zeros((SIZE, SIZE), np.uint8)
    overlap = 0
    filled = 0
    for path in paths:
        layer = np.zeros((SIZE, SIZE), np.uint8)
        if path.kind == "circle" and path.circle:
            cx, cy, r = path.circle
            cv2.circle(layer, (int(cx), int(cy)), int(r), 1, -1)
        else:
            pts = path.points.astype(np.int32).reshape(-1, 1, 2)
            cv2.fillPoly(layer, [pts], 1)
        overlap += int(np.logical_and(acc > 0, layer > 0).sum())
        acc = np.maximum(acc, layer)
        filled += int(layer.sum())
    if filled == 0:
        return 1.0
    return overlap / filled


def fragment_ratio(paths: list[RegionPath]) -> float:
    if not paths:
        return 1.0
    tiny = sum(1 for p in paths if p.area < SIZE * SIZE * 0.012)
    return tiny / len(paths)


def preview_symmetry(preview: np.ndarray) -> float:
    gray = cv2.cvtColor(preview, cv2.COLOR_BGR2GRAY).astype(np.float32)
    return max(
        ncc(gray, np.rot90(gray, 1)),
        ncc(gray, np.fliplr(gray)),
        ncc(gray, np.flipud(gray)),
        ncc(gray, np.rot90(gray, 2)),
    )


def is_radial_rosette(paths: list[RegionPath]) -> bool:
    if len(paths) < 6:
        return False
    center = np.array([SIZE / 2, SIZE / 2], dtype=np.float32)
    radii = []
    for path in paths:
        c = np.array(path.circle[:2], dtype=np.float32) if path.circle else path.points.mean(axis=0)
        radii.append(float(np.linalg.norm(c - center)))
    r = np.array(radii)
    return float(r.std() / (r.mean() + 1e-3)) < 0.38


def geometry_ok(
    paths: list[RegionPath],
    preview: np.ndarray,
    *,
    skip_grid_gate: bool = False,
    skip_asymmetric: bool = False,
    overlap_limit: float = 0.12,
) -> str | None:
    if len(paths) > 16:
        return "too-many-shapes"
    overlap = overlap_ratio(paths)
    if overlap > overlap_limit:
        return "overlapping-regions"
    if len(paths) >= 6 and overlap > 0.04 and not is_radial_rosette(paths):
        return "scattered-tiles"
    if mean_vertices(paths) > 24:
        return "paths-too-noisy"
    if not skip_asymmetric and preview_symmetry(preview) < 0.55:
        return "asymmetric-geometry"
    if not skip_grid_gate and len(paths) == 4:
        centers = []
        for path in paths:
            c = np.array(path.circle[:2]) if path.circle else path.points.mean(axis=0)
            centers.append(c)
        xs = [c[0] < SIZE / 2 for c in centers]
        ys = [c[1] < SIZE / 2 for c in centers]
        if sum(xs) == 2 and sum(ys) == 2:
            return "unextracted-grid"
    return None


def mean_vertices(paths: list[RegionPath]) -> float:
    polys = [p for p in paths if p.kind == "polygon"]
    if not polys:
        return 0.0
    return float(np.mean([len(p.points) for p in polys]))


def confidence_of(
    paths: list[RegionPath],
    iou: float,
    scores: dict[str, float],
    repeat_conf: float,
    unit: str,
    min_confidence: float = PUBLISH_MIN,
) -> tuple[float, str | None]:
    n = len({p.key for p in paths})
    if n < 1:
        return 0.0, "no-closed-regions"
    if fragment_ratio(paths) > 0.35:
        return 0.25, "too-many-fragments"
    verts = mean_vertices(paths)
    if verts > 32:
        return 0.3, "paths-too-noisy"
    if iou < 0.38:
        return min(0.45, iou), "low-source-similarity"

    region_q = 1.0 - abs((n + 1) - 4) / 8
    region_q = max(0.2, min(1.0, region_q))
    frag_q = 1.0 - fragment_ratio(paths)
    vert_q = max(0.0, 1.0 - max(0.0, verts - 12) / 28)
    sym_q = max(scores["v"], scores["h"], scores["r180"], scores["r90"] * 0.95)
    repeat_q = 0.9 if unit == "1x1" else min(1.0, repeat_conf + 0.2)

    conf = (
        0.22 * iou
        + 0.16 * region_q
        + 0.20 * frag_q
        + 0.22 * vert_q
        + 0.14 * max(0.0, sym_q)
        + 0.06 * repeat_q
    )
    conf = float(max(0.0, min(0.99, conf)))
    if conf < min_confidence:
        return conf, "below-publish-threshold"
    return conf, None


def svg_markup(paths: list[RegionPath]) -> str:
    scale = 200 / SIZE
    parts = [
        f'<rect data-region="background" data-region-id="background" x="0" y="0" width="200" height="200" fill="{FILL}" stroke="{STROKE}" stroke-width="1.5" vector-effect="non-scaling-stroke" />'
    ]
    for path in paths:
        if path.kind == "circle" and path.circle:
            cx, cy, r = path.circle
            parts.append(
                f'<circle data-region="{path.key}" data-region-id="{path.key}" cx="{cx * scale:.2f}" cy="{cy * scale:.2f}" r="{r * scale:.2f}" fill="{FILL}" stroke="{STROKE}" stroke-width="1.5" vector-effect="non-scaling-stroke" />'
            )
            continue
        cmds = " ".join(
            f"{'M' if i == 0 else 'L'}{x * scale:.2f} {y * scale:.2f}"
            for i, (x, y) in enumerate(path.points)
        )
        parts.append(
            f'<path data-region="{path.key}" data-region-id="{path.key}" d="{cmds} Z" fill="{FILL}" stroke="{STROKE}" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />'
        )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" '
        f'preserveAspectRatio="xMidYMid meet">\n  '
        + "\n  ".join(parts)
        + "\n</svg>\n"
    )


def mould_preview(paths: list[RegionPath]) -> np.ndarray:
    img = np.full((SIZE, SIZE, 3), 255, np.uint8)
    cv2.rectangle(img, (1, 1), (SIZE - 2, SIZE - 2), (102, 102, 102), 2)
    for path in paths:
        if path.kind == "circle" and path.circle:
            cx, cy, r = path.circle
            cv2.circle(img, (int(cx), int(cy)), int(r), (102, 102, 102), 2)
        else:
            pts = path.points.astype(np.int32).reshape(-1, 1, 2)
            cv2.polylines(img, [pts], True, (102, 102, 102), 2, cv2.LINE_AA)
    return img


def save_png(path: Path, img: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imencode(".png", img)[1].tofile(str(path))


def process_image(
    raw: np.ndarray,
    reference: str,
    *,
    already_cropped: bool = False,
    quad: np.ndarray | None = None,
    min_confidence: float = PUBLISH_MIN,
    apply_catalog_gates: bool = True,
    svg_dir: Path | None = None,
    svg_filename: str | None = None,
    review_dir: Path | None = None,
    source_image: str | None = None,
    on_step: Callable[[str], None] | None = None,
) -> Result:
    result = Result(reference=reference, source_image=source_image, status="photo-only")

    def step(name: str) -> None:
        if on_step:
            on_step(name)

    if already_cropped:
        if quad is not None:
            unit_img = warp_quad(raw, quad)
            unit, repeat_conf = "1x1", 0.78
            rectified = unit_img
        else:
            unit_img = square_crop(raw)
            unit, repeat_conf = "1x1", 0.7
            rectified = rectify(unit_img)
    else:
        unit_img, unit, repeat_conf = extract_unit(raw)
        rectified = rectify(unit_img)

    step("finding-pattern")
    cleaned = remove_grout_lines(rectified)
    labels, _centers, quantized = quantize(cleaned)
    labels = absorb_tiny(labels)
    scores = symmetry_scores(labels)
    labels = enforce_symmetry(labels, scores)
    labels = absorb_tiny(labels)
    step("detecting-colors")
    paths = extract_paths(labels)

    crop_dir = review_dir or OUT_REVIEW
    crop_name = f"{reference}-crop.png" if apply_catalog_gates else "crop.png"
    preview_name = f"{reference}-mould.png" if apply_catalog_gates else "preview.png"
    save_png(crop_dir / crop_name, quantized)
    result.crop_url = crop_name
    result.repeat_unit = unit

    if not paths:
        result.status = "needs-manual-vectorization"
        result.reason = "no-closed-regions"
        result.confidence = 0.15
        return result

    raster = rasterize(paths)
    src_ids = np.zeros_like(labels, np.int32)
    for i, color in enumerate(np.unique(labels), start=1):
        src_ids[labels == color] = i
    iou = mask_iou(src_ids, raster)
    conf, reason = confidence_of(paths, iou, scores, repeat_conf, unit, min_confidence=min_confidence)

    preview = mould_preview(paths)
    save_png(crop_dir / preview_name, preview)
    result.preview_url = preview_name
    result.iou = round(iou, 3)
    result.confidence = round(conf, 3)
    result.region_count = len({p.key for p in paths}) + 1
    result.regions = [{"key": "background", "name": "Background"}] + [
        {"key": key, "name": f"Area {i}"}
        for i, key in enumerate(dict.fromkeys(p.key for p in paths), start=1)
    ]

    geom_reason = geometry_ok(
        paths,
        preview,
        skip_grid_gate=not apply_catalog_gates,
        skip_asymmetric=not apply_catalog_gates,
        overlap_limit=0.12 if apply_catalog_gates else 0.22,
    )
    if apply_catalog_gates and result.reference in VISUAL_REJECT:
        geom_reason = geom_reason or "visual-reject"
    if geom_reason:
        result.status = "needs-manual-vectorization"
        result.reason = geom_reason
        result.confidence = min(result.confidence, 0.72)
        return result

    if conf < min_confidence:
        result.status = "needs-manual-vectorization"
        result.reason = reason
        return result

    step("creating-mould")
    svg = svg_markup(paths)
    dest_dir = svg_dir or OUT_SVG
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_name = svg_filename or f"{reference}.svg"
    (dest_dir / dest_name).write_text(svg, encoding="utf-8")
    result.svg_url = dest_name
    result.status = "editable-svg"
    result.published = True
    result.reason = None
    return result


def process_entry(entry: dict) -> Result:
    reference = entry["reference"]
    source_path = resolve_source(entry.get("sourceImage"), entry.get("thumbnail"))
    result = Result(reference=reference, source_image=entry.get("sourceImage"), status="photo-only")
    if source_path is None:
        result.status = "invalid"
        result.reason = "missing-source"
        return result

    try:
        raw = load_bgr(source_path)
    except Exception as exc:
        result.status = "invalid"
        result.reason = str(exc)
        return result

    h, w = raw.shape[:2]
    aspect = w / max(h, 1)
    if aspect < 0.72 or aspect > 1.38:
        result.status = "photo-only"
        result.reason = "not-front-facing"
        return result

    result = process_image(
        raw,
        reference,
        already_cropped=False,
        min_confidence=PUBLISH_MIN,
        apply_catalog_gates=True,
        source_image=entry.get("sourceImage"),
    )
    if result.crop_url:
        result.crop_url = f"/moulds/review/{Path(result.crop_url).name}"
    if result.preview_url:
        result.preview_url = f"/moulds/review/{Path(result.preview_url).name}"
    if result.published and result.svg_url:
        result.svg_url = f"/moulds/moroccan/{reference}.svg"
    return result


def write_review_html(results: list[Result]) -> None:
    cards = []
    for item in results:
        badge = "published" if item.published else item.status
        src = item.crop_url or ""
        gen = item.preview_url or ""
        svg = item.svg_url or ""
        cards.append(
            f"""<article class="card {badge}">
  <header><strong>{item.reference}</strong> <span>{badge}</span> <em>{item.confidence:.2f}</em></header>
  <div class="pair">
    <figure><img src="{src}" alt="source crop"/><figcaption>Source crop</figcaption></figure>
    <figure><img src="{gen}" alt="generated mould"/><figcaption>Generated mould</figcaption></figure>
  </div>
  <p>{item.reason or svg or ""}</p>
</article>"""
        )
    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Mould extraction review</title>
<style>
body {{ font-family: Georgia, serif; background:#f6f1e8; color:#222; margin:24px; }}
h1 {{ font-weight:normal; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(420px,1fr)); gap:16px; }}
.card {{ background:#fff; border:1px solid #ddd; padding:12px; }}
.card.published {{ border-color:#1b5e4a; }}
.pair {{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }}
img {{ width:100%; background:#fff; }}
header {{ display:flex; gap:8px; align-items:baseline; margin-bottom:8px; }}
span {{ font-size:12px; text-transform:uppercase; letter-spacing:.08em; }}
em {{ margin-left:auto; font-style:normal; }}
</style></head>
<body>
<h1>Mould extraction review</h1>
<p>Only items with confidence ≥ {PUBLISH_MIN:.2f} are published to the customer catalogue.</p>
<div class="grid">
{''.join(cards)}
</div>
</body></html>
"""
    (WEB / "public" / "moulds" / "review.html").write_text(html, encoding="utf-8")


def update_catalogue(results: list[Result]) -> None:
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    by_ref = {item.reference: item for item in results}
    published = 0
    for item in catalogue["items"]:
        result = by_ref.get(item["reference"])
        if not result:
            continue
        item["confidence"] = result.confidence
        item["repeatUnit"] = result.repeat_unit
        item["repeatMode"] = "straight"
        if result.published and result.svg_url:
            item["svgUrl"] = result.svg_url
            item["editable"] = True
            item["status"] = "editable-svg"
            item["regions"] = result.regions
            item["displayOrder"] = min(item.get("displayOrder", 300), 250)
            published += 1
        else:
            item["svgUrl"] = None
            item["editable"] = False
            item["status"] = result.status
            item["regions"] = []
    diagnostics = catalogue.setdefault("diagnostics", {})
    diagnostics["vectorizedImported"] = published
    diagnostics["vectorizationFailed"] = sum(1 for r in results if not r.published)
    diagnostics["editableSvgMoulds"] = sum(1 for i in catalogue["items"] if i.get("editable"))
    diagnostics["rasterOnlyPatterns"] = sum(1 for i in catalogue["items"] if not i.get("editable"))
    CATALOGUE.write_text(json.dumps(catalogue, indent=2) + "\n", encoding="utf-8")

    slim = [
        {
            "reference": item["reference"],
            "source": item.get("sourceImage"),
            "status": item.get("status"),
            "svgUrl": item.get("svgUrl") if item.get("editable") else None,
            "editable": bool(item.get("editable")),
            "confidence": item.get("confidence"),
        }
        for item in catalogue["items"]
    ]
    MOULDS_JSON.write_text(json.dumps(slim, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    ensure_dirs()
    moved = archive_old_traces()
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    targets = [item for item in catalogue["items"] if str(item.get("reference", "")).startswith("MOR-")]
    results: list[Result] = []
    for entry in targets:
        result = process_entry(entry)
        results.append(result)
        mark = "PUBLISH" if result.published else result.status
        print(f"{result.reference:10} {mark:28} conf={result.confidence:.2f} iou={result.iou:.2f} {result.reason or ''}")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "publishThreshold": PUBLISH_MIN,
        "archivedOldTraces": moved,
        "published": sum(1 for r in results if r.published),
        "rejected": sum(1 for r in results if not r.published),
        "items": [r.__dict__ for r in results],
    }
    REVIEW_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    write_review_html(results)
    update_catalogue(results)
    print(f"Archived {moved} noisy traces")
    print(f"Published {payload['published']} moulds, rejected {payload['rejected']}")
    print(f"Review: {WEB / 'public' / 'moulds' / 'review.html'}")


if __name__ == "__main__":
    main()
