import { TRACE_STROKE } from './regionDetect';

const TRACE_SELECTORS = '#tracing path, #tracing polygon, #tracing polyline, #tracing line, #tracing circle, #tracing ellipse, .mould-outlines path, .mould-outlines polygon, .mould-outlines polyline';
const MIN_INK_RATIO = 0.008;

function isNearWhite(color: string) {
  const value = color.trim().toLowerCase();
  return !value
    || value === 'none'
    || value === '#fff'
    || value === '#ffffff'
    || value === 'white'
    || value === 'rgb(255,255,255)'
    || value === 'rgb(255, 255, 255)';
}

function hasGeometry(node: Element) {
  const name = node.tagName.toLowerCase().replace(/^svg:/, '');
  if (name === 'path') {
    return Boolean((node.getAttribute('d') ?? '').trim());
  }
  if (name === 'polygon' || name === 'polyline') {
    return Boolean((node.getAttribute('points') ?? '').trim());
  }
  if (name === 'line') {
    return node.hasAttribute('x1') && node.hasAttribute('y1') && node.hasAttribute('x2') && node.hasAttribute('y2');
  }
  if (name === 'circle') {
    return parseFloat(node.getAttribute('r') ?? '0') > 0;
  }
  if (name === 'ellipse') {
    return parseFloat(node.getAttribute('rx') ?? '0') > 0 && parseFloat(node.getAttribute('ry') ?? '0') > 0;
  }
  return false;
}

function resolvedStroke(node: Element) {
  let current: Element | null = node;
  while (current) {
    const stroke = (current.getAttribute('stroke') ?? '').trim();
    if (stroke) {
      return stroke;
    }
    current = current.parentElement;
  }
  return '';
}

export function inspectTracing(markup: string) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  const nodes = [...svg.querySelectorAll(TRACE_SELECTORS)];
  let pathCount = 0;
  let visibleStrokeCount = 0;
  for (const node of nodes) {
    if (!hasGeometry(node)) {
      continue;
    }
    pathCount += 1;
    const stroke = resolvedStroke(node);
    if (stroke && !isNearWhite(stroke)) {
      visibleStrokeCount += 1;
    }
  }
  return {
    pathCount,
    visibleStrokeCount,
    hasVisibleStroke: visibleStrokeCount > 0,
    hasViewBox: Boolean(svg.getAttribute('viewBox')),
  };
}

export function countVisibleTracingPaths(markup: string) {
  return inspectTracing(markup).visibleStrokeCount;
}

export async function measureInkRatio(markup: string, size = 256): Promise<number> {
  if (typeof document === 'undefined') {
    return 0;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return 0;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error('svg-raster'));
    next.src = url;
  });
  ctx.drawImage(image, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  let ink = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) {
      ink += 1;
    }
  }
  return ink / (size * size);
}

export async function validateVisibleMould(markup: string): Promise<{ ok: boolean; reason?: string }> {
  const tracing = inspectTracing(markup);
  if (tracing.pathCount === 0) {
    return { ok: false, reason: 'no-tracing' };
  }
  if (!tracing.hasVisibleStroke) {
    return { ok: false, reason: 'invisible-stroke' };
  }
  try {
    const ratio = await measureInkRatio(markup);
    if (ratio < MIN_INK_RATIO) {
      if (ratio === 0 && tracing.visibleStrokeCount > 0) {
        return { ok: true };
      }
      return { ok: false, reason: 'blank-raster' };
    }
  } catch {
    // Structural tracing is enough when the host cannot rasterize SVG.
  }
  return { ok: true };
}

export function ensureTraceStrokeFallback(markup: string) {
  if (countVisibleTracingPaths(markup) > 0) {
    return markup;
  }
  return markup.replace(
    /id="tracing"/,
    `id="tracing" fill="none" stroke="${TRACE_STROKE}" stroke-width="1.5"`,
  );
}
