from pathlib import Path

import cv2
import numpy as np
from PIL import Image

for name in ("page-1-hires.png", "page-2-hires.png"):
    img = np.array(Image.open(Path(r"E:\art carreaux ciment\ART\import\extracted\unicolor") / name))
    h, w = img.shape[:2]
    footer = int(h * 0.90)
    work = img[:footer]
    white = (work[:, :, 0] > 230) & (work[:, :, 1] > 230) & (work[:, :, 2] > 230)
    color = ~white
    # drop thin title strokes
    color_u8 = color.astype(np.uint8) * 255
    color_u8 = cv2.morphologyEx(color_u8, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    ys, xs = np.where(color_u8 > 0)
    print(name, "bbox", xs.min(), ys.min(), xs.max(), ys.max(), "size", xs.max() - xs.min(), ys.max() - ys.min())
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
    band = work[y0:y1, x0:x1].astype(np.float32)
    # vertical seams
    dx = np.abs(np.diff(band, axis=1)).mean(axis=(0, 2))
    # smooth
    k = 21
    kernel = np.ones(k) / k
    smooth = np.convolve(dx, kernel, mode="same")
    # local peaks
    peaks = []
    for i in range(10, len(smooth) - 10):
        if smooth[i] == max(smooth[i - 8 : i + 9]) and smooth[i] > np.median(smooth) * 1.15:
            peaks.append(i)
    # merge close peaks
    merged = []
    for p in peaks:
        if not merged or p - merged[-1] > 40:
            merged.append(p)
    print("  vertical seam peaks", len(merged), merged[:15], "... widths", np.diff(merged)[:12] if len(merged) > 1 else None)
    dy = np.abs(np.diff(band, axis=0)).mean(axis=(1, 2))
    smoothy = np.convolve(dy, kernel, mode="same")
    ypeaks = []
    for i in range(10, len(smoothy) - 10):
        if smoothy[i] == max(smoothy[i - 8 : i + 9]) and smoothy[i] > np.median(smoothy) * 1.15:
            ypeaks.append(i)
    ymerged = []
    for p in ypeaks:
        if not ymerged or p - ymerged[-1] > 40:
            ymerged.append(p)
    print("  horizontal seam peaks", len(ymerged), ymerged, "heights", np.diff(ymerged) if len(ymerged) > 1 else None)
