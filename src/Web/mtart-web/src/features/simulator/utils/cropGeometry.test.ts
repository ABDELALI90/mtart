import { describe, expect, it } from 'vitest';
import { clampCrop, containRect, initialCrop, quadToPixels } from './cropGeometry';

describe('crop geometry', () => {
  it('maps a contained image without stretching', () => {
    const box = containRect(1000, 500, 400, 400);
    expect(box.w).toBeCloseTo(400);
    expect(box.h).toBeCloseTo(200);
    expect(box.y).toBeCloseTo(100);
  });

  it('keeps a square crop inside the image', () => {
    const crop = clampCrop({ x: 900, y: 900, size: 400 }, 1000, 800);
    expect(crop.size).toBe(400);
    expect(crop.x + crop.size).toBeLessThanOrEqual(1000);
    expect(crop.y + crop.size).toBeLessThanOrEqual(800);
  });

  it('starts with a centered square', () => {
    const crop = initialCrop(800, 600);
    expect(crop.size).toBeGreaterThan(400);
    expect(crop.x).toBeGreaterThan(0);
    expect(crop.y).toBeGreaterThan(0);
  });

  it('converts normalized corners into crop pixels', () => {
    const quad = quadToPixels(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      { x: 10, y: 20, size: 100 },
    );
    expect(quad).toEqual([
      [10, 20],
      [110, 20],
      [110, 120],
      [10, 120],
    ]);
  });
});
