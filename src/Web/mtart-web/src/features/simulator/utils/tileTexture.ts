import { loadSvgMarkup, paintSvgMarkup, prepareSvgMarkup } from './svgPaint';

/** Default visual scale: 20 cm tiles fill the floor with a large, readable module. */
export const DEFAULT_TILE_SCALE = 1.0;
export const FLOOR_ATLAS_MIN = 3;
export const FLOOR_ATLAS_MAX = 12;
export const FLOOR_ATLAS_DEFAULT = 6;
export const TILE_RASTER_MIN = 1024;
export const TILE_RASTER_MAX = 2048;
const ATLAS_MAX_PIXELS = 16_000_000;
/** Back edge of the floor trapezoid, as a fraction of preview width. */
export const FLOOR_BACK_WIDTH = 0.46;

/** Wall vs floor split inside the room preview (percent of preview height). */
export const ROOM_WALL_PERCENT = 30;
export const ROOM_FLOOR_PERCENT = 70;

export function tileScaleForCm(cm: number): number {
  return DEFAULT_TILE_SCALE * (Math.max(8, cm) / 20);
}

export function tilesAcrossForCm(cm: number, compact = false): number {
  const byFormat: Record<number, number> = {
    30: 4,
    25: 5,
    20: 6,
    15: 8,
    10: 10,
  };
  let across = byFormat[cm] ?? Math.round(FLOOR_ATLAS_DEFAULT / tileScaleForCm(cm));
  across = Math.max(FLOOR_ATLAS_MIN, Math.min(FLOOR_ATLAS_MAX, across));
  if (compact) {
    across = Math.max(FLOOR_ATLAS_MIN, Math.min(6, across));
  }
  return across;
}

export function tilesDeepForCm(cm: number, compact = false): number {
  const across = tilesAcrossForCm(cm, compact);
  return Math.max(7, Math.min(12, across + 3));
}

/** Screen t=0 at the back wall, t=1 at the front edge. Returns 0–1 along the floor. */
export function perspectiveFloorT(u: number, zNear = 1, zFar = 4.2): number {
  const t = Math.max(0, Math.min(1, u));
  const z = (zFar * zNear) / (zNear + t * (zFar - zNear));
  return (zFar - z) / (zFar - zNear);
}

export function devicePixelRatioSafe() {
  if (typeof window === 'undefined') {
    return 1;
  }
  return Math.min(3, window.devicePixelRatio || 1);
}

export function tileRasterSize(_compact = false) {
  const dpr = devicePixelRatioSafe();
  const scaled = Math.round(TILE_RASTER_MIN * Math.min(Math.max(dpr, 1), 2));
  return Math.max(TILE_RASTER_MIN, Math.min(TILE_RASTER_MAX, scaled));
}

export function atlasCellSize(tilePx: number, destW: number, across: number, cols: number, depth: number) {
  const dpr = devicePixelRatioSafe();
  const needed = Math.ceil((Math.max(1, destW) * dpr) / Math.max(across, 1));
  let cell = Math.max(512, Math.min(TILE_RASTER_MAX, Math.max(Math.min(tilePx || TILE_RASTER_MIN, TILE_RASTER_MAX), needed)));
  const pixels = cell * cols * cell * depth;
  if (pixels > ATLAS_MAX_PIXELS) {
    cell = Math.max(384, Math.floor(Math.sqrt(ATLAS_MAX_PIXELS / Math.max(1, cols * depth))));
  }
  return cell;
}

function sourceTileSize(tile: CanvasImageSource) {
  if (tile instanceof HTMLImageElement) {
    return tile.naturalWidth || tile.width || TILE_RASTER_MIN;
  }
  if (tile instanceof HTMLCanvasElement) {
    return tile.width || TILE_RASTER_MIN;
  }
  return TILE_RASTER_MIN;
}

export function buildColoredSvg(markup: string, regionColors: Record<string, string>, reference?: string) {
  return paintSvgMarkup(prepareSvgMarkup(markup, reference), regionColors, {});
}

