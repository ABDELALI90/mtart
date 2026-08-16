import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TILE_SCALE,
  FLOOR_ATLAS_MAX,
  FLOOR_ATLAS_MIN,
  ROOM_FLOOR_PERCENT,
  ROOM_WALL_PERCENT,
  TILE_RASTER_MIN,
  atlasCellSize,
  perspectiveFloorT,
  svgForRaster,
  tileRasterSize,
  tileScaleForCm,
  tilesAcrossForCm,
  tilesDeepForCm,
} from './tileTexture';

describe('tile scale', () => {
  it('uses a large default module, not a micro-repeat', () => {
    expect(DEFAULT_TILE_SCALE).toBe(1);
    expect(tileScaleForCm(20)).toBe(1);
    expect(tilesAcrossForCm(20)).toBe(6);
  });

  it('keeps foreground tiles in a readable range', () => {
    expect(tilesAcrossForCm(30)).toBeGreaterThanOrEqual(3);
    expect(tilesAcrossForCm(30)).toBeLessThanOrEqual(4);
    expect(tilesAcrossForCm(20)).toBeGreaterThanOrEqual(5);
    expect(tilesAcrossForCm(20)).toBeLessThanOrEqual(6);
    expect(tilesAcrossForCm(10)).toBeGreaterThanOrEqual(8);
    expect(tilesAcrossForCm(10)).toBeLessThanOrEqual(10);
    expect(tilesAcrossForCm(10)).toBeLessThanOrEqual(FLOOR_ATLAS_MAX);
    expect(tilesAcrossForCm(30)).toBeGreaterThanOrEqual(FLOOR_ATLAS_MIN);
  });

  it('shows more tiles for smaller formats', () => {
    expect(tilesAcrossForCm(10)).toBeGreaterThan(tilesAcrossForCm(20));
    expect(tilesAcrossForCm(30)).toBeLessThan(tilesAcrossForCm(20));
  });

  it('gives the floor most of the lower preview', () => {
    expect(ROOM_WALL_PERCENT).toBeLessThanOrEqual(35);
    expect(ROOM_FLOOR_PERCENT).toBeGreaterThanOrEqual(65);
    expect(ROOM_WALL_PERCENT + ROOM_FLOOR_PERCENT).toBe(100);
  });

  it('compresses floor rows toward the back wall', () => {
    expect(perspectiveFloorT(0)).toBe(0);
    expect(perspectiveFloorT(1)).toBe(1);
    expect(perspectiveFloorT(0.5)).toBeGreaterThan(0.5);
    expect(tilesDeepForCm(20)).toBeGreaterThanOrEqual(7);
    expect(tilesDeepForCm(20)).toBeLessThanOrEqual(12);
    expect(tilesDeepForCm(10)).toBeGreaterThan(tilesDeepForCm(30));
  });

  it('gives rasterized SVG an explicit pixel size so Image() is not 0x0', () => {
    const raster = svgForRaster('<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 200 200"></svg>', 512);
    expect(raster).toContain('width="512"');
    expect(raster).toContain('height="512"');
    expect(raster).not.toContain('width="100%"');
  });

  it('renders source tiles at high resolution instead of stretching a tiny bitmap', () => {
    expect(TILE_RASTER_MIN).toBeGreaterThanOrEqual(1024);
    expect(tileRasterSize(false)).toBeGreaterThanOrEqual(1024);
    expect(atlasCellSize(1024, 1200, 6, 6, 8)).toBeGreaterThanOrEqual(512);
    expect(atlasCellSize(1024, 1200, 6, 6, 8)).toBeGreaterThan(160);
  });

  it('reduces repeat count on compact screens', () => {
    expect(tilesAcrossForCm(10, true)).toBeLessThanOrEqual(6);
    expect(tilesAcrossForCm(10, true)).toBeLessThanOrEqual(tilesAcrossForCm(10, false));
  });
});
