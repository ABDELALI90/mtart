from pathlib import Path

import cv2
import numpy as np
from PIL import Image

for name in ("page-1-hires.png", "page-2-hires.png"):
    img = np.array(Image.open(Path(r"E:\art carreaux ciment\ART\import\extracted\unicolor") / name))
    h, w = img.shape[:2]
    footer = int(h * 0.90)
    work = img[:footer]
    r, g, b = work[:, :, 0], work[:, :, 1], work[:, :, 2]
    white = (r > 230) & (g > 230) & (b > 230)
    red = (r > 140) & (g < 90) & (b < 90)
    content = (~white) & (~red)
    content = cv2.morphologyEx(content.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    row_d = content.mean(axis=1)
    runs = []
    start = None
    for i, on in enumerate(row_d > 0.25):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start > 40:
                runs.append((start, i, i - start, round(float(row_d[start:i].mean()), 3)))
            start = None
    if start is not None and len(row_d) - start > 40:
        runs.append((start, len(row_d), len(row_d) - start, round(float(row_d[start:].mean()), 3)))
    print(name, "row-runs", runs)
    if runs:
        y0, y1 = runs[0][0], runs[0][1]
        # merge adjacent long runs (page 1 grid is continuous)
        y0 = runs[0][0]
        y1 = runs[-1][1]
        # if there's a huge gap, keep only the first dense band (page 2)
        if len(runs) > 1 and runs[1][0] - runs[0][1] > 80:
            y0, y1 = runs[0][0], runs[0][1]
        band = content[y0:y1]
        xs = np.where(band.any(axis=0))[0]
        x0, x1 = int(xs.min()), int(xs.max())
        bw, bh = x1 - x0, y1 - y0
        # assume square chips
        n_cols = max(1, round(bw / bh)) if bh > bw * 0.6 else 9
        # better: n_cols from aspect of typical chip ~ square, n_rows from height
        # try n_cols 8,9,10 scoring by seam energy at divisions
        print("  band", x0, y0, x1, y1, "size", bw, bh)
        best = None
        for cols in range(7, 12):
            cell = bw / cols
            rows = max(1, round(bh / cell))
            score = abs(bh / rows - cell)
            cand = (score, cols, rows, cell)
            if best is None or cand < best:
                best = cand
        print("  best grid", "cols", best[1], "rows", best[2], "cell", round(best[3], 1), "err", round(best[0], 1))
