import { describe, expect, it } from 'vitest';
import { isUploadedImageMould } from '../api/customMouldApi';
import {
  colorsSimilar,
  floodFillMask,
  labDistance,
  recolorMask,
  rgbToLab,
  similarColorMask,
  type PixelBuffer,
} from './imageColor';

function buffer(width: number, height: number, fill: [number, number, number]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

function setRect(target: PixelBuffer, x: number, y: number, w: number, h: number, rgb: [number, number, number]) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      const i = (row * target.width + col) * 4;
      target.data[i] = rgb[0];
      target.data[i + 1] = rgb[1];
      target.data[i + 2] = rgb[2];
    }
  }
}

describe('image color engine', () => {
  it('treats identical colors as zero LAB distance', () => {
    const color = { r: 20, g: 40, b: 80 };
    expect(labDistance(rgbToLab(color), rgbToLab(color))).toBe(0);
    expect(colorsSimilar(color, { r: 24, g: 44, b: 84 }, 20)).toBe(true);
  });

  it('flood-fills only the connected surface', () => {
    const image = buffer(20, 10, [255, 255, 255]);
    setRect(image, 1, 1, 6, 6, [20, 40, 120]);
    setRect(image, 12, 1, 6, 6, [20, 40, 120]);
    const connected = floodFillMask(image, 3, 3, 18);
    expect(connected.indices.length).toBe(36);
    expect(connected.mask[1 * 20 + 2]).toBe(1);
    expect(connected.mask[1 * 20 + 14]).toBe(0);
  });

  it('can select all similar disconnected surfaces', () => {
    const image = buffer(20, 10, [255, 255, 255]);
    setRect(image, 1, 1, 6, 6, [20, 40, 120]);
    setRect(image, 12, 1, 6, 6, [20, 40, 120]);
    const all = similarColorMask(image, { r: 20, g: 40, b: 120 }, 18);
    expect(all.indices.length).toBe(72);
  });

  it('recolors only the mask and keeps relative shading in texture mode', () => {
    const image = buffer(8, 8, [255, 255, 255]);
    setRect(image, 0, 0, 4, 8, [10, 20, 90]);
    setRect(image, 0, 0, 4, 4, [40, 60, 140]);
    const { indices } = floodFillMask(image, 1, 1, 40);
    const dest = { data: new Uint8ClampedArray(image.data), width: 8, height: 8 };
    recolorMask(image, dest, indices, { r: 190, g: 70, b: 60 }, 'texture');
    const light = dest.data[1 * 4];
    const dark = dest.data[(5 * 8 + 1) * 4];
    expect(light).toBeGreaterThan(dark);
    expect(dest.data[(0 * 8 + 6) * 4]).toBe(255);
    expect(dest.data[(0 * 8 + 6) * 4 + 1]).toBe(255);
  });

  it('treats customer uploads as image designs, not SVG moulds', () => {
    expect(isUploadedImageMould({ kind: 'uploaded-image', svgUrl: '' })).toBe(true);
    expect(isUploadedImageMould({ kind: 'svg', svgUrl: '/moulds/moroccan/MOR-017.svg' })).toBe(false);
    expect(isUploadedImageMould({ svgUrl: '/moulds/custom.svg' })).toBe(false);
  });

  it('writes the chosen color onto a saved mask without touching other pixels', () => {
    const image = buffer(8, 8, [220, 40, 40]);
    setRect(image, 4, 0, 4, 8, [250, 250, 250]);
    const { mask, indices } = floodFillMask(image, 1, 1, 20);
    expect(mask[1]).toBe(1);
    expect(mask[4]).toBe(0);
    const dest = { data: new Uint8ClampedArray(image.data), width: 8, height: 8 };
    recolorMask(image, dest, indices, { r: 42, g: 74, b: 238 }, 'flat');
    expect(dest.data[0]).toBe(42);
    expect(dest.data[1]).toBe(74);
    expect(dest.data[2]).toBe(238);
    expect(dest.data[4 * 4]).toBe(250);
  });

  it('paints a flat color only on the selected mask', () => {
    const image = buffer(6, 6, [250, 250, 250]);
    setRect(image, 0, 0, 3, 6, [30, 80, 160]);
    const { indices } = floodFillMask(image, 1, 1, 10);
    const dest = { data: new Uint8ClampedArray(image.data), width: 6, height: 6 };
    recolorMask(image, dest, indices, { r: 10, g: 200, b: 30 }, 'flat');
    expect(dest.data[0]).toBe(10);
    expect(dest.data[1]).toBe(200);
    expect(dest.data[2]).toBe(30);
    expect(dest.data[(0 * 6 + 5) * 4]).toBe(250);
  });
});
