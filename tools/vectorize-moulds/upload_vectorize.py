"""Customer-upload photo → clean black tracing on white SVG.

Colored photo → grayscale → CLAHE → denoise → adaptive threshold →
morph → Canny → contour cleanup → skeletonize → 1px black lines on
white → SVG strokes (no source colors, no filled color regions).
"""
from __future__ import annotations

from dataclasses import dataclass, field
import math
import os
import re
from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import skeletonize

from vectorize import (
    Result,
    ncc,
    save_png,
    square_crop,
    warp_quad,
)

SIZE = 768
STROKE = "#707070"
FILL = "#FFFFFF"
VIEW = 200
MIN_INK = 0.0004
MAX_INK = 0.20
MIN_SCORE = 0.10
DEV_LOG = os.environ.get("MTART_DEBUG", "1") != "0"


MAX_PATHS = 48
MAX_PATH_POINTS = 900
MIN_AREA_RATIOS = (0.003, 0.005, 0.008, 0.012)


@dataclass
class TraceAttempt:
    skeleton: np.ndarray
    binary: np.ndarray
    score: float
    ink_ratio: float
    params: dict
    reason: str = ""
    method: str = ""
    details: dict = field(default_factory=dict)
    contour_paths: list[str] = field(default_factory=list)


def _to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _gradient_mag(gray: np.ndarray) -> np.ndarray:
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    return cv2.magnitude(gx, gy)


def _autocorr_period(values: np.ndarray, min_p: int, max_p: int) -> tuple[int, float]:
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
    if peak < min_p or score < 0.22:
        return 0, 0.0
    return peak, score


