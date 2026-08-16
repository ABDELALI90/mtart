import { describe, expect, it } from 'vitest';
import { addShape, emptyDocument } from './geometry/document';
import { khatemStar, polygonArea, starPolygon, elementLocalPath } from './geometry/paths';
import { symmetryCopies } from './geometry/symmetry';
import { cellTransform } from './geometry/layout';
import { exportDesignSvg } from './geometry/svg';
import { validateDesign } from './geometry/validate';
import { parseDesignIntent, generateFromIntent } from './assist/designIntent';
import { BACKGROUND_REGION_ID } from './types';

describe('cement tile geometry', () => {
  it('builds a closed 8-point khatem from two overlapping squares', () => {
    const points = khatemStar(50, 50);
    expect(points).toHaveLength(8);
    expect(polygonArea(points)).toBeGreaterThan(1000);
  });

  it('creates independently colourable regions for each closed shape', () => {
    let document = emptyDocument();
    document = addShape(document, 'khatem', 100, 100, '#B5623F');
    document = addShape(document, 'circle', 100, 100, '#1F4A4C');
    expect(document.regions.map((region) => region.id)).toEqual([BACKGROUND_REGION_ID, 'zone-1', 'zone-2']);
    expect(document.regions[1].colorReference).toBe('#B5623F');
    expect(document.regions[2].colorReference).toBe('#1F4A4C');
    const svg = exportDesignSvg(document, {});
    expect(svg).toContain('data-region="zone-bg"');
    expect(svg).toContain('data-region="zone-1"');
    expect(svg).toContain('data-region="zone-2"');
    expect(svg).toContain('#B5623F');
    expect(svg).not.toContain('hue-rotate');
  });

  it('mirrors a quarter into four copies in 4-way symmetry', () => {
    expect(symmetryCopies('4')).toHaveLength(4);
    expect(symmetryCopies('radial')).toHaveLength(12);
  });

  it('turns a simple tile into a 2×2 rotating composition', () => {
    expect(cellTransform('compose2', 0, 0).rotate).toBe(0);
    expect(cellTransform('compose2', 1, 0).rotate).toBe(90);
    expect(cellTransform('compose2', 0, 1).rotate).toBe(270);
    expect(cellTransform('compose2', 1, 1).rotate).toBe(180);
  });

  it('warns when a region is too small without blocking the design', () => {
    let document = emptyDocument();
    document = addShape(document, 'circle', 100, 100);
    const tiny = document.elements[0];
    tiny.width = 4;
    tiny.height = 4;
    const warnings = validateDesign(document, {
      minRegionAreaMm2: 80,
      minRegionWidthMm: 4,
      maxOverlapRatio: 0.25,
      minGapMm: 1.5,
    });
    expect(warnings.some((warning) => warning.code === 'tiny-area')).toBe(true);
  });

  it('keeps stars as closed vector paths', () => {
    const star = starPolygon(8, 40, 40, 0.4);
    expect(star).toHaveLength(16);
    const path = elementLocalPath({
      id: 'el',
      type: 'star8',
      name: 'Star',
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      regionId: 'zone-1',
      strokeOnly: false,
      strokeWidth: 0,
      params: {},
      visible: true,
      locked: false,
    });
    expect(path.closed).toBe(true);
    expect(path.d.endsWith('Z')).toBe(true);
  });
});

describe('assisted motif generator', () => {
  it('maps a description to original geometry without an AI service', () => {
    const intent = parseDesignIntent('Create a Moroccan 8-point star with diamonds around it');
    expect(intent.motifs).toContain('khatem');
    expect(intent.motifs).toContain('diamondsRing');
    const document = generateFromIntent(intent);
    expect(document.elements.length).toBeGreaterThan(0);
    expect(document.elements.every((element) => element.type !== 'path' || Boolean(element.d))).toBe(true);
  });
});
