import {
  BACKGROUND_REGION_ID,
  DEFAULT_GRID,
  DEFAULT_TILE_CM,
  TILE_UNITS,
  type CustomDesignDocument,
  type DesignElement,
  type DesignRegion,
  type GridSettings,
  type ShapeType,
} from '../types';
import { createMotifElements } from './moroccan';
import { nextZoneId } from './ids';

const SHAPE_LABELS: Record<ShapeType, string> = {
  line: 'Line',
  triangle: 'Triangle',
  square: 'Square',
  rectangle: 'Rectangle',
  circle: 'Circle',
  semiCircle: 'Semi-circle',
  quarterCircle: 'Quarter circle',
  diamond: 'Diamond',
  rhombus: 'Rhombus',
  hexagon: 'Hexagon',
  octagon: 'Octagon',
  star4: '4-point star',
  star6: '6-point star',
  star8: '8-point star',
  star10: '10-point star',
  star12: '12-point star',
  moroccanStar: 'Moroccan star',
  cross: 'Cross',
  polygon: 'Polygon',
  arc: 'Arc',
  khatem: 'Khatem star',
  starAndCross: 'Star and cross',
  rosette: 'Rosette',
  interlace: 'Interlace',
  diamondsRing: 'Diamond ring',
  moorishRadial: 'Radial geometry',
  path: 'Path',
};

export function emptyDocument(name = 'Untitled design'): CustomDesignDocument {
  return {
    version: 1,
    name,
    widthCm: DEFAULT_TILE_CM,
    heightCm: DEFAULT_TILE_CM,
    unit: 'cm',
    elements: [],
    regions: [{ id: BACKGROUND_REGION_ID, name: 'Background', colorReference: '#EFE6D8' }],
    backgroundRegionId: BACKGROUND_REGION_ID,
    repeatMode: 'straight',
    tessellation: 4,
    symmetry: 'none',
    grid: { ...DEFAULT_GRID },
  };
}

export function cloneDocument(document: CustomDesignDocument): CustomDesignDocument {
  return structuredClone(document);
}

export function defaultSize(type: ShapeType): { width: number; height: number } {
  if (type === 'line') {
    return { width: 80, height: 8 };
  }
  if (type === 'rectangle') {
    return { width: 72, height: 40 };
  }
  if (type === 'arc') {
    return { width: 70, height: 70 };
  }
  if (type === 'semiCircle') {
    return { width: 70, height: 36 };
  }
  return { width: 56, height: 56 };
}

export function addShape(
  document: CustomDesignDocument,
  type: ShapeType,
  x: number,
  y: number,
  defaultColor = '#EFE6D8',
): CustomDesignDocument {
  const regionId = nextZoneId(document.regions.map((region) => region.id));
  const name = SHAPE_LABELS[type];
  const size = defaultSize(type);
  const region: DesignRegion = { id: regionId, name, colorReference: defaultColor };
  const [element] = createMotifElements(type, x, y, Math.max(size.width, size.height), regionId, name);
  const adjusted: DesignElement = { ...element, width: size.width, height: size.height };
  if (type === 'line' || type === 'arc') {
    adjusted.strokeOnly = true;
    adjusted.strokeWidth = 2.4;
  }
  return {
    ...document,
    elements: [...document.elements, adjusted],
    regions: [...document.regions, region],
  };
}

export function snapValue(value: number, grid: GridSettings): number {
  if (!grid.snap || grid.size <= 0) {
    return value;
  }
  return Math.round(value / grid.size) * grid.size;
}

export function snapAngle(degrees: number, increment: GridSettings['angleSnap']): number {
  if (!increment) {
    return degrees;
  }
  return Math.round(degrees / increment) * increment;
}

export function clampToTile(value: number, padding = 0): number {
  return Math.min(TILE_UNITS - padding, Math.max(padding, value));
}

export { SHAPE_LABELS };
