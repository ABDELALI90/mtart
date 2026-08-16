export const DEFAULT_REGION_HEX = '#FFFFFF';

export function normalizeHex(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  let raw = value.trim();
  if (raw.startsWith('#')) {
    raw = raw.slice(1);
  }
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    raw = raw.split('').map((char) => char + char).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    return null;
  }
  return `#${raw.toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export function rgbColorFromChannels(r: number, g: number, b: number): RGBColor {
  const next = {
    r: Math.max(0, Math.min(255, Math.round(Number.isFinite(r) ? r : 0))),
    g: Math.max(0, Math.min(255, Math.round(Number.isFinite(g) ? g : 0))),
    b: Math.max(0, Math.min(255, Math.round(Number.isFinite(b) ? b : 0))),
  };
  return { ...next, hex: rgbToHex(next.r, next.g, next.b) };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hueToRgb(p: number, q: number, t: number) {
  let tone = t;
  if (tone < 0) {
    tone += 1;
  }
  if (tone > 1) {
    tone -= 1;
  }
  if (tone < 1 / 6) {
    return p + (q - p) * 6 * tone;
  }
  if (tone < 1 / 2) {
    return q;
  }
  if (tone < 2 / 3) {
    return p + (q - p) * (2 / 3 - tone) * 6;
  }
  return p;
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hh = ((h % 360) + 360) % 360 / 60;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const vv = Math.max(0, Math.min(100, v)) / 100;
  const chroma = vv * ss;
  const x = chroma * (1 - Math.abs((hh % 2) - 1));
  const m = vv - chroma;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) {
    r = chroma;
    g = x;
  } else if (hh < 2) {
    r = x;
    g = chroma;
  } else if (hh < 3) {
    g = chroma;
    b = x;
  } else if (hh < 4) {
    g = x;
    b = chroma;
  } else if (hh < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  if (ss === 0) {
    return rgbToHex(ll * 255, ll * 255, ll * 255);
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  return rgbToHex(hueToRgb(p, q, hh + 1 / 3) * 255, hueToRgb(p, q, hh) * 255, hueToRgb(p, q, hh - 1 / 3) * 255);
}

export function resolveColorValue(value: string | undefined, hexByCode: Record<string, string> = {}): string | undefined {
  const hex = normalizeHex(value);
  if (hex) {
    return hex;
  }
  if (value && hexByCode[value]) {
    return normalizeHex(hexByCode[value]) ?? hexByCode[value];
  }
  return undefined;
}
