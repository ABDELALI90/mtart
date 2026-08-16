import { hexToRgb, rgbToHex } from '@/features/color/hex';
import {
  averageMaskHex,
  clonePixels,
  copyPixelBuffer,
  expandTinySelection,
  getPixel,
  paintHighlight,
  recolorMask,
  restoreMask,
  type ImageColorMode,
  type PixelBuffer,
} from './imageColor';
import { loadHtmlImage } from './cropImage';

const HISTORY_LIMIT = 12;

interface CachedRegion {
  id: string;
  mask: Uint8Array;
  indices: number[];
}

interface ImageSession {
  original: Uint8ClampedArray;
  edited: Uint8ClampedArray;
  preview: Uint8ClampedArray | null;
  width: number;
  height: number;
  history: Uint8ClampedArray[];
  future: Uint8ClampedArray[];
  mask: Uint8Array | null;
  indices: number[];
  regionMasks: Map<string, CachedRegion>;
  regionColors: Record<string, string>;
  activeRegionId: string | null;
  seed: { x: number; y: number; r: number; g: number; b: number } | null;
  showOverlay: boolean;
  textureUrl?: string;
  revision: number;
}

const sessions = new Map<string, ImageSession>();
const listeners = new Map<string, Set<() => void>>();

function notify(id: string) {
  const session = sessions.get(id);
  if (session) {
    session.revision += 1;
  }
  listeners.get(id)?.forEach((listener) => listener());
}

function expectedPixelLength(width: number, height: number) {
  return Math.max(0, width) * Math.max(0, height) * 4;
}

function buffersMatch(session: ImageSession) {
  const length = expectedPixelLength(session.width, session.height);
  return session.width > 0
    && session.height > 0
    && session.original.length === length
    && session.edited.length === length
    && (!session.preview || session.preview.length === length);
}

function usableIndices(session: ImageSession) {
  const limit = session.width * session.height;
  return session.indices.filter((index) => index >= 0 && index < limit);
}

function writePixels(ctx: CanvasRenderingContext2D, pixels: Uint8ClampedArray, width: number, height: number) {
  if (!ctx || width <= 0 || height <= 0) {
    return;
  }
  try {
    if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    }
    const imageData = ctx.createImageData(width, height);
    copyPixelBuffer(imageData.data, pixels);
    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error('Color apply failed', error);
  }
}

function bufferOf(session: ImageSession, pixels: Uint8ClampedArray): PixelBuffer {
  return { data: pixels, width: session.width, height: session.height };
}

function displayPixels(session: ImageSession) {
  return session.preview ?? session.edited;
}

function canvasFrom(session: ImageSession, pixels: Uint8ClampedArray) {
  const canvas = document.createElement('canvas');
  canvas.width = session.width;
  canvas.height = session.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return undefined;
  }
  writePixels(ctx, pixels, session.width, session.height);
  return canvas;
}

function refreshTexture(session: ImageSession) {
  if (typeof document === 'undefined') {
    return;
  }
  const canvas = canvasFrom(session, session.edited);
  if (!canvas) {
    return;
  }
  if (session.textureUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(session.textureUrl);
  }
  session.textureUrl = canvas.toDataURL('image/png');
}

function commitPendingPreview(session: ImageSession) {
  if (!session.preview) {
    return;
  }
  session.history.push(clonePixels(session.edited));
  if (session.history.length > HISTORY_LIMIT) {
    session.history.shift();
  }
  session.future = [];
  copyPixelBuffer(session.edited, session.preview);
  session.preview = null;
  refreshTexture(session);
}

function regionAtPoint(session: ImageSession, x: number, y: number) {
  const index = Math.floor(y) * session.width + Math.floor(x);
  for (const region of session.regionMasks.values()) {
    if (region.mask[index]) {
      return region;
    }
  }
  return null;
}

function cacheRegion(session: ImageSession, mask: Uint8Array, indices: number[]) {
  const existing = [...session.regionMasks.values()].find((region) => region.indices.length === indices.length
    && region.indices[0] === indices[0]
    && region.indices[region.indices.length - 1] === indices[indices.length - 1]);
  if (existing) {
    return existing;
  }
  const region: CachedRegion = {
    id: `region-${session.regionMasks.size + 1}`,
    mask,
    indices,
  };
  session.regionMasks.set(region.id, region);
  return region;
}

export function subscribeImageSession(id: string, listener: () => void) {
  const set = listeners.get(id) ?? new Set();
  set.add(listener);
  listeners.set(id, set);
  return () => {
    set.delete(listener);
  };
}

export function getImageSession(id: string) {
  return sessions.get(id);
}

export function getImageTextureUrl(id: string) {
  return sessions.get(id)?.textureUrl;
}

export function getImageRevision(id: string) {
  return sessions.get(id)?.revision ?? 0;
}

export function canUndoImage(id: string) {
  return (sessions.get(id)?.history.length ?? 0) > 0;
}

