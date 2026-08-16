import { clampCrop, type PixelCrop, type QuadPoint } from './cropGeometry';
import { MAX_WORKING_EDGE } from './imageColor';

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('invalid'));
    image.src = src;
  });
}

function affineFromTriangles(
  src: [[number, number], [number, number], [number, number]],
  dst: [[number, number], [number, number], [number, number]],
) {
  const denom =
    src[0][0] * (src[1][1] - src[2][1]) -
    src[1][0] * (src[0][1] - src[2][1]) +
    src[2][0] * (src[0][1] - src[1][1]);
  if (Math.abs(denom) < 1e-6) {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  }
  const a =
    (dst[0][0] * (src[1][1] - src[2][1]) -
      dst[1][0] * (src[0][1] - src[2][1]) +
      dst[2][0] * (src[0][1] - src[1][1])) /
    denom;
  const c =
    (src[0][0] * (dst[1][0] - dst[2][0]) -
      src[1][0] * (dst[0][0] - dst[2][0]) +
      src[2][0] * (dst[0][0] - dst[1][0])) /
    denom;
  const e =
    (src[0][0] * (src[1][1] * dst[2][0] - src[2][1] * dst[1][0]) -
      src[1][0] * (src[0][1] * dst[2][0] - src[2][1] * dst[0][0]) +
      src[2][0] * (src[0][1] * dst[1][0] - src[1][1] * dst[0][0])) /
    denom;
  const b =
    (dst[0][1] * (src[1][1] - src[2][1]) -
      dst[1][1] * (src[0][1] - src[2][1]) +
      dst[2][1] * (src[0][1] - src[1][1])) /
    denom;
  const d =
    (src[0][0] * (dst[1][1] - dst[2][1]) -
      src[1][0] * (dst[0][1] - dst[2][1]) +
      src[2][0] * (dst[0][1] - dst[1][1])) /
    denom;
  const f =
    (src[0][0] * (src[1][1] * dst[2][1] - src[2][1] * dst[1][1]) -
      src[1][0] * (src[0][1] * dst[2][1] - src[2][1] * dst[0][1]) +
      src[2][0] * (src[0][1] * dst[1][1] - src[1][1] * dst[0][1])) /
    denom;
  return { a, b, c, d, e, f };
}

function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  src: [[number, number], [number, number], [number, number]],
  dst: [[number, number], [number, number], [number, number]],
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dst[0][0], dst[0][1]);
  ctx.lineTo(dst[1][0], dst[1][1]);
  ctx.lineTo(dst[2][0], dst[2][1]);
  ctx.closePath();
  ctx.clip();
  const m = affineFromTriangles(src, dst);
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

export async function rasterizeCroppedTile(
  src: string,
  crop: PixelCrop,
  quad?: QuadPoint[],
): Promise<{ dataUrl: string; width: number; height: number }> {
  const image = await loadHtmlImage(src);
  const naturalW = image.naturalWidth || image.width;
  const naturalH = image.naturalHeight || image.height;
  const box = clampCrop(crop, naturalW, naturalH);
  const size = Math.max(32, Math.min(MAX_WORKING_EDGE, Math.round(box.size)));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('unavailable');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (quad && quad.length === 4) {
    const srcQuad = quad.map((point) => [
      box.x + point.x * box.size,
      box.y + point.y * box.size,
    ]) as [[number, number], [number, number], [number, number], [number, number]];
    const dst: [[number, number], [number, number], [number, number], [number, number]] = [
      [0, 0],
      [size, 0],
      [size, size],
      [0, size],
    ];
    drawTexturedTriangle(ctx, image, [srcQuad[0], srcQuad[1], srcQuad[2]], [dst[0], dst[1], dst[2]]);
    drawTexturedTriangle(ctx, image, [srcQuad[0], srcQuad[2], srcQuad[3]], [dst[0], dst[2], dst[3]]);
  } else {
    ctx.drawImage(image, box.x, box.y, box.size, box.size, 0, 0, size, size);
  }
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: size,
    height: size,
  };
}
