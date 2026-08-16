export interface ContainRect {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export interface PixelCrop {
  x: number;
  y: number;
  size: number;
}

export interface QuadPoint {
  x: number;
  y: number;
}

export function containRect(naturalW: number, naturalH: number, boxW: number, boxH: number): ContainRect {
  const scale = Math.min(boxW / Math.max(naturalW, 1), boxH / Math.max(naturalH, 1));
  const w = naturalW * scale;
  const h = naturalH * scale;
  return {
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
    w,
    h,
    scale,
  };
}

export function clampCrop(crop: PixelCrop, naturalW: number, naturalH: number): PixelCrop {
  const maxSize = Math.max(32, Math.min(naturalW, naturalH));
  const size = Math.min(maxSize, Math.max(32, crop.size));
  return {
    x: Math.min(Math.max(0, crop.x), Math.max(0, naturalW - size)),
    y: Math.min(Math.max(0, crop.y), Math.max(0, naturalH - size)),
    size,
  };
}

export function initialCrop(naturalW: number, naturalH: number): PixelCrop {
  const side = Math.min(naturalW, naturalH);
  const size = Math.max(32, Math.round(side * 0.84));
  return clampCrop(
    {
      x: Math.round((naturalW - size) / 2),
      y: Math.round((naturalH - size) / 2),
      size,
    },
    naturalW,
    naturalH,
  );
}

export function cropToBox(crop: PixelCrop, contain: ContainRect) {
  return {
    x: contain.x + crop.x * contain.scale,
    y: contain.y + crop.y * contain.scale,
    size: crop.size * contain.scale,
  };
}

export function defaultQuad(): QuadPoint[] {
  return [
    { x: 0.04, y: 0.04 },
    { x: 0.96, y: 0.04 },
    { x: 0.96, y: 0.96 },
    { x: 0.04, y: 0.96 },
  ];
}

export function quadToPixels(quad: QuadPoint[], crop: PixelCrop): number[][] {
  return quad.map((point) => [
    crop.x + point.x * crop.size,
    crop.y + point.y * crop.size,
  ]);
}

export function isDefaultQuad(quad: QuadPoint[]): boolean {
  const fallback = defaultQuad();
  return quad.every((point, index) => Math.abs(point.x - fallback[index].x) < 0.02 && Math.abs(point.y - fallback[index].y) < 0.02);
}