export function canRedoImage(id: string) {
  return (sessions.get(id)?.future.length ?? 0) > 0;
}

function createSession(width: number, height: number, pixels: Uint8ClampedArray): ImageSession {
  return {
    original: clonePixels(pixels),
    edited: clonePixels(pixels),
    preview: null,
    width,
    height,
    history: [],
    future: [],
    mask: null,
    indices: [],
    regionMasks: new Map(),
    regionColors: {},
    activeRegionId: null,
    seed: null,
    showOverlay: false,
    revision: 1,
  };
}

export function installImageSession(id: string, width: number, height: number, pixels: Uint8ClampedArray) {
  const session = createSession(width, height, pixels);
  refreshTexture(session);
  sessions.set(id, session);
  return session;
}

export async function ensureImageSession(id: string, sourceUrl: string) {
  const existing = sessions.get(id);
  if (existing) {
    return existing;
  }
  const image = await loadHtmlImage(sourceUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('unavailable');
  }
  ctx.drawImage(image, 0, 0, width, height);
  const session = createSession(width, height, ctx.getImageData(0, 0, width, height).data);
  refreshTexture(session);
  sessions.set(id, session);
  notify(id);
  return session;
}

export function selectImageSurface(id: string, x: number, y: number, tolerance: number, matching: boolean) {
  try {
    const session = sessions.get(id);
    if (!session || !buffersMatch(session)) {
      return null;
    }
    commitPendingPreview(session);
    const px = Math.max(0, Math.min(session.width - 1, Math.floor(x)));
    const py = Math.max(0, Math.min(session.height - 1, Math.floor(y)));
    const cached = !matching ? regionAtPoint(session, px, py) : null;
    const selected = cached ?? expandTinySelection(bufferOf(session, session.original), px, py, tolerance, matching);
    const region = cached ?? cacheRegion(session, selected.mask, selected.indices);
    session.mask = region.mask;
    session.indices = region.indices;
    session.indices = usableIndices(session);
    session.activeRegionId = region.id;
    session.showOverlay = true;
    const seed = getPixel(session.edited, session.width, px, py);
    session.seed = { x: px, y: py, ...seed };
    const average = averageMaskHex(bufferOf(session, session.edited), session.indices, seed);
    notify(id);
    return {
      count: session.indices.length,
      regionId: region.id,
      seedHex: rgbToHex(average.r, average.g, average.b),
    };
  } catch (error) {
    console.error('Color apply failed', error);
    return null;
  }
}

export function reselectLastImageSurface(id: string, tolerance: number, matching: boolean) {
  const session = sessions.get(id);
  if (!session?.seed) {
    return null;
  }
  const selected = expandTinySelection(
    bufferOf(session, session.original),
    session.seed.x,
    session.seed.y,
    tolerance,
    matching,
  );
  if (selected.indices.length === 0) {
    return {
      count: session.indices.length,
      seedHex: rgbToHex(session.seed.r, session.seed.g, session.seed.b),
    };
  }
  const region = cacheRegion(session, selected.mask, selected.indices);
  session.mask = region.mask;
  session.indices = region.indices;
  session.activeRegionId = region.id;
  session.showOverlay = true;
  notify(id);
  return {
    count: region.indices.length,
    seedHex: rgbToHex(session.seed.r, session.seed.g, session.seed.b),
  };
}

function clearTemporarySelection(session: ImageSession, keepMask = false) {
  session.showOverlay = false;
  if (keepMask) {
    return;
  }
  session.mask = null;
  session.indices = [];
  session.activeRegionId = null;
}

function saveEditedState(session: ImageSession) {
  session.history.push(clonePixels(session.edited));
  if (session.history.length > HISTORY_LIMIT) {
    session.history.shift();
  }
  session.future = [];
  if (session.preview) {
    copyPixelBuffer(session.edited, session.preview);
  }
  session.preview = null;
  refreshTexture(session);
}

function paintSelectedColor(session: ImageSession, hex: string, mode: ImageColorMode) {
  const rgb = hexToRgb(hex);
  const indices = usableIndices(session);
  if (!rgb || !session.mask || indices.length === 0 || !buffersMatch(session)) {
    return false;
  }
  session.indices = indices;
  if (!session.preview || session.preview.length !== session.edited.length) {
    session.preview = clonePixels(session.edited);
  }
  recolorMask(
    bufferOf(session, session.edited),
    bufferOf(session, session.preview),
    session.indices,
    rgb,
    mode,
  );
  if (session.activeRegionId) {
    session.regionColors[session.activeRegionId] = hex;
  }
  return true;
}

export function previewImageColor(id: string, hex: string, mode: ImageColorMode) {
  try {
    const session = sessions.get(id);
    if (!session) {
      console.error('Color apply failed', { reason: 'no-session', id });
      return;
    }
    if (!paintSelectedColor(session, hex, mode)) {
      console.error('Color apply failed', { reason: 'no-mask', id, mask: session.indices.length });
      return;
    }
    notify(id);
  } catch (error) {
    console.error('Color apply failed', error);
  }
}

