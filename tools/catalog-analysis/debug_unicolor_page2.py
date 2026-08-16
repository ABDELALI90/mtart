from pathlib import Path

import cv2
import numpy as np
from PIL import Image

page = np.array(Image.open(r"E:\art carreaux ciment\ART\import\extracted\unicolor\page-2-hires.png"))
h, w = page.shape[:2]
print("page2", w, h)
footer = int(h * 0.90)
img = page[:footer]
for thresh in (210, 220, 228, 235, 245):
    white = (img[:, :, 0] > thresh) & (img[:, :, 1] > thresh) & (img[:, :, 2] > thresh)
    contours, _ = cv2.findContours(white.astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    mid = []
    for contour in contours:
        x, y, bw, bh = cv2.boundingRect(contour)
        area = bw * bh
        ratio = bw / max(bh, 1)
        fill = cv2.contourArea(contour) / max(area, 1)
        if 800 < area < 20000 and 1.2 < ratio < 5 and bh > 15:
            mid.append((area, bw, bh, round(ratio, 2), round(fill, 2), x, y))
    print(f"thresh={thresh} contours={len(contours)} mid={len(mid)} sample={sorted(mid, reverse=True)[:6]}")
