"""Customer tile photo → clean outline SVG mould.

Grayscale → adaptive threshold → skeletonize → Potrace.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from upload_vectorize import process_upload_image
from vectorize import load_bgr, save_png


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def parse_crop(value: str | None) -> tuple[int, int, int, int] | None:
    if not value:
        return None
    parts = [int(float(item.strip())) for item in value.split(",")]
    if len(parts) != 4:
        raise ValueError("crop must be x,y,w,h")
    return parts[0], parts[1], parts[2], parts[3]


def parse_quad(value: str | None) -> np.ndarray | None:
    if not value:
        return None
    nums = [float(item.strip()) for item in value.split(",")]
    if len(nums) != 8:
        raise ValueError("quad must be x1,y1,x2,y2,x3,y3,x4,y4")
    return np.array(nums, dtype=np.float32).reshape(4, 2)


def apply_crop(img: np.ndarray, crop: tuple[int, int, int, int] | None) -> np.ndarray:
    if crop is None:
        return img
    x, y, w, h = crop
    height, width = img.shape[:2]
    x = max(0, min(x, width - 1))
    y = max(0, min(y, height - 1))
    w = max(8, min(w, width - x))
    h = max(8, min(h, height - y))
    return img[y : y + h, x : x + w]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--id", required=True)
    parser.add_argument("--crop")
    parser.add_argument("--quad")
    parser.add_argument("--status-file")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    status_path = Path(args.status_file) if args.status_file else out_dir / "status.json"

    def on_step(name: str) -> None:
        write_json(status_path, {"step": name, "status": "processing"})

    write_json(status_path, {"step": "uploaded", "status": "processing"})
    try:
        raw = load_bgr(Path(args.input))
    except Exception as exc:
        payload = {
            "published": False,
            "status": "failed",
            "reason": "invalid-image",
            "detail": str(exc),
            "confidence": 0,
        }
        write_json(out_dir / "result.json", payload)
        write_json(status_path, {"step": "failed", "status": "failed", "reason": "invalid-image"})
        return 1

    height, width = raw.shape[:2]
    if min(height, width) < 300:
        payload = {
            "published": False,
            "status": "failed",
            "reason": "too-small",
            "confidence": 0,
            "width": width,
            "height": height,
        }
        write_json(out_dir / "result.json", payload)
        write_json(status_path, {"step": "failed", "status": "failed", "reason": "too-small"})
        return 1

    write_json(status_path, {"step": "detecting-tile", "status": "processing"})
    cropped = apply_crop(raw, parse_crop(args.crop))
    save_png(out_dir / "source.png", cropped)
    quad = parse_quad(args.quad)

    result = process_upload_image(
        cropped,
        args.id,
        quad=quad,
        review_dir=out_dir,
        svg_dir=out_dir,
        svg_filename="mould.svg",
        source_image="source.png",
        on_step=on_step,
    )

    public_base = f"/moulds/custom/{args.id}"
    payload = {
        "jobId": args.id,
        "published": bool(result.published),
        "status": "ready" if result.published else "failed",
        "confidence": result.confidence,
        "reason": result.reason,
        "regionCount": result.region_count,
        "regions": result.regions,
        "svgUrl": f"{public_base}/mould.svg" if result.published else None,
        "sourceUrl": f"{public_base}/source.png",
        "cropUrl": f"{public_base}/crop.png" if (out_dir / "crop.png").exists() else f"{public_base}/source.png",
        "previewUrl": f"{public_base}/preview.png" if (out_dir / "preview.png").exists() else None,
    }
    write_json(out_dir / "result.json", payload)
    write_json(
        status_path,
        {
            "step": "done" if result.published else "failed",
            "status": payload["status"],
            "reason": result.reason,
        },
    )
    if not result.published:
        mould = out_dir / "mould.svg"
        if mould.exists():
            mould.unlink()
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