def detect_repeat_unit(img: np.ndarray) -> tuple[np.ndarray, str, float]:
    squared = square_crop(img)
    gray = _to_gray(squared)
    h, w = gray.shape
    small = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(small, (5, 5), 0)
    mag = _gradient_mag(blur)

    best_n, best_score = 1, 0.0
    for n in (2, 3, 4):
        ch = 256 // n
        ref = cv2.resize(blur[0:ch, 0:ch], (64, 64))
        scores = []
        for gy in range(n):
            for gx in range(n):
                if gx == 0 and gy == 0:
                    continue
                cell = cv2.resize(blur[gy * ch : (gy + 1) * ch, gx * ch : (gx + 1) * ch], (64, 64))
                scores.append(ncc(ref, cell))
        score = float(np.mean(scores)) if scores else 0.0
        if score > best_score:
            best_score, best_n = score, n

    n = 1
    conf = best_score if best_score else 0.4
    if best_n >= 2 and best_score >= 0.38:
        n, conf = best_n, best_score
    else:
        px, sx = _autocorr_period(mag.mean(axis=0), 40, 140)
        py, sy = _autocorr_period(mag.mean(axis=1), 40, 140)
        if px and py and min(sx, sy) >= 0.28 and abs(px - py) < 24:
            period = int(round((px + py) / 2 * (w / 256)))
            guess = int(round(min(h, w) / max(period, 1)))
            if 2 <= guess <= 4:
                n, conf = guess, float(min(sx, sy))

    if n == 1:
        return squared, "1x1", conf

    cell = min(h, w) // n
    offset = _phase_offset(squared, n, cell)
    rolled = np.roll(np.roll(squared, -offset, 0), -offset, 1)
    unit = rolled[:cell, :cell]
    inset = max(1, cell // 70)
    if cell > inset * 4:
        unit = unit[inset : cell - inset, inset : cell - inset]
    return unit, f"{n}x{n}", conf


def _phase_offset(img: np.ndarray, n: int, cell: int) -> int:
    gray = _to_gray(img)
    best_o, best_s = 0, -1.0
    step = max(1, cell // 16)
    for offset in range(0, cell, step):
        rolled = np.roll(np.roll(gray, -offset, 0), -offset, 1)
        ref = cv2.resize(rolled[:cell, :cell], (48, 48))
        scores = []
        for gy in range(n):
            for gx in range(n):
                if gx == 0 and gy == 0:
                    continue
                y0, x0 = gy * cell, gx * cell
                patch = rolled[y0 : y0 + cell, x0 : x0 + cell]
                if patch.shape[0] < cell or patch.shape[1] < cell:
                    continue
                scores.append(ncc(ref, cv2.resize(patch, (48, 48))))
        score = float(np.mean(scores)) if scores else -1.0
        if score > best_s:
            best_s, best_o = score, offset
    return best_o


def prepare_unit(img: np.ndarray, quad: np.ndarray | None) -> tuple[np.ndarray, str, float]:
    if quad is not None:
        warped = warp_quad(img, quad, size=SIZE)
        return warped, "1x1", 0.8
    unit, name, conf = detect_repeat_unit(img)
    unit = square_crop(unit)
    if unit.shape[0] != SIZE:
        unit = cv2.resize(unit, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
    return unit, name, conf


def _odd(value: int) -> int:
    value = max(3, int(value))
    return value if value % 2 == 1 else value + 1


def _log_dev(message: str) -> None:
    if DEV_LOG:
        print(message, flush=True)


def _enhance_gray(gray: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=1.4, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _denoise_gray(gray: np.ndarray) -> np.ndarray:
    clean = gray
    try:
        clean = cv2.fastNlMeansDenoising(clean, None, 11, 7, 21)
    except cv2.error:
        pass
    clean = cv2.medianBlur(clean, 5)
    clean = cv2.bilateralFilter(clean, 9, 55, 55)
    clean = cv2.GaussianBlur(clean, (5, 5), 0)
    return clean


def _dominant_tone_count(gray: np.ndarray) -> int:
    small = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA)
    pixels = small.reshape(-1, 1).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5)
    _, _labels, centers = cv2.kmeans(pixels, 3, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    centers = sorted(float(c) for c in centers.ravel())
    unique = 1
    for prev, cur in zip(centers, centers[1:]):
        if abs(cur - prev) > 28:
            unique += 1
    return unique


def _clean_binary(mask: np.ndarray) -> np.ndarray:
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)


def _binary_motif(gray: np.ndarray) -> np.ndarray:
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _t, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    dark = cv2.bitwise_not(otsu)
    if float((dark > 0).mean()) > 0.55:
        dark = otsu
    return _clean_binary(dark)


def _binary_from_color(bgr: np.ndarray) -> np.ndarray:
    border = np.concatenate([bgr[0], bgr[-1], bgr[:, 0], bgr[:, -1]]).astype(np.float32)
    background = np.median(border, axis=0)
    dist = np.linalg.norm(bgr.astype(np.float32) - background, axis=2)
    norm = np.clip(dist * (255.0 / max(float(dist.max()), 1.0)), 0, 255).astype(np.uint8)
    _t, mask = cv2.threshold(norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if float((mask > 0).mean()) > 0.7:
        mask = cv2.bitwise_not(mask)
    return _clean_binary(mask)


def _circularity(contour: np.ndarray) -> float:
    area = abs(cv2.contourArea(contour))
    peri = cv2.arcLength(contour, True)
    if peri <= 1:
        return 0.0
    return float(4 * math.pi * area / (peri * peri))


def _fit_clean_contour(contour: np.ndarray) -> np.ndarray | None:
    area = abs(cv2.contourArea(contour))
    peri = cv2.arcLength(contour, True)
    if area < 1 or peri < 8:
        return None
    if _circularity(contour) >= 0.78:
        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        if radius >= SIZE * 0.025:
            pts = []
            for i in range(28):
                angle = i * 2 * math.pi / 28
                pts.append([cx + radius * math.cos(angle), cy + radius * math.sin(angle)])
            return np.array(pts, dtype=np.float32)
    epsilon = max(1.6, 0.012 * peri)
    approx = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
    if len(approx) < 3:
        return None
    try:
        from shapely.geometry import LinearRing

        ring = LinearRing(np.vstack([approx, approx[:1]]))
        simple = np.array(ring.simplify(1.8, preserve_topology=True).coords, dtype=np.float32)
        if len(simple) >= 4:
            return simple[:-1] if np.linalg.norm(simple[0] - simple[-1]) < 1.5 else simple
    except Exception:
        pass
    return approx.astype(np.float32)


def _keep_major_contours(contours: list, min_ratio: float) -> list[np.ndarray]:
    image_area = float(SIZE * SIZE)
    min_area = image_area * min_ratio
    speckle = image_area * 0.0008
    infos = []
    for contour in contours:
        area = abs(cv2.contourArea(contour))
        peri = cv2.arcLength(contour, True)
        infos.append((contour, area, peri))
    kept: list[np.ndarray] = []
    for contour, area, peri in infos:
        if area < speckle or peri < SIZE * 0.04:
            continue
        if area >= min_area:
            fitted = _fit_clean_contour(contour)
            if fitted is not None:
                kept.append(fitted)
            continue
        similar = sum(
            1
            for _, other_area, other_peri in infos
            if other_area >= speckle
            and abs(other_area - area) / max(area, 1.0) < 0.35
            and abs(other_peri - peri) / max(peri, 1.0) < 0.35
        )
        if similar >= 4 and area >= image_area * 0.0015:
            fitted = _fit_clean_contour(contour)
            if fitted is not None:
                kept.append(fitted)
    return kept


def _contour_to_path(points: np.ndarray) -> str:
    if len(points) < 3:
        return ""
    cmds = " ".join(f"{'M' if i == 0 else 'L'}{_scale_pt(float(x), float(y))}" for i, (x, y) in enumerate(points))
    if np.linalg.norm(points[0] - points[-1]) > 2:
        cmds += f" L{_scale_pt(float(points[0][0]), float(points[0][1]))}"
    return cmds + " Z"


def _draw_contour_skeleton(contours: list[np.ndarray]) -> np.ndarray:
    canvas = np.zeros((SIZE, SIZE), np.uint8)
    for points in contours:
        pts = np.round(points).astype(np.int32).reshape(-1, 1, 2)
        cv2.polylines(canvas, [pts], True, 255, 2, cv2.LINE_AA)
    return canvas


def _paths_too_complex(paths: list[str]) -> bool:
    points = sum(path.count("L") + path.count("C") + 1 for path in paths)
    return len(paths) > MAX_PATHS or points > MAX_PATH_POINTS


def extract_major_boundaries(gray: np.ndarray, color: np.ndarray | None = None) -> tuple[list[np.ndarray], np.ndarray, dict] | None:
    denoise = _denoise_gray(gray)
    binaries = [_binary_motif(denoise)]
    if color is not None:
        binaries.append(_binary_from_color(color))
    best: list[np.ndarray] | None = None
    used_ratio = MIN_AREA_RATIOS[0]
    for binary in binaries:
        raw, _hier = cv2.findContours((binary > 0).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
        for ratio in MIN_AREA_RATIOS:
            kept = _keep_major_contours(raw, ratio)
            if len(kept) < 1:
                continue
            paths = [_contour_to_path(item) for item in kept]
            paths = [path for path in paths if path]
            if _paths_too_complex(paths):
                continue
            if best is None or (2 <= len(kept) < len(best)) or (best and len(kept) <= 24 and len(best) > 24):
                best = kept
                used_ratio = ratio
            if 2 <= len(kept) <= 16:
                best = kept
                used_ratio = ratio
                break
        if best and 2 <= len(best) <= 16:
            break
    if not best:
        return None
    skel = _draw_contour_skeleton(best)
    details = {
        "method": "regions",
        "ratio": used_ratio,
        "contours": len(best),
        "tones": _dominant_tone_count(denoise),
    }
    return best, skel, details


def _as_line_ink(binary: np.ndarray) -> np.ndarray:
    """255 = tracing, 0 = background. Never keep a filled majority."""
    ink = binary.copy()
    if ink.mean() > 127:
        ink = 255 - ink
    return ink


def _suppress_flat_fills(ink: np.ndarray, gray: np.ndarray) -> np.ndarray:
    """Drop large nearly-uniform color fields; keep transitions only."""
    mag = _gradient_mag(gray)
    num, labels, stats, _ = cv2.connectedComponentsWithStats((ink > 0).astype(np.uint8))
    out = np.zeros_like(ink)
    large = SIZE * SIZE * 0.12
    for index in range(1, num):
        area = int(stats[index, cv2.CC_STAT_AREA])
        mask = labels == index
        if area < 5:
            continue
        if area > large and float(mag[mask].mean()) < 10:
            continue
        out[mask] = 255
    edge = mag > 10
    bounds = cv2.morphologyEx(ink, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    return cv2.bitwise_or(cv2.bitwise_and(out, np.uint8(edge) * 255), bounds)


def _remove_short_fragments(lines: np.ndarray) -> np.ndarray:
    num, labels, stats, _ = cv2.connectedComponentsWithStats((lines > 0).astype(np.uint8))
    areas = [int(stats[i, cv2.CC_STAT_AREA]) for i in range(1, num)]
    out = np.zeros_like(lines)
    for index in range(1, num):
        area = int(stats[index, cv2.CC_STAT_AREA])
        if area >= 10:
            out[labels == index] = 255
            continue
        if area < 4:
            continue
        similar = sum(1 for other in areas if abs(other - area) / max(area, 1) < 0.35)
        if similar >= 3:
            out[labels == index] = 255
    return out


def _clean_tracing(binary: np.ndarray, gray: np.ndarray, canny_lo: int, canny_hi: int) -> tuple[np.ndarray, np.ndarray]:
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=1)
    ink = _as_line_ink(cleaned)
    ink = _suppress_flat_fills(ink, gray)
    canny = cv2.Canny(gray, canny_lo, canny_hi)
    lines = cv2.bitwise_or(ink, canny)
    thin = np.ones((2, 2), np.uint8)
    lines = cv2.morphologyEx(lines, cv2.MORPH_CLOSE, thin, iterations=1)
    lines = cv2.morphologyEx(lines, cv2.MORPH_OPEN, thin, iterations=1)
    lines = _remove_short_fragments(lines)
    return lines, ink


def extract_line_map(gray: np.ndarray, params: dict) -> tuple[np.ndarray, np.ndarray]:
    blur_k = _odd(params["blur"])
    block = _odd(params["block"])
    if params.get("filter") == "bilateral":
        blur = cv2.bilateralFilter(gray, 7, 50, 50)
    else:
        blur = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)
    binary = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        block,
        params["C"],
    )
    return _clean_tracing(binary, blur, params["canny_lo"], params["canny_hi"])


def extract_otsu_map(gray: np.ndarray, blur_k: int = 5, canny_lo: int = 50, canny_hi: int = 150) -> tuple[np.ndarray, np.ndarray]:
    blur = cv2.GaussianBlur(gray, (_odd(blur_k), _odd(blur_k)), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return _clean_tracing(binary, blur, canny_lo, canny_hi)


def extract_edge_map(gray: np.ndarray, canny_lo: int, canny_hi: int) -> tuple[np.ndarray, np.ndarray]:
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    canny = cv2.Canny(blur, canny_lo, canny_hi)
    kernel = np.ones((3, 3), np.uint8)
    lines = cv2.morphologyEx(canny, cv2.MORPH_CLOSE, kernel, iterations=1)
    lines = _remove_short_fragments(lines)
    return lines, lines


def skeleton_bitmap(lines: np.ndarray) -> np.ndarray:
    binary = lines > 0
    if not binary.any():
        return np.zeros(lines.shape, np.uint8)
    skel = skeletonize(binary)
    return _remove_short_fragments((skel.astype(np.uint8) * 255))


def _keep_repeated_contours(contours: list) -> list:
    infos = []
    for contour in contours:
        area = abs(cv2.contourArea(contour))
        peri = cv2.arcLength(contour, False)
        moment = cv2.moments(contour)
        cx = moment["m10"] / moment["m00"] if moment["m00"] else 0.0
        cy = moment["m01"] / moment["m00"] if moment["m00"] else 0.0
        infos.append((contour, area, peri, cx, cy))
    kept = []
    min_len = SIZE * 0.06
    speckle = SIZE * 0.018
    for contour, area, peri, cx, cy in infos:
        if peri < speckle:
            continue
        if peri >= min_len:
            kept.append(contour)
            continue
        similar = sum(
            1
            for _, other_area, other_peri, _, _ in infos
            if other_peri >= speckle
            and abs(other_peri - peri) / max(peri, 1.0) < 0.4
            and abs(other_area - area) / max(area, 1.0) < 0.45
        )
        mirrored = sum(
            1
            for _, _, _, ox, oy in infos
            if (abs((SIZE - ox) - cx) < SIZE * 0.08 and abs(oy - cy) < SIZE * 0.08)
            or (abs(ox - cx) < SIZE * 0.08 and abs((SIZE - oy) - cy) < SIZE * 0.08)
        )
        if similar >= 3 or mirrored >= 2:
            kept.append(contour)
    return kept


def _repetition_score(skel: np.ndarray) -> float:
    small = cv2.resize(skel.astype(np.float32), (64, 64), interpolation=cv2.INTER_AREA)
    best = 0.0
    for n in (2, 4):
        cell = 64 // n
        ref = small[0:cell, 0:cell]
        scores = []
        for gy in range(n):
            for gx in range(n):
                if gx == 0 and gy == 0:
                    continue
                patch = small[gy * cell : (gy + 1) * cell, gx * cell : (gx + 1) * cell]
                scores.append(float(ncc(ref, patch)))
        if scores:
            best = max(best, float(np.mean(scores)))
    return max(0.0, best)


def _symmetry(skel: np.ndarray) -> float:
    small = cv2.resize(skel.astype(np.float32), (64, 64), interpolation=cv2.INTER_AREA)
    left_right = float(ncc(small, np.fliplr(small)))
    top_bottom = float(ncc(small, np.flipud(small)))
    return max(0.0, (left_right + top_bottom) / 2.0)


def _long_contour_count(skel: np.ndarray) -> int:
    contours, _ = cv2.findContours((skel > 0).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    min_len = SIZE * 0.12
    return sum(1 for contour in contours if cv2.arcLength(contour, False) >= min_len)


def _is_noise_skeleton(skel: np.ndarray) -> bool:
    ink = (skel > 0).astype(np.uint8)
    if float(ink.mean()) < MIN_INK:
        return True
    num, _, stats, _ = cv2.connectedComponentsWithStats(ink)
    components = max(0, num - 1)
    if components == 0:
        return True
    tiny = sum(1 for i in range(1, num) if stats[i, cv2.CC_STAT_AREA] < 8)
    if components > 520:
        return True
    if components > 140 and tiny / components > 0.85 and _repetition_score(skel) < 0.28:
        return True
    if _long_contour_count(skel) < 1 and _repetition_score(skel) < 0.3:
        return True
    return False


def _score_skeleton(skel: np.ndarray, gray: np.ndarray) -> tuple[float, float, dict]:
    ink = skel > 0
    ink_ratio = float(ink.mean())
    blank = 1.0 - ink_ratio
    details = {"ink": round(ink_ratio, 4), "blank": round(blank, 3)}
    if ink_ratio < MIN_INK:
        return 0.0, ink_ratio, {**details, "reject": "almost-blank"}
    if ink_ratio > MAX_INK or blank < 0.80:
        return 0.02, ink_ratio, {**details, "reject": "not-white-background"}

    num, _, stats, _ = cv2.connectedComponentsWithStats(ink.astype(np.uint8))
    components = max(0, num - 1)
    tiny = sum(1 for i in range(1, num) if stats[i, cv2.CC_STAT_AREA] < 8)
    noise = tiny / max(components, 1)
    symmetry = _symmetry(skel)
    photo = (_gradient_mag(gray) > 12).astype(np.uint8)
    dilated = cv2.dilate(skel, np.ones((3, 3), np.uint8), iterations=1) > 0
    photo_sum = max(float(photo.sum()), 1.0)
    ink_sum = max(float(ink.sum()), 1.0)
    overlap = float(np.logical_and(photo > 0, dilated).sum()) / photo_sum
    coverage = float(np.logical_and(photo > 0, dilated).sum()) / ink_sum
    long_n = _long_contour_count(skel)
    continuity = min(1.0, long_n / 6.0)
    repetition = _repetition_score(skel)
    complexity = float((_gradient_mag(gray) > 18).mean())

    score = (
        0.22 * min(overlap, 1.0)
        + 0.16 * min(coverage, 1.0)
        + 0.14 * symmetry
        + 0.16 * (1.0 - min(noise, 1.0))
        + 0.14 * continuity
        + 0.10 * min(repetition, 1.0)
        + 0.08 * min(blank, 1.0)
    )
    if components > 280 and repetition < 0.28:
        score *= 0.35
    if noise > 0.72 and repetition < 0.28:
        score *= 0.4
    if long_n < 1 and repetition < 0.3:
        score *= 0.15
    if complexity > 0.42 and symmetry < 0.28 and repetition < 0.28:
        score *= 0.08
        details["reject"] = "noise-like"
    details.update(
        {
            "noise": round(noise, 3),
            "symmetry": round(symmetry, 3),
            "coverage": round(min(coverage, 1.0), 3),
            "continuity": round(continuity, 3),
            "components": components,
            "long": long_n,
            "complexity": round(complexity, 3),
            "repetition": round(repetition, 3),
        }
    )
    return float(score), ink_ratio, details


def _param_grid() -> list[dict]:
    params = []
    seen = set()

    def add(item: dict) -> None:
        key = (item["blur"], item["block"], item["C"], item["canny_lo"], item["canny_hi"], item["filter"])
        if key in seen:
            return
        seen.add(key)
        params.append(item)

    for block in (11, 21, 31, 41):
        for c_value in (2, 5, 8, 12):
            add(
                {
                    "method": "adaptive",
                    "blur": 5,
                    "block": block,
                    "C": c_value,
                    "canny_lo": 50,
                    "canny_hi": 150,
                    "filter": "gaussian",
                }
            )
    for blur, filt in ((3, "gaussian"), (5, "gaussian"), (7, "gaussian"), (5, "bilateral")):
        add(
            {
                "method": "adaptive",
                "blur": blur,
                "block": 31,
                "C": 8,
                "canny_lo": 50,
                "canny_hi": 150,
                "filter": filt,
            }
        )
    for lo, hi in ((50, 150), (75, 200), (100, 250)):
        add(
            {
                "method": "adaptive",
                "blur": 5,
                "block": 31,
                "C": 8,
                "canny_lo": lo,
                "canny_hi": hi,
                "filter": "gaussian",
            }
        )
    return params


def _attempt(skel: np.ndarray, binary: np.ndarray, gray: np.ndarray, params: dict) -> TraceAttempt:
    score, ink_ratio, details = _score_skeleton(skel, gray)
    return TraceAttempt(skel, binary, score, ink_ratio, params, method=str(params.get("method", "unknown")), details=details)


def best_trace(gray: np.ndarray, color: np.ndarray | None = None) -> TraceAttempt | None:
    denoise = _denoise_gray(gray)
    enhanced = _enhance_gray(denoise)
    candidates: list[TraceAttempt] = []

    def consider(lines: np.ndarray, binary: np.ndarray, params: dict) -> None:
        skel = skeleton_bitmap(lines)
        candidates.append(_attempt(skel, binary, enhanced, params))

    _log_dev("TRY METHOD 1: adaptive threshold variants")
    for params in _param_grid():
        lines, binary = extract_line_map(enhanced, params)
        consider(lines, binary, params)

    _log_dev("TRY METHOD 2: Otsu threshold")
    for blur_k in (3, 5, 7):
        lines, binary = extract_otsu_map(enhanced, blur_k=blur_k)
        consider(lines, binary, {"method": "otsu", "blur": blur_k, "canny_lo": 50, "canny_hi": 150})

    _log_dev("TRY METHOD 3: direct Canny / skeleton")
    for lo, hi in ((50, 150), (75, 200), (100, 250)):
        lines, binary = extract_edge_map(enhanced, lo, hi)
        consider(lines, binary, {"method": "edges", "canny_lo": lo, "canny_hi": hi})

    ranked = sorted(candidates, key=lambda item: item.score, reverse=True)
    rejected = [item for item in candidates if item.score < MIN_SCORE or item.details.get("reject")]
    _log_dev(f"Image detection candidates: {len(candidates)}")
    for index, item in enumerate(ranked[:12], start=1):
        _log_dev(
            f"Candidate {index} score: {item.score:.3f} method={item.method} "
            f"ink={item.ink_ratio:.4f} details={item.details}"
        )
    usable = [item for item in ranked if not _is_noise_skeleton(item.skeleton) and item.score >= MIN_SCORE]
    best = usable[0] if usable else (ranked[0] if ranked else None)
    if best is None:
        _log_dev("Best method: none")
        _log_dev("Best score: 0")
        _log_dev(f"Rejected candidates: {len(rejected)}")
        return None
    fallback_paths = _stroke_paths_from_skeleton(best.skeleton)
    if _paths_too_complex(fallback_paths):
        _log_dev("Reason for rejection: skeleton too complex, retrying stronger cleanup")
        stronger = extract_major_boundaries(denoise, color)
        if stronger:
            contours, skel, details = stronger
            paths = [path for path in (_contour_to_path(item) for item in contours) if path]
            if paths and not _paths_too_complex(paths):
                retry = _attempt(skel, (skel > 0).astype(np.uint8) * 255, denoise, {"method": "regions-retry", **details})
                retry.contour_paths = paths
                retry.method = "regions-retry"
                return retry
        _log_dev("Best method: rejected as too noisy")
        return None
    best.contour_paths = fallback_paths
    _log_dev(f"Best method: {best.method}")
    _log_dev(f"Best score: {best.score:.3f}")
    _log_dev(f"Rejected candidates: {len(rejected)}")
    _log_dev(f"Selected params: {best.params}")
    return best


def ink_preview(skel: np.ndarray) -> np.ndarray:
    rgb = np.full((skel.shape[0], skel.shape[1], 3), 255, np.uint8)
    rgb[skel > 0] = (0x70, 0x70, 0x70)
    cv2.rectangle(rgb, (1, 1), (skel.shape[1] - 2, skel.shape[0] - 2), (0x70, 0x70, 0x70), 2)
    return rgb


def _scale_pt(x: float, y: float) -> str:
    scale = VIEW / SIZE
    return f"{x * scale:.2f} {y * scale:.2f}"


def _stroke_paths_from_skeleton(skel: np.ndarray) -> list[str]:
    contours, _ = cv2.findContours((skel > 0).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    paths = []
    for contour in _keep_repeated_contours(contours):
        peri = cv2.arcLength(contour, False)
        approx = cv2.approxPolyDP(contour, max(1.8, 0.012 * peri), False).reshape(-1, 2)
        if len(approx) < 2:
            continue
        cmds = " ".join(
            f"{'M' if i == 0 else 'L'}{_scale_pt(x, y)}"
            for i, (x, y) in enumerate(approx)
        )
        if len(approx) >= 3 and np.linalg.norm(approx[0] - approx[-1]) < 4:
            cmds += " Z"
        paths.append(cmds)
    return paths


def svg_from_trace(skel: np.ndarray, binary: np.ndarray, contour_paths: list[str] | None = None) -> tuple[str, list[dict]]:
    del binary
    outlines = [path for path in (contour_paths or []) if path.count("L") + path.count("C") >= 1]
    if not outlines:
        outlines = _stroke_paths_from_skeleton(skel)
    outlines = [path for path in outlines if path.count("L") + path.count("C") + path.count("Q") >= 1]
    parts = [
        f'<rect data-region="background" data-region-id="background" x="0" y="0" width="{VIEW}" height="{VIEW}" '
        f'fill="{FILL}" stroke="{STROKE}" stroke-width="1.2" vector-effect="non-scaling-stroke" />'
    ]
    regions = [{"key": "background", "name": "Background"}]
    if outlines:
        parts.append(
            f'<g id="tracing" class="mould-outlines" fill="none" stroke="{STROKE}" stroke-width="1.2" '
            'stroke-linejoin="round" stroke-linecap="round" pointer-events="none" vector-effect="non-scaling-stroke">'
        )
        for d in outlines:
            parts.append(f'  <path d="{d}" fill="none" />')
        parts.append("</g>")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}" width="{VIEW}" height="{VIEW}" '
        f'preserveAspectRatio="xMidYMid meet">\n  '
        + "\n  ".join(parts)
        + "\n</svg>\n"
    )
    return svg, regions


def _svg_is_broken(
    svg: str,
    outlines: int,
    score: float,
    ink_ratio: float,
    skel: np.ndarray | None = None,
    details: dict | None = None,
) -> tuple[bool, str]:
    commands = svg.count("L") + svg.count("C") + svg.count("Q")
    if 'fill="#FFFFFF"' not in svg and "fill='#FFFFFF'" not in svg:
        return True, "background is not white"
    if "fill=\"none\"" not in svg and outlines:
        return True, "tracing is not stroke-only"
    if any(token in svg.upper() for token in ("#B4D5E8", "#285AB4", "RGB(", "HSL(")):
        return True, "source colors remain in SVG"
    allowed = {FILL.upper(), STROKE.upper(), "#666666", "#FFFFFF", "#FFF", "NONE", "WHITE"}
    for color in re.findall(r'#[0-9A-Fa-f]{3,8}', svg):
        if color.upper() not in allowed:
            return True, "source colors remain in SVG"
    if "<path" not in svg:
        return True, "broken SVG: no path"
    if commands < 4:
        return True, "broken SVG: too few drawing commands"
    if ink_ratio < MIN_INK:
        return True, "almost completely blank"
    if ink_ratio > MAX_INK:
        return True, "tracing is not a white-background drawing"
    if details and details.get("reject") in {"noise-like", "not-white-background"}:
        return True, details["reject"]
    if skel is not None and _is_noise_skeleton(skel):
        return True, "only tiny noise / no meaningful contours"
    if outlines < 1 and commands < 6:
        return True, "no meaningful contours"
    if outlines > MAX_PATHS or commands > MAX_PATH_POINTS:
        return True, f"too complex ({outlines} paths, {commands} points)"
    if score < MIN_SCORE and (skel is None or _long_contour_count(skel) < 2):
        return True, f"low score without meaningful geometry ({score:.3f})"
    return False, ""


def process_upload_image(
    raw: np.ndarray,
    reference: str,
    *,
    quad: np.ndarray | None = None,
    review_dir=None,
    svg_dir=None,
    svg_filename: str = "mould.svg",
    source_image: str | None = None,
    on_step=None,
) -> Result:
    result = Result(reference=reference, source_image=source_image, status="photo-only")

    def step(name: str) -> None:
        if on_step:
            on_step(name)

    step("detecting-tile")
    unit, repeat_name, _repeat_conf = prepare_unit(raw, quad)
    result.repeat_unit = repeat_name
    step("finding-pattern")
    gray = _to_gray(unit)
    step("detecting-colors")
    attempt = best_trace(gray, unit)
    preview = ink_preview(attempt.skeleton) if attempt else np.full((SIZE, SIZE, 3), 255, np.uint8)

    if review_dir is not None:
        save_png(review_dir / "crop.png", unit)
        save_png(review_dir / "unit.png", unit)
        save_png(review_dir / "preview.png", preview)
        result.crop_url = "crop.png"
        result.preview_url = "preview.png"

    if attempt is None:
        result.status = "needs-manual-vectorization"
        result.reason = "low-source-similarity"
        _log_dev("Reason for rejection: no candidate produced a skeleton")
        return result

    result.confidence = round(float(attempt.score), 3)
    result.iou = result.confidence
    step("creating-mould")
    svg, regions = svg_from_trace(attempt.skeleton, attempt.binary, attempt.contour_paths)
    outlines = svg.count("<path d=")
    result.regions = regions
    result.region_count = len(regions)

    broken, reject_reason = _svg_is_broken(
        svg,
        outlines,
        attempt.score,
        attempt.ink_ratio,
        attempt.skeleton,
        attempt.details,
    )
    if broken:
        result.status = "needs-manual-vectorization"
        result.reason = "low-source-similarity"
        _log_dev(f"Reason for rejection: {reject_reason}")
        return result

    if svg_dir is not None:
        svg_dir.mkdir(parents=True, exist_ok=True)
        (svg_dir / svg_filename).write_text(svg, encoding="utf-8")
        result.svg_url = svg_filename
    result.status = "editable-svg"
    result.published = True
    result.reason = None
    return result
