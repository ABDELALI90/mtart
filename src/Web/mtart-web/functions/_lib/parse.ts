const LANGUAGES = new Set(['en', 'fr', 'es', 'ar']);
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MATERIAL_BY_NAME: Record<string, number> = {
  universal: 0,
  zellige: 1,
  cementtile: 2,
  terracotta: 3,
  bejmat: 4,
};

const MATERIAL_BY_NUMBER: Record<number, string> = {
  0: 'Universal',
  1: 'Zellige',
  2: 'CementTile',
  3: 'Terracotta',
  4: 'Bejmat',
};

const KIND_NAMES = new Set([
  'unknown',
  'patterned',
  'plain',
  'border',
  'patchwork',
  'project',
  'custom',
  'marketing',
  'colorsample',
]);

const KIND_BY_NUMBER: Record<string, string> = {
  '0': 'Unknown',
  '1': 'Patterned',
  '2': 'Plain',
  '3': 'Border',
  '4': 'Patchwork',
  '5': 'Project',
  '6': 'Custom',
  '7': 'Marketing',
  '8': 'ColorSample',
};

export function normalizeLang(value: string | null): string {
  const code = (value ?? 'en').trim().toLowerCase();
  return LANGUAGES.has(code) ? code : 'en';
}

export function parseBool(value: string | null, defaultValue: boolean): boolean {
  if (value === null || value === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  return defaultValue;
}

export function parseOptionalBool(value: string | null): boolean | null {
  if (value === null || value === '') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  return null;
}

export function parseGuid(value: string | null): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === '') {
    return { ok: true, value: null };
  }
  return UUID_RE.test(value) ? { ok: true, value } : { ok: false };
}

export function parseSlug(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return SLUG_RE.test(normalized) ? normalized : null;
}

export function parseIntParam(value: string | null, defaultValue: number): number {
  if (value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export type ProductSort = 'Featured' | 'Newest' | 'ReferenceAsc';

export function parseSort(value: string | null): ProductSort | null {
  if (value === null || value === '') {
    return 'Featured';
  }
  const normalized = value.trim();
  if (normalized === 'Featured' || normalized === '0') {
    return 'Featured';
  }
  if (normalized === 'Newest' || normalized === '1') {
    return 'Newest';
  }
  if (normalized === 'ReferenceAsc' || normalized === '2') {
    return 'ReferenceAsc';
  }
  return null;
}

export function parseKind(value: string | null): string | null {
  if (!value || !value.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (KIND_BY_NUMBER[trimmed]) {
    return KIND_BY_NUMBER[trimmed];
  }
  const key = trimmed.toLowerCase();
  if (!KIND_NAMES.has(key)) {
    return null;
  }
  if (key === 'colorsample') {
    return 'ColorSample';
  }
  return trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function parseMaterialTypeNumber(value: string | null): { ok: true; value: number | null } | { ok: false } {
  if (value === null || value === '') {
    return { ok: true, value: null };
  }
  const trimmed = value.trim();
  if (/^[0-4]$/.test(trimmed)) {
    return { ok: true, value: Number(trimmed) };
  }
  const named = MATERIAL_BY_NAME[trimmed.toLowerCase()];
  if (named === undefined) {
    return { ok: false };
  }
  return { ok: true, value: named };
}

export function parseMaterialTypeName(value: string | null): string | null {
  if (!value || !value.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (/^[0-4]$/.test(trimmed)) {
    return MATERIAL_BY_NUMBER[Number(trimmed)] ?? null;
  }
  const named = MATERIAL_BY_NAME[trimmed.toLowerCase()];
  if (named === undefined) {
    return null;
  }
  return MATERIAL_BY_NUMBER[named];
}

export function materialTypeJson(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && MATERIAL_BY_NAME[value.toLowerCase()] !== undefined) {
    return MATERIAL_BY_NAME[value.toLowerCase()];
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === '1';
}

export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function displayLabel(width: unknown, height: unknown): string {
  const fmt = (n: unknown) => {
    const value = Number(n);
    return Number.isInteger(value) ? String(value) : String(value);
  };
  return `${fmt(width)} × ${fmt(height)} cm`;
}

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