export function applyImageColor(id: string, hex: string, mode: ImageColorMode) {
  try {
    const session = sessions.get(id);
    if (!session || !buffersMatch(session)) {
      console.error('Color apply failed', { reason: 'no-session', id });
      return false;
    }
    if (!hexToRgb(hex)) {
      console.error('Color apply failed', { reason: 'invalid-color', id, hex });
      return false;
    }
    if (!paintSelectedColor(session, hex, mode) && !session.preview) {
      console.error('Color apply failed', { reason: 'no-mask', id, mask: session.indices.length });
      return false;
    }
    saveEditedState(session);
    clearTemporarySelection(session);
    notify(id);
    return true;
  } catch (error) {
    console.error('Color apply failed', error);
    return false;
  }
}

export function commitImagePreview(id: string, hex?: string, mode: ImageColorMode = 'texture') {
  if (hex) {
    return applyImageColor(id, hex, mode);
  }
  const session = sessions.get(id);
  if (!session) {
    return false;
  }
  commitPendingPreview(session);
  clearTemporarySelection(session);
  notify(id);
  return true;
}

export function clearImageSelection(id: string) {
  const session = sessions.get(id);
  if (!session) {
    return;
  }
  clearTemporarySelection(session, true);
  notify(id);
}

export function cancelImagePreview(id: string) {
  const session = sessions.get(id);
  if (!session) {
    return;
  }
  session.preview = null;
  clearTemporarySelection(session);
  notify(id);
}

export function resetImageArea(id: string) {
  const session = sessions.get(id);
  if (!session || session.indices.length === 0) {
    return;
  }
  session.history.push(clonePixels(session.edited));
  if (session.history.length > HISTORY_LIMIT) {
    session.history.shift();
  }
  session.future = [];
  restoreMask(bufferOf(session, session.original), bufferOf(session, session.edited), session.indices);
  session.preview = null;
  if (session.activeRegionId) {
    delete session.regionColors[session.activeRegionId];
  }
  refreshTexture(session);
  notify(id);
}

export function resetImageAll(id: string) {
  const session = sessions.get(id);
  if (!session) {
    return;
  }
  session.history.push(clonePixels(session.edited));
  if (session.history.length > HISTORY_LIMIT) {
    session.history.shift();
  }
  session.future = [];
  copyPixelBuffer(session.edited, session.original);
  session.preview = null;
  session.mask = null;
  session.indices = [];
  session.activeRegionId = null;
  session.regionColors = {};
  refreshTexture(session);
  notify(id);
}

export function undoImageEdit(id: string) {
  const session = sessions.get(id);
  if (!session || session.history.length === 0) {
    return;
  }
  session.preview = null;
  session.future.push(clonePixels(session.edited));
  const previous = session.history.pop();
  if (previous) {
    copyPixelBuffer(session.edited, previous);
  }
  session.mask = null;
  session.indices = [];
  session.activeRegionId = null;
  refreshTexture(session);
  notify(id);
}

export function redoImageEdit(id: string) {
  const session = sessions.get(id);
  if (!session || session.future.length === 0) {
    return;
  }
  session.preview = null;
  session.history.push(clonePixels(session.edited));
  const next = session.future.pop();
  if (next) {
    copyPixelBuffer(session.edited, next);
  }
  session.mask = null;
  session.indices = [];
  session.activeRegionId = null;
  refreshTexture(session);
  notify(id);
}

export function drawImageSession(
  ctx: CanvasRenderingContext2D,
  id: string,
  _highlight = false,
) {
  try {
    const session = sessions.get(id);
    if (!session || !ctx) {
      return false;
    }
    writePixels(ctx, displayPixels(session), session.width, session.height);
    return true;
  } catch (error) {
    console.error('Color apply failed', error);
    return false;
  }
}

export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  id: string,
) {
  try {
    const session = sessions.get(id);
    if (!session || !ctx) {
      return false;
    }
    if (ctx.canvas.width !== session.width || ctx.canvas.height !== session.height) {
      ctx.canvas.width = session.width;
      ctx.canvas.height = session.height;
    }
    ctx.clearRect(0, 0, session.width, session.height);
    if (!session.showOverlay || !session.mask || session.indices.length === 0) {
      return true;
    }
    const imageData = ctx.createImageData(session.width, session.height);
    const indices = usableIndices(session);
    paintHighlight(imageData.data, indices, { r: 15, g: 76, b: 92 });
    for (const index of indices) {
      const alpha = index * 4 + 3;
      if (alpha < imageData.data.length) {
        imageData.data[alpha] = 96;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return true;
  } catch (error) {
    console.error('Color apply failed', error);
    return false;
  }
}
