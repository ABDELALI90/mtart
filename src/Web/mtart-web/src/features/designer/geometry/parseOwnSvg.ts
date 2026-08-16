import { BACKGROUND_REGION_ID, DEFAULT_GRID, DEFAULT_TILE_CM, type CustomDesignDocument, type DesignElement } from '../types';
import { nanoidLike, nextZoneId } from './ids';

function attr(node: Element, name: string): string | null {
  return node.getAttribute(name);
}

function numberAttr(node: Element, name: string, fallback: number): number {
  const value = attr(node, name);
  return value ? Number.parseFloat(value) : fallback;
}

export function parseOwnSvgToDocument(markup: string, sourceReference?: string, defaultColor = '#EFE6D8'): CustomDesignDocument {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const nodes = [...doc.querySelectorAll('[data-region]')];
  const regionOrder: string[] = [];
  const elements: DesignElement[] = [];

  for (const node of nodes) {
    const regionKey = attr(node, 'data-region') ?? 'zone';
    if (!regionOrder.includes(regionKey) && regionKey !== 'background') {
      regionOrder.push(regionKey);
    }
    const tag = node.tagName.toLowerCase();
    if (tag === 'rect' && (regionKey === 'background' || regionKey === BACKGROUND_REGION_ID)) {
      continue;
    }
    if (tag === 'circle' || tag === 'ellipse') {
      elements.push({
        id: nanoidLike('el'),
        type: 'circle',
        name: regionKey,
        x: numberAttr(node, 'cx', 100),
        y: numberAttr(node, 'cy', 100),
        width: numberAttr(node, 'r', numberAttr(node, 'rx', 20)) * 2,
        height: numberAttr(node, tag === 'ellipse' ? 'ry' : 'r', 20) * 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        regionId: regionKey === 'background' ? BACKGROUND_REGION_ID : regionKey,
        strokeOnly: false,
        strokeWidth: 0,
        params: {},
        visible: true,
        locked: false,
      });
      continue;
    }
    const d = attr(node, 'd') ?? '';
    if (!d) {
      continue;
    }
    elements.push({
      id: nanoidLike('el'),
      type: 'path',
      name: regionKey,
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      regionId: regionKey === 'background' ? BACKGROUND_REGION_ID : regionKey,
      strokeOnly: false,
      strokeWidth: 0,
      params: {},
      d,
      visible: true,
      locked: false,
    });
  }

  const used = new Set([BACKGROUND_REGION_ID, ...regionOrder]);
  const regions = [
    { id: BACKGROUND_REGION_ID, name: 'Background', colorReference: defaultColor },
    ...regionOrder.map((key) => ({
      id: key,
      name: key,
      colorReference: defaultColor,
    })),
  ];

  if (elements.length === 0) {
    used.add(nextZoneId([...used]));
  }

  return {
    version: 1,
    name: sourceReference ? `From ${sourceReference}` : 'Imported mould',
    widthCm: DEFAULT_TILE_CM,
    heightCm: DEFAULT_TILE_CM,
    unit: 'cm',
    elements,
    regions,
    backgroundRegionId: BACKGROUND_REGION_ID,
    repeatMode: 'straight',
    tessellation: 4,
    symmetry: 'none',
    grid: { ...DEFAULT_GRID },
    sourceMouldReference: sourceReference,
  };
}
