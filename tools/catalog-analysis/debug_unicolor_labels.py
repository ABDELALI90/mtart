from pathlib import Path

import cv2
import numpy as np
from PIL import Image

page = np.array(Image.open(r"E:\art carreaux ciment\ART\import\extracted\unicolor\page-1-hires.png"))
h, w = page.shape[:2]
footer = int(h * 0.90)
img = page[:footer]
print("page", w, h)

for thresh in (220, 230, 240, 248, 252):
    white = (img[:, :, 0] > thresh) & (img[:, :, 1] > thresh) & (img[:, :, 2] > thresh)
    u8 = white.astype(np.uint8) * 255
    contours, _ = cv2.findContours(u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cands = []
    for contour in contours:
        x, y, bw, bh = cv2.boundingRect(contour)
        area = bw * bh
        ratio = bw / max(bh, 1)
        fill = cv2.contourArea(contour) / max(area, 1)
        cands.append((area, bw, bh, round(ratio, 2), round(fill, 2), x, y))
    cands.sort(reverse=True)
    mid = [c for c in cands if 200 < c[0] < 20000 and 1.2 < c[3] < 8]
    print(f"thresh={thresh} contours={len(contours)} mid={len(mid)} top={cands[:5]}")
    if mid:
        print("  mid sample", mid[:8])
