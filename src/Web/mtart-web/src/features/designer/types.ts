export const TILE_UNITS = 200;
export const DEFAULT_TILE_CM = 20;
export const BACKGROUND_REGION_ID = 'zone-bg';

export type ShapeType =
  | 'line'
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'circle'
  | 'semiCircle'
  | 'quarterCircle'
  | 'diamond'
  | 'rhombus'
  | 'hexagon'
  | 'octagon'
  | 'star4'
  | 'star6'
  | 'star8'
  | 'star10'
  | 'star12'
  | 'moroccanStar'
  | 'cross'
  | 'polygon'
  | 'arc'
  | 'khatem'
  | 'starAndCross'
  | 'rosette'
  | 'interlace'
  | 'diamondsRing'
  | 'moorishRadial'
  | 'path';

export type SymmetryMode = 'none' | '2' | '4' | '6' | '8' | 'radial';

export type RepeatMode =
  | 'straight'
  | 'rotate90'
  | 'rotate180'
  | 'alt90'
  | 'alt180'
  | 'mirrorX'
  | 'mirrorY'
  | 'checker'
  | 'compose2'
  | 'compose4';

export type DesignerTool = 'select' | ShapeType;

export interface Point {
  x: number;
  y: number;
}

export interface ShapeParams {
  sides?: number;
  innerRatio?: number;
  petals?: number;
  rings?: number;
  rays?: number;
  startAngle?: number;
  sweep?: number;
  copies?: number;
}

export interface DesignElement {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  regionId: string;
  strokeOnly: boolean;
  strokeWidth: number;
  params: ShapeParams;
  d?: string;
  visible: boolean;
  locked: boolean;
}

export interface DesignRegion {
  id: string;
  name: string;
  colorReference: string | null;
}

export interface GridSettings {
  visible: boolean;
  snap: boolean;
  size: number;
  centerGuides: boolean;
  diagonalGuides: boolean;
  horizontalGuide: boolean;
  verticalGuide: boolean;
  angleSnap: 0 | 15 | 30 | 45 | 60 | 90;
}

export interface CustomDesignDocument {
  version: 1;
  name: string;
  widthCm: number;
  heightCm: number;
  unit: 'cm';
  elements: DesignElement[];
  regions: DesignRegion[];
  backgroundRegionId: string;
  repeatMode: RepeatMode;
  tessellation: 4 | 8;
  symmetry: SymmetryMode;
  grid: GridSettings;
  sourceMouldReference?: string;
}

export interface ManufacturingSettings {
  minRegionAreaMm2: number;
  minRegionWidthMm: number;
  maxOverlapRatio: number;
  minGapMm: number;
}

export interface ManufacturabilityWarning {
  code: string;
  messageKey: string;
  elementId?: string;
  regionId?: string;
}

export const DEFAULT_GRID: GridSettings = {
  visible: true,
  snap: true,
  size: 10,
  centerGuides: true,
  diagonalGuides: false,
  horizontalGuide: true,
  verticalGuide: true,
  angleSnap: 15,
};

export const DEFAULT_MANUFACTURING: ManufacturingSettings = {
  minRegionAreaMm2: 80,
  minRegionWidthMm: 4,
  maxOverlapRatio: 0.25,
  minGapMm: 1.5,
};

export const BASIC_SHAPES: ShapeType[] = [
  'line',
  'triangle',
  'square',
  'rectangle',
  'circle',
  'semiCircle',
  'quarterCircle',
  'diamond',
  'rhombus',
  'hexagon',
  'octagon',
  'star4',
  'star6',
  'star8',
  'star10',
  'star12',
  'moroccanStar',
  'cross',
  'polygon',
  'arc',
];

export const MOROCCAN_MOTIFS: ShapeType[] = [
  'star8',
  'star10',
  'star12',
  'starAndCross',
  'khatem',
  'rosette',
  'interlace',
  'diamondsRing',
  'octagon',
  'moorishRadial',
  'moroccanStar',
];

export const REPEAT_MODES: RepeatMode[] = [
  'straight',
  'rotate90',
  'rotate180',
  'alt90',
  'alt180',
  'mirrorX',
  'mirrorY',
  'checker',
  'compose2',
  'compose4',
];
