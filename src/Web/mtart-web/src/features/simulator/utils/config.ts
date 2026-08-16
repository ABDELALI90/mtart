import { DEFAULT_REGION_HEX, normalizeHex } from '@/features/color/hex';

export const URL_RESERVED = new Set(['mould', 'pattern', 'rot', 'repeat', 'surface', 'waste', 'start', 'from', 'design', 'lang', 'c', 'tileCm', 'custom']);

export interface SimulatorShareConfig {
  mould: string;
  regionColors: Record<string, string>;
  rotation: 0 | 90 | 180 | 270;
  repeat: 1 | 2 | 3 | 4;
}

export function parseShareParams(
  params: URLSearchParams,
  regionKeys?: string[],
): Partial<SimulatorShareConfig> {
  const mould = params.get('mould') ?? params.get('pattern') ?? undefined;
  const rotation = Number(params.get('rot'));
  const repeat = Number(params.get('repeat'));
  const regionColors: Record<string, string> = {};

  const packed = params.get('c');
  packed?.split('_').forEach((part) => {
    const dot = part.lastIndexOf('.');
    if (dot <= 0) {
      return;
    }
    const key = part.slice(0, dot);
    const hex = normalizeHex(part.slice(dot + 1));
    if (hex && !regionColors[key]) {
      regionColors[key] = hex;
    }
  });

  params.forEach((value, key) => {
    if (!URL_RESERVED.has(key) && !key.startsWith('r') && value) {
      regionColors[key] = normalizeHex(value) ?? value;
    }
  });

  regionKeys?.forEach((key, index) => {
    const indexed = params.get(`r${index + 1}`) ?? params.get(`r_${key}`);
    if (indexed && !regionColors[key]) {
      regionColors[key] = normalizeHex(indexed) ?? indexed;
    }
  });

  return {
    mould,
    regionColors,
    rotation: rotation === 90 || rotation === 180 || rotation === 270 ? rotation : 0,
    repeat: repeat === 1 || repeat === 2 || repeat === 3 || repeat === 4 ? repeat : undefined,
  };
}

export function serializeShareParams(config: SimulatorShareConfig): URLSearchParams {
  const params = new URLSearchParams();
  params.set('mould', config.mould);
  const packed = Object.entries(config.regionColors)
    .filter(([, code]) => Boolean(code))
    .map(([key, code]) => `${key}.${(normalizeHex(code) ?? code).replace('#', '')}`)
    .join('_');
  if (packed) {
    params.set('c', packed);
  }
  if (config.rotation) {
    params.set('rot', String(config.rotation));
  }
  if (config.repeat !== 1) {
    params.set('repeat', String(config.repeat));
  }
  return params;
}

export function applyRegionColor(
  current: Record<string, string>,
  regionKey: string,
  colorCode: string,
): Record<string, string> {
  return { ...current, [regionKey]: normalizeHex(colorCode) ?? colorCode };
}

export function resolveRegionKeys(declaredKeys: string[], svgKeys: string[]): string[] {
  return svgKeys.length > 0 ? svgKeys : declaredKeys;
}

export function defaultsFromRegions(
  regions: Array<{ regionKey: string; defaultColorCode?: string | null }>,
): Record<string, string> {
  const next: Record<string, string> = {};
  regions.forEach((region) => {
    next[region.regionKey] = normalizeHex(region.defaultColorCode) ?? DEFAULT_REGION_HEX;
  });
  return next;
}

export type Rotation = 0 | 90 | 180 | 270;

export function nextRotation(current: Rotation): Rotation {
  return ((current + 90) % 360) as Rotation;
}

export function suggestLayoutRotations(count: number): Rotation[] {
  return Array.from({ length: count }, (_, index) => ((index % 4) * 90) as Rotation);
}

export function calculateSurface(input: {
  surfaceM2: number;
  wastePercent: number;
  unitsPerM2: number;
  weightPerM2Kg: number;
  pricePerM2: number;
}) {
  const requiredM2 = input.surfaceM2 * (1 + input.wastePercent / 100);
  const tiles = Math.ceil(requiredM2 * input.unitsPerM2);
  const weightKg = Math.round(requiredM2 * input.weightPerM2Kg);
  const total = Math.round(requiredM2 * input.pricePerM2);
  return { requiredM2, tiles, weightKg, total };
}
