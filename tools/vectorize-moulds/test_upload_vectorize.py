import math
import re
import tempfile
import unittest
from pathlib import Path

import cv2
import numpy as np

from upload_vectorize import detect_repeat_unit, process_upload_image


def _tile(size: int = 160) -> np.ndarray:
    img = np.full((size, size, 3), (236, 241, 245), np.uint8)
    center = (size // 2, size // 2)
    cv2.circle(img, center, size // 3, (70, 35, 22), max(6, size // 18))
    for i in range(8):
        angle = i * math.pi / 4
        cx = int(size / 2 + math.cos(angle) * size * 0.22)
        cy = int(size / 2 + math.sin(angle) * size * 0.22)
        cv2.circle(img, (cx, cy), size // 14, (168, 158, 132), -1)
    cv2.circle(img, center, size // 16, (168, 158, 132), -1)
    return img


def _colored_tile(size: int = 180) -> np.ndarray:
    img = np.full((size, size, 3), (176, 213, 232), np.uint8)
    cv2.rectangle(img, (12, 12), (size - 12, size - 12), (180, 90, 40), 10)
    cv2.circle(img, (size // 2, size // 2), size // 4, (90, 90, 90), -1)
    cv2.circle(img, (size // 2, size // 2), size // 8, (176, 213, 232), -1)
    return img


def _hexagon(size: int = 240) -> np.ndarray:
    img = np.full((size, size, 3), 255, np.uint8)
    center = (size / 2, size / 2)
    radius = size * 0.36
    pts = np.array(
        [
            [
                center[0] + radius * math.cos(math.pi / 6 + i * math.pi / 3),
                center[1] + radius * math.sin(math.pi / 6 + i * math.pi / 3),
            ]
            for i in range(6)
        ],
        dtype=np.int32,
    )
    cv2.fillPoly(img, [pts], (0, 220, 255))
    return img


def _zellige_star(size: int = 220) -> np.ndarray:
    img = np.full((size, size, 3), (210, 190, 40), np.uint8)
    center = (size // 2, size // 2)
    outer, inner = size * 0.42, size * 0.18
    star = []
    for i in range(16):
        r = outer if i % 2 == 0 else inner
        angle = i * math.pi / 8 - math.pi / 2
        star.append([center[0] + r * math.cos(angle), center[1] + r * math.sin(angle)])
    cv2.fillPoly(img, [np.array(star, np.int32)], (40, 90, 180))
    cv2.circle(img, center, int(size * 0.08), (30, 40, 30), -1)
    return img


def _simple_flower(size: int = 320) -> np.ndarray:
    img = np.full((size, size, 3), 255, np.uint8)
    center = (size // 2, size // 2)
    for i in range(8):
        angle = i * math.pi / 4
        cx = int(center[0] + math.cos(angle) * size * 0.22)
        cy = int(center[1] + math.sin(angle) * size * 0.22)
        cv2.ellipse(img, (cx, cy), (int(size * 0.12), int(size * 0.07)), math.degrees(angle), 0, 360, (20, 20, 20), -1)
    cv2.circle(img, center, int(size * 0.14), (255, 255, 255), -1)
    for i in range(8):
        angle = i * math.pi / 4 + math.pi / 8
        cx = int(center[0] + math.cos(angle) * size * 0.07)
        cy = int(center[1] + math.sin(angle) * size * 0.07)
        cv2.circle(img, (cx, cy), int(size * 0.035), (20, 20, 20), -1)
    cv2.circle(img, center, int(size * 0.045), (20, 20, 20), -1)
    for cx, cy in (
        (int(size * 0.16), int(size * 0.16)),
        (int(size * 0.84), int(size * 0.16)),
        (int(size * 0.16), int(size * 0.84)),
        (int(size * 0.84), int(size * 0.84)),
    ):
        cv2.circle(img, (cx, cy), int(size * 0.07), (20, 20, 20), -1)
    return img


def _four_small_stars(size: int = 240) -> np.ndarray:
    img = np.full((size, size, 3), (236, 228, 210), np.uint8)
    radius = size * 0.11
    for cx, cy in (
        (size * 0.28, size * 0.28),
        (size * 0.72, size * 0.28),
        (size * 0.28, size * 0.72),
        (size * 0.72, size * 0.72),
    ):
        star = []
        for i in range(16):
            r = radius if i % 2 == 0 else radius * 0.42
            angle = i * math.pi / 8 - math.pi / 2
            star.append([cx + r * math.cos(angle), cy + r * math.sin(angle)])
        cv2.fillPoly(img, [np.array(star, np.int32)], (40, 90, 180))
    return img


class UploadVectorizeTests(unittest.TestCase):
    def test_detects_2x2_repeat_unit(self):
        tile = _tile()
        grid = np.vstack([np.hstack([tile, tile]), np.hstack([tile, tile])])
        unit, name, score = detect_repeat_unit(grid)
        self.assertEqual(name, "2x2")
        self.assertGreaterEqual(score, 0.38)
        self.assertLess(min(unit.shape[:2]), min(grid.shape[:2]) * 0.7)

    def test_upload_svg_keeps_ornamental_curves(self):
        tile = _zellige_star(200)
        grid = np.vstack([np.hstack([tile, tile]), np.hstack([tile, tile])])
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(grid, "TEST-001", review_dir=out, svg_dir=out)
            self.assertTrue(result.published, result.reason)
            svg = (out / "mould.svg").read_text(encoding="utf-8")
            self.assertIn('fill="#FFFFFF"', svg)
            self.assertIn('stroke="#707070"', svg)
            self.assertIn("mould-outlines", svg)
            self.assertIn('id="tracing"', svg)
            self.assertNotIn("<style", svg)
            self.assertNotRegex(svg, r'fill="#(?!FFFFFF|ffffff)[0-9A-Fa-f]{6}"')
            self.assertGreater(svg.count("C") + svg.count("L"), 8)
            preview = cv2.imread(str(out / "preview.png"))
            unique = {tuple(int(c) for c in px) for px in preview.reshape(-1, 3)}
            for bgr in unique:
                self.assertTrue(bgr == (255, 255, 255) or max(bgr) - min(bgr) <= 8)

    def test_upload_svg_discards_photo_colors(self):
        tile = _colored_tile(200)
        grid = np.vstack([np.hstack([tile, tile]), np.hstack([tile, tile])])
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(grid, "TEST-002", review_dir=out, svg_dir=out)
            self.assertTrue(result.published, result.reason)
            svg = (out / "mould.svg").read_text(encoding="utf-8")
            fills = set(re.findall(r'\bfill="([^"]+)"', svg))
            self.assertTrue(fills <= {"#FFFFFF", "none", "white"})
            self.assertNotIn("#B4D5E8", svg.upper())
            self.assertNotIn("#285AB4", svg.upper())
            self.assertIn('fill="none"', svg)

    def test_hexagon_is_traced_as_outline(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(_hexagon(280), "HEX-001", review_dir=out, svg_dir=out)
            self.assertTrue(result.published, result.reason)
            svg = (out / "mould.svg").read_text(encoding="utf-8")
            self.assertIn("<path", svg)
            self.assertIn('stroke="#707070"', svg)
            self.assertGreater(svg.count("L") + svg.count("C"), 4)

    def test_preserves_repeated_small_stars(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(_four_small_stars(260), "STAR-4", review_dir=out, svg_dir=out)
            self.assertTrue(result.published, result.reason)
            svg = (out / "mould.svg").read_text(encoding="utf-8")
            self.assertIn("<path", svg)
            self.assertGreater(svg.count("L") + svg.count("C"), 8)

    def test_simple_flower_keeps_only_major_shapes(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(_simple_flower(300), "FLOWER-1", review_dir=out, svg_dir=out)
            self.assertTrue(result.published, result.reason)
            svg = (out / "mould.svg").read_text(encoding="utf-8")
            paths = svg.count("<path d=")
            commands = svg.count("L") + svg.count("C")
            self.assertGreaterEqual(paths, 2)
            self.assertLessEqual(paths, 40)
            self.assertLessEqual(commands, 500)
            self.assertIn(" Z", svg)

    def test_rejects_noisy_photograph(self):
        rng = np.random.default_rng(0)
        noise = rng.integers(0, 255, (400, 400, 3), dtype=np.uint8)
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            result = process_upload_image(noise, "NOISE-001", review_dir=out, svg_dir=out)
            self.assertFalse(result.published)
            self.assertFalse((out / "mould.svg").exists())


if __name__ == "__main__":
    unittest.main()