export function svgForRaster(markup: string, size: number) {
  let next = markup.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
  if (/<svg\b/i.test(next)) {
    next = next.replace(/<svg\b/i, `<svg width="${size}" height="${size}"`);
  }
  if (!/viewBox=/i.test(next)) {
    next = next.replace(/<svg\b/i, `<svg viewBox="0 0 ${size} ${size}"`);
  }
  if (!/xmlns=/.test(next)) {
    next = next.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return next;
}

function loadSvgImage(markup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    const finish = (error?: Error) => {
      URL.revokeObjectURL(url);
      if (error) {
        reject(error);
        return;
      }
      resolve(image);
    };
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        console.error('Preview SVG failed', { naturalWidth: image.naturalWidth, svgLength: markup.length });
        finish(new Error('Preview SVG failed: empty image'));
        return;
      }
      finish();
    };
    image.onerror = (error) => {
      console.error('Preview SVG failed', error);
      finish(new Error('Preview SVG failed'));
    };
    image.src = url;
  });
}

export function drawFallbackTileGrid(
  ctx: CanvasRenderingContext2D,
  tile: CanvasImageSource,
  destW: number,
  destH: number,
  across = 4,
) {
  const cols = Math.max(2, Math.min(8, Math.round(across)));
  const cell = Math.max(1, Math.floor(Math.min(destW, destH) / cols));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (let row = 0; row < cols; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.drawImage(tile, col * cell, row * cell, cell, cell);
    }
  }
}

function clipFloorTrapezoid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backWidth: number,
) {
  const backLeft = (width - backWidth) / 2;
  ctx.beginPath();
  ctx.moveTo(backLeft, 0);
  ctx.lineTo(backLeft + backWidth, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
}

function shadePerspectiveFloor(ctx: CanvasRenderingContext2D, width: number, height: number, backWidth: number) {
  ctx.save();
  clipFloorTrapezoid(ctx, width, height, backWidth);
  ctx.clip();

  const depth = ctx.createLinearGradient(0, 0, 0, height);
  depth.addColorStop(0, 'rgba(42, 32, 22, 0.34)');
  depth.addColorStop(0.22, 'rgba(42, 32, 22, 0.16)');
  depth.addColorStop(0.55, 'rgba(42, 32, 22, 0.04)');
  depth.addColorStop(0.78, 'rgba(255, 252, 246, 0.07)');
  depth.addColorStop(1, 'rgba(28, 22, 16, 0.14)');
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, width, height);

  const sides = ctx.createLinearGradient(0, 0, width, 0);
  sides.addColorStop(0, 'rgba(28, 22, 16, 0.18)');
  sides.addColorStop(0.18, 'rgba(28, 22, 16, 0)');
  sides.addColorStop(0.82, 'rgba(28, 22, 16, 0)');
  sides.addColorStop(1, 'rgba(28, 22, 16, 0.18)');
  ctx.fillStyle = sides;
  ctx.fillRect(0, 0, width, height);

  const highlight = ctx.createLinearGradient(width * 0.18, height * 0.58, width * 0.82, height * 0.96);
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0)');
  highlight.addColorStop(0.45, 'rgba(255, 255, 255, 0.06)');
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawPerspectiveFloor(
  ctx: CanvasRenderingContext2D,
  tile: CanvasImageSource,
  destW: number,
  destH: number,
  across: number,
  rows: number,
) {
  try {
    const width = Math.max(1, Math.floor(destW));
    const height = Math.max(1, Math.floor(destH));
    const cols = Math.max(FLOOR_ATLAS_MIN, Math.min(FLOOR_ATLAS_MAX, Math.round(across)));
    const depth = Math.max(7, Math.min(12, Math.round(rows)));
    const cell = atlasCellSize(sourceTileSize(tile), width, across, cols, depth);
    const grout = Math.max(2, Math.round(cell * 0.028));
    const source = document.createElement('canvas');
    source.width = cell * cols;
    source.height = cell * depth;
    const sourceCtx = source.getContext('2d');
    if (!sourceCtx || !source.width || !source.height) {
      throw new Error('atlas canvas unavailable');
    }
    sourceCtx.imageSmoothingEnabled = true;
    sourceCtx.imageSmoothingQuality = 'high';
    sourceCtx.fillStyle = '#cfc6b8';
    sourceCtx.fillRect(0, 0, source.width, source.height);
    for (let row = 0; row < depth; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        sourceCtx.drawImage(
          tile,
          col * cell + grout,
          row * cell + grout,
          cell - grout,
          cell - grout,
        );
      }
    }

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const backWidth = width * FLOOR_BACK_WIDTH;
    const frontWidth = width;
    let prevV = 0;
    for (let y = 0; y < height; y += 1) {
      const u = y / Math.max(height - 1, 1);
      const v = perspectiveFloorT(u, 1, 5.2);
      const srcY = Math.min(source.height - 1, Math.max(0, prevV * source.height));
      const srcH = Math.min(source.height - srcY, Math.max(1, (v - prevV) * source.height));
      const lineWidth = backWidth + (frontWidth - backWidth) * u;
      const x0 = (width - lineWidth) / 2;
      ctx.drawImage(source, 0, srcY, source.width, srcH, x0, y, lineWidth, 1.25);
      prevV = v;
    }
    shadePerspectiveFloor(ctx, width, height, backWidth);
  } catch (error) {
    console.error('Preview render failed', error);
    drawFallbackTileGrid(ctx, tile, destW, destH, 4);
  }
}

