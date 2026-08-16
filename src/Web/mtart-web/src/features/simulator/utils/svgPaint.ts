import { DEFAULT_REGION_HEX, resolveColorValue } from '@/features/color/hex';
import { mouldSvgCandidates } from '../data/mouldAssets';
import { ensureColorableSvg, isInsideTracing } from './regionDetect';
import { inspectTracing } from './svgTraceValidate';

const svgCache = new Map<string, Promise<string>>();
const prepareCache = new Map<string, string>();
const PREPARE_CACHE_MAX = 256;

export type PaintMode = 'color' | 'outline';

export const OUTLINE_FILL = '#ffffff';
export const OUTLINE_STROKE = '#707070';
export const ACTIVE_STROKE = '#0F4C5C';

export function regionAppearance(mode: PaintMode, hex: string | undefined, active: boolean) {
  return {
    fill: mode === 'outline' ? OUTLINE_FILL : (hex ?? OUTLINE_FILL),
    stroke: OUTLINE_STROKE,
    strokeWidth: '1.5',
    selected: active,
  };
}

async function fetchFirstSvg(urls: string[], skipCacheFor?: string) {
  let lastError: Error | null = null;
  for (const url of urls) {
    if (url !== skipCacheFor) {
      const existing = svgCache.get(url);
      if (existing) {
        try {
          return await existing;
        } catch {
          /* try the next candidate */
        }
      }
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`SVG ${response.status}: ${url}`);
        continue;
      }
      const text = await response.text();
      if (!text.trim() || isBlankMouldMarkup(text)) {
        lastError = new Error(`Blank mould: ${url}`);
        continue;
      }
      svgCache.set(url, Promise.resolve(text));
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error(`SVG missing: ${urls[0] ?? ''}`);
}

export function loadSvgMarkup(src: string): Promise<string> {
  const cached = svgCache.get(src);
  if (cached) {
    return cached;
  }
  const request = fetchFirstSvg(mouldSvgCandidates(src), src);
  svgCache.set(src, request);
  return request;
}

export function extractSvgRegions(markup: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const matches = markup.matchAll(/data-region(?:-id)?=["']([^"']+)["']/g);
  for (const match of matches) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export function stripDocumentStyles(markup: string): string {
  return markup
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '');
}

export function prepareSvgMarkup(markup: string, reference?: string): string {
  const cached = prepareCache.get(markup);
  if (cached) {
    return cached;
  }
  const doc = new DOMParser().parseFromString(stripDocumentStyles(markup), 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.querySelector('parsererror') || svg.tagName.toLowerCase() !== 'svg') {
    if (import.meta.env.DEV) {
      console.warn('Invalid mould SVG:', reference);
    }
    return markup;
  }
  if (!svg.getAttribute('viewBox')) {
    const width = svg.getAttribute('width') || '200';
    const height = svg.getAttribute('height') || '200';
    svg.setAttribute('viewBox', `0 0 ${parseFloat(width) || 200} ${parseFloat(height) || 200}`);
    if (import.meta.env.DEV) {
      console.warn('Missing viewBox, inferred:', reference);
    }
  }
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  const shapes = svg.querySelectorAll('path, polygon, rect, circle, ellipse, polyline');
  if (shapes.length === 0 && import.meta.env.DEV) {
    console.warn('Invalid mould (no drawable geometry):', reference);
  }
  svg.querySelectorAll('style, script').forEach((node) => node.remove());
  ensureColorableSvg(svg as unknown as SVGSVGElement);
  const prepared = new XMLSerializer().serializeToString(svg);
  if (prepareCache.size >= PREPARE_CACHE_MAX) {
    const first = prepareCache.keys().next().value;
    if (first) {
      prepareCache.delete(first);
    }
  }
  prepareCache.set(markup, prepared);
  return prepared;
}

export function paintSvgMarkup(
  markup: string,
  regionColors: Record<string, string>,
  hexByCode: Record<string, string>,
  activeRegion?: string,
  mode: PaintMode = 'color',
) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  paintSvgDocument(doc, regionColors, hexByCode, activeRegion, mode);
  return new XMLSerializer().serializeToString(doc.documentElement);
}

export function paintSvgDocument(
  root: ParentNode,
  regionColors: Record<string, string>,
  hexByCode: Record<string, string>,
  activeRegion?: string,
  mode: PaintMode = 'color',
) {
  root.querySelectorAll('[data-region], [data-region-id]').forEach((node) => {
    const element = node as SVGElement;
    if (isInsideTracing(element)) {
      return;
    }
    const key = node.getAttribute('data-region') ?? node.getAttribute('data-region-id');
    if (!key) {
      return;
    }
    if (!node.getAttribute('data-region')) {
      node.setAttribute('data-region', key);
    }
    const matchGroup = node.getAttribute('data-match-group');
    const hex = resolveColorValue(regionColors[key] ?? (matchGroup ? regionColors[matchGroup] : undefined), hexByCode)
      ?? (mode === 'color' ? DEFAULT_REGION_HEX : OUTLINE_FILL);
    const fill = mode === 'outline' ? OUTLINE_FILL : hex;
    element.setAttribute('fill', fill);
    if (mode === 'outline') {
      const hasTracing = Boolean(root.querySelector('#tracing, .mould-outlines'));
      const stroke = (element.getAttribute('stroke') ?? '').trim().toLowerCase();
      if (!hasTracing && (!stroke || stroke === 'none')) {
        element.setAttribute('stroke', OUTLINE_STROKE);
        if (!element.getAttribute('stroke-width')) {
          element.setAttribute('stroke-width', '1.5');
        }
      }
    }
    element.style.removeProperty('fill');
    element.style.cursor = 'pointer';
    if (key === activeRegion) {
      element.setAttribute('data-selected', 'true');
    } else {
      element.removeAttribute('data-selected');
    }
  });
}

export function svgDataUrl(srcMarkup: string, regionColors: Record<string, string>, hexByCode: Record<string, string>) {
  const serialized = paintSvgMarkup(srcMarkup, regionColors, hexByCode);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
}

export function isBlankMouldMarkup(markup: string): boolean {
  const tracing = inspectTracing(markup);
  if (tracing.visibleStrokeCount > 0) {
    return false;
  }
  const regions = extractSvgRegions(markup);
  if (regions.length === 0) {
    return true;
  }
  if (regions.length === 1 && /<rect[^>]*(width="200"|width='200')[^>]*>/i.test(markup) && !/<path|<polygon|<circle/i.test(markup)) {
    return true;
  }
  return tracing.pathCount === 0 && !/<path[^>]+d=/i.test(markup);
}
