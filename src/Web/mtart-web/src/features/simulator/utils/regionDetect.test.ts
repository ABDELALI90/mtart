/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest';
import {
  extractClosedSubpaths,
  labelEnclosedRegions,
  matchingRegionIds,
  morphClose,
} from './regionDetect';
import { extractSvgRegions, paintSvgMarkup, prepareSvgMarkup } from './svgPaint';
import { inspectTracing, validateVisibleMould } from './svgTraceValidate';

function drawRect(ink: Uint8Array, width: number, x0: number, y0: number, x1: number, y1: number) {
  for (let x = x0; x <= x1; x += 1) {
    ink[y0 * width + x] = 1;
    ink[y1 * width + x] = 1;
  }
  for (let y = y0; y <= y1; y += 1) {
    ink[y * width + x0] = 1;
    ink[y * width + x1] = 1;
  }
}

describe('closed region detection', () => {
  it('labels nested enclosed areas as separate regions', () => {
    const width = 32;
    const height = 32;
    const ink = new Uint8Array(width * height);
    drawRect(ink, width, 2, 2, 29, 29);
    drawRect(ink, width, 10, 10, 21, 21);
    drawRect(ink, width, 14, 14, 17, 17);

    const { areas } = labelEnclosedRegions(ink, width, height, 4);
    expect(areas.size).toBe(3);
    const sizes = [...areas.values()].sort((a, b) => b - a);
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
    expect(sizes[1]).toBeGreaterThan(sizes[2]);
  });

  it('treats a nearly closed polyline as a fillable region', () => {
    expect(extractClosedSubpaths('M10 10 L40 10 L40 40 L10 40 L10 10.5', 2)).toHaveLength(1);
    expect(extractClosedSubpaths('M10 10 L40 10 L40 40', 2)).toHaveLength(0);
  });

  it('closes a one-pixel gap before labeling', () => {
    const width = 24;
    const height = 24;
    const ink = new Uint8Array(width * height);
    drawRect(ink, width, 4, 4, 19, 19);
    ink[4 * width + 12] = 0;
    const closed = morphClose(ink, width, height, 1, 0);
    const open = labelEnclosedRegions(ink, width, height, 4);
    const sealed = labelEnclosedRegions(closed, width, height, 4);
    expect(open.areas.size).toBe(0);
    expect(sealed.areas.size).toBe(1);
  });

  it('splits catalogue fills from tracing and uniquifies matching petals', () => {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect data-region="background" x="0" y="0" width="200" height="200" fill="#FFFFFF" stroke="#666666" stroke-width="1.5"/>
      <path data-region="region-1" d="M10 10 L40 10 L40 40 Z" fill="#FFFFFF" stroke="#666666" stroke-width="1.5"/>
      <path data-region="region-1" d="M50 10 L80 10 L80 40 Z" fill="#FFFFFF" stroke="#666666" stroke-width="1.5"/>
      <path data-region="region-2" d="M90 90 L120 90 L105 120 Z" fill="#FFFFFF" stroke="#666666" stroke-width="1.5"/>
    </svg>`;
    const prepared = prepareSvgMarkup(markup);
    expect(prepared).toContain('id="color-regions"');
    expect(prepared).toContain('id="tracing"');
    expect(prepared).toContain('pointer-events="none"');
    expect(prepared).toContain('data-region="region-1__0"');
    expect(prepared).toContain('data-region="region-1__1"');
    expect(prepared).toContain('data-match-group="region-1"');
    expect(extractSvgRegions(prepared)).toEqual(['background', 'region-1__0', 'region-1__1', 'region-2']);

    const painted = paintSvgMarkup(prepared, { 'region-1__0': '#C94C4C' }, {}, 'region-1__0');
    expect(painted).toMatch(/data-region="region-1__0"[^>]*fill="#C94C4C"/);
    expect(painted).toMatch(/data-region="region-1__1"[^>]*fill="#FFFFFF"/);
    expect(painted).toContain('stroke="#666666"');
    expect(painted).toContain('data-selected="true"');

    const doc = new DOMParser().parseFromString(prepared, 'image/svg+xml');
    expect(matchingRegionIds(doc, 'region-1__0')).toEqual(['region-1__0', 'region-1__1']);
    expect(matchingRegionIds(doc, 'region-2')).toEqual(['region-2']);
  });

  it('turns stroke-only nested traces into clickable fill regions', async () => {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect data-region="background" data-region-id="background" x="0" y="0" width="200" height="200" fill="#FFFFFF" stroke="none"/>
      <g class="mould-outlines" fill="none" stroke="#666666" stroke-width="2" pointer-events="none">
        <path d="M20 20 L180 20 L180 180 L20 180 Z"/>
        <path d="M70 70 L130 70 L130 130 L70 130 Z"/>
        <path d="M90 90 L110 90 L110 110 L90 110 Z"/>
      </g>
    </svg>`;
    const prepared = prepareSvgMarkup(markup);
    const keys = extractSvgRegions(prepared);
    expect(prepared).toContain('id="color-regions"');
    expect(prepared).toContain('id="tracing"');
    expect(keys.some((key) => key.startsWith('region-'))).toBe(true);
    expect(keys.length).toBeGreaterThanOrEqual(3);
    const tracing = inspectTracing(prepared);
    expect(tracing.visibleStrokeCount).toBeGreaterThan(0);
    const doc = new DOMParser().parseFromString(prepared, 'image/svg+xml');
    const traces = [...doc.querySelectorAll('#tracing path')];
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((node) => {
      const stroke = node.getAttribute('stroke') ?? '';
      return stroke !== '' && stroke !== 'none' && stroke.toLowerCase() !== '#ffffff';
    })).toBe(true);
    await expect(validateVisibleMould(prepared)).resolves.toEqual({ ok: true });
  });

  it('rejects a white-only SVG with no visible tracing', async () => {
    const blank = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect data-region="background" x="0" y="0" width="200" height="200" fill="#FFFFFF" stroke="none"/>
    </svg>`;
    const prepared = prepareSvgMarkup(blank);
    const check = await validateVisibleMould(prepared);
    expect(check.ok).toBe(false);
  });

  it('does not paint tracing lines when a region is filled', () => {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect data-region="background" x="0" y="0" width="200" height="200" fill="#FFFFFF" stroke="#666666"/>
      <path data-region="center" d="M80 80 L120 80 L100 120 Z" fill="#FFFFFF" stroke="#666666"/>
    </svg>`;
    const prepared = prepareSvgMarkup(markup);
    const painted = paintSvgMarkup(prepared, { center: '#1D3D62' }, {});
    const doc = new DOMParser().parseFromString(painted, 'image/svg+xml');
    const fill = doc.querySelector('#color-regions [data-region="center"]');
    const traces = [...doc.querySelectorAll('#tracing path, #tracing rect')];
    expect(fill?.getAttribute('fill')).toBe('#1D3D62');
    expect(fill?.getAttribute('stroke')).toBe('none');
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((node) => (node.getAttribute('fill') ?? 'none') === 'none')).toBe(true);
    expect(traces.some((node) => (node.getAttribute('stroke') ?? '') !== 'none')).toBe(true);
  });
});