export async function renderTileTexture(
  svgSrc: string,
  regionColors: Record<string, string>,
  rotation = 0,
  resolution?: number,
): Promise<HTMLCanvasElement> {
  const size = Math.max(TILE_RASTER_MIN, Math.min(TILE_RASTER_MAX, Math.round(resolution ?? tileRasterSize())));
  const markup = await loadSvgMarkup(svgSrc);
  const painted = svgForRaster(buildColoredSvg(markup, regionColors, svgSrc), size);
  if (import.meta.env.DEV) {
    console.log({
      selectedMouldId: svgSrc,
      svgLength: painted.length,
      regionCount: Object.keys(regionColors).length,
      regionColors,
      textureWidth: size,
      textureHeight: size,
      previewMode: 'texture',
    });
  }
  const image = await loadSvgImage(painted);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('tile canvas unavailable');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const radians = (rotation * Math.PI) / 180;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
  return canvas;
}

export async function rasterImageTextureUrl(
  imageSrc: string,
  rotation = 0,
  cells = 1,
  resolution?: number,
): Promise<string> {
  try {
    const size = Math.max(TILE_RASTER_MIN, Math.min(TILE_RASTER_MAX, Math.round(resolution ?? tileRasterSize())));
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image();
      next.onload = () => {
        if (!next.naturalWidth) {
          reject(new Error('Preview render failed: empty image'));
          return;
        }
        resolve(next);
      };
      next.onerror = () => reject(new Error('Preview render failed'));
      next.src = imageSrc;
    });
    if (import.meta.env.DEV) {
      console.log({
        selectedMouldId: imageSrc.slice(0, 48),
        svgLength: imageSrc.length,
        regionCount: 0,
        regionColors: {},
        textureWidth: size,
        textureHeight: size,
        previewMode: 'image-texture',
      });
    }
    const tile = document.createElement('canvas');
    tile.width = size;
    tile.height = size;
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) {
      throw new Error('tile canvas unavailable');
    }
    tileCtx.imageSmoothingEnabled = true;
    tileCtx.imageSmoothingQuality = 'high';
    tileCtx.fillStyle = '#ffffff';
    tileCtx.fillRect(0, 0, size, size);
    tileCtx.save();
    tileCtx.translate(size / 2, size / 2);
    tileCtx.rotate((rotation * Math.PI) / 180);
    tileCtx.drawImage(image, -size / 2, -size / 2, size, size);
    tileCtx.restore();
    const grid = Math.max(1, Math.min(FLOOR_ATLAS_MAX, Math.round(cells)));
    if (grid === 1) {
      return tile.toDataURL('image/png');
    }
    const canvas = document.createElement('canvas');
    canvas.width = tile.width * grid;
    canvas.height = tile.height * grid;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return tile.toDataURL('image/png');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        ctx.drawImage(tile, x * tile.width, y * tile.height);
      }
    }
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Preview render failed', error);
    throw error;
  }
}

export async function tileTextureUrl(
  svgSrc: string,
  regionColors: Record<string, string>,
  rotation: number,
  cells = FLOOR_ATLAS_DEFAULT,
  resolution?: number,
): Promise<string> {
  try {
    const tile = await renderTileTexture(svgSrc, regionColors, rotation, resolution);
    const grid = Math.max(1, Math.min(FLOOR_ATLAS_MAX, Math.round(cells)));
    if (grid === 1) {
      return tile.toDataURL('image/png');
    }
    const cell = tile.width;
    const canvas = document.createElement('canvas');
    canvas.width = cell * grid;
    canvas.height = cell * grid;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return tile.toDataURL('image/png');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        ctx.drawImage(tile, x * cell, y * cell, cell, cell);
      }
    }
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Preview render failed', error);
    const fallback = await renderTileTexture(svgSrc, regionColors, rotation, 256);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return fallback.toDataURL('image/png');
    }
    drawFallbackTileGrid(ctx, fallback, 1024, 1024, 4);
    return canvas.toDataURL('image/png');
  }
}
