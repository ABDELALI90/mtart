import { describe, expect, it } from 'vitest';
import { extractSvgRegions, OUTLINE_STROKE, regionAppearance, stripDocumentStyles } from './svgPaint';

describe('outline catalogue rendering', () => {
  it('uses white fill and grey stroke for empty geometry', () => {
    const appearance = regionAppearance('outline', '#1a3358', false);
    expect(appearance.fill).toBe('#ffffff');
    expect(appearance.stroke).toBe(OUTLINE_STROKE);
  });

  it('keeps the outline after a region is coloured', () => {
    const idle = regionAppearance('color', '#1F4E5F', false);
    const active = regionAppearance('color', '#1F4E5F', true);
    expect(idle.fill).toBe('#1F4E5F');
    expect(active.fill).toBe('#1F4E5F');
    expect(idle.stroke).toBe(OUTLINE_STROKE);
    expect(active.stroke).toBe(OUTLINE_STROKE);
    expect(active.selected).toBe(true);
    expect(idle.selected).toBe(false);
  });

  it('extracts unique SVG regions in document order', () => {
    const markup = `
      <svg>
        <rect data-region="background" />
        <path data-region="star" />
        <path data-region-id="center" />
      </svg>
    `;
    expect(extractSvgRegions(markup)).toEqual(['background', 'star', 'center']);
  });

  it('strips uploaded SVG style rules that would hide every mould stroke', () => {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>[data-region]{stroke-opacity:0!important}</style>
      <path data-region="star" fill="#ffffff" stroke="#777777" stroke-width="1.5" d="M0 0 L10 0 L5 10 Z"/>
    </svg>`;
    const prepared = stripDocumentStyles(markup);
    expect(prepared).not.toMatch(/stroke-opacity:\s*0\s*!important/);
    expect(prepared).not.toMatch(/<style/i);
    expect(prepared).toContain('stroke="#777777"');
  });
});
