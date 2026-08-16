export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export type ImageColorMode = 'texture' | 'flat';

export const DEFAULT_IMAGE_TOLERANCE = 32;
export const MAX_WORKING_EDGE = 2048;

export function clonePixels(data: Uint8ClampedArray) {
  return new Uint8ClampedArray(data);
}

export function pixelIndex(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

export function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): Rgb {
  const index = pixelIndex(x, y, width);
  return { r: data[index], g: data[index + 1], b: data[index + 2] };
}

function srgbToLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number) {
  const value = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(value * 255)));
}

export function rgbToLab(rgb: Rgb): Lab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / 0.95047);
  const fy = f(y);
  const fz = f(z / 1.08883);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function labToRgb(lab: Lab): Rgb {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = 0.95047 * inv(fx);
  const y = inv(fy);
  const z = 1.08883 * inv(fz);
  const r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(b) };
}

export function labDistance(left: Lab, right: Lab) {
  const dL = left.L - right.L;
  const da = left.a - right.a;
  const db = left.b - right.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function toleranceToDeltaE(tolerance: number) {
  const value = Math.max(0, Math.min(100, tolerance));
  return 2 + (value / 100) * 46;
}

export function colorsSimilar(left: Rgb, right: Rgb, tolerance: number) {
  return labDistance(rgbToLab(left), rgbToLab(right)) <= toleranceToDeltaE(tolerance);
}

function collectMaskIndices(mask: Uint8Array) {
  const indices: number[] = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) {
      indices.push(i);
    }
  }
  return indices;
}

export function floodFillMask(
  buffer: PixelBuffer,
  x: number,
  y: number,
  tolerance: number,
): { mask: Uint8Array; indices: number[] } {
  const { data, width, height } = buffer;
  const mask = new Uint8Array(width * height);
  const seedX = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const seedY = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const seed = getPixel(data, width, seedX, seedY);
  const seedLab = rgbToLab(seed);
  const maxDelta = toleranceToDeltaE(tolerance);
  const queue = [seedX, seedY];
  mask[seedY * width + seedX] = 1;
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head];
    const cy = queue[head + 1];
    head += 2;
    const neighbors = [cx - 1, cy, cx + 1, cy, cx, cy - 1, cx, cy + 1];
    for (let i = 0; i < neighbors.length; i += 2) {
      const nx = neighbors[i];
      const ny = neighbors[i + 1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      const index = ny * width + nx;
      if (mask[index]) {
        continue;
      }
      if (labDistance(seedLab, rgbToLab(getPixel(data, width, nx, ny))) > maxDelta) {
        continue;
      }
      mask[index] = 1;
      queue.push(nx, ny);
    }
  }
  return { mask, indices: collectMaskIndices(mask) };
}

export function similarColorMask(
  buffer: PixelBuffer,
  seed: Rgb,
  tolerance: number,
): { mask: Uint8Array; indices: number[] } {
  const { data, width, height } = buffer;
  const mask = new Uint8Array(width * height);
  const seedLab = rgbToLab(seed);
  const maxDelta = toleranceToDeltaE(tolerance);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (labDistance(seedLab, rgbToLab(getPixel(data, width, x, y))) <= maxDelta) {
        mask[y * width + x] = 1;
      }
    }
  }
  return { mask, indices: collectMaskIndices(mask) };
}

export function expandTinySelection(buffer: PixelBuffer, x: number, y: number, tolerance: number, matching: boolean) {
  let used = matching
    ? similarColorMask(buffer, getPixel(buffer.data, buffer.width, Math.floor(x), Math.floor(y)), tolerance)
    : floodFillMask(buffer, x, y, tolerance);
  const minArea = Math.max(24, Math.round(buffer.width * buffer.height * 0.00035));
  if (used.indices.length < minArea && tolerance < 80) {
    const broader = Math.min(80, Math.round(tolerance * 1.45 + 8));
    used = matching
      ? similarColorMask(buffer, getPixel(buffer.data, buffer.width, Math.floor(x), Math.floor(y)), broader)
      : floodFillMask(buffer, x, y, broader);
  }
  return used;
}

export function rgbToHsl(rgb: Rgb) {
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
  const s = (l > 0.5 ? d / (2 - max - min) : d / (max + min)) * 100;
  let h = 0;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  if (ss === 0) {
    const channel = Math.round(ll * 255);
    return { r: channel, g: channel, b: channel };
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hue = (tone: number) => {
    let next = tone;
    if (next < 0) {
      next += 1;
    }
    if (next > 1) {
      next -= 1;
    }
    if (next < 1 / 6) {
      return p + (q - p) * 6 * next;
    }
    if (next < 1 / 2) {
      return q;
    }
    if (next < 2 / 3) {
      return p + (q - p) * (2 / 3 - next) * 6;
    }
    return p;
  };
  return {
    r: Math.round(hue(hh + 1 / 3) * 255),
    g: Math.round(hue(hh) * 255),
    b: Math.round(hue(hh - 1 / 3) * 255),
  };
}

export function copyPixelBuffer(target: Uint8ClampedArray, source: Uint8ClampedArray) {
  const count = Math.min(target.length, source.length);
  if (count <= 0) {
    return target;
  }
  if (count === target.length && count === source.length) {
    target.set(source);
    return target;
  }
  target.fill(0);
  target.set(source.subarray(0, count));
  return target;
}

function validPixelOffset(data: Uint8ClampedArray, index: number) {
  const pixel = index * 4;
  return pixel >= 0 && pixel + 3 < data.length;
}

export function recolorMask(
  source: PixelBuffer,
  dest: PixelBuffer,
  indices: number[],
  target: Rgb,
  mode: ImageColorMode,
) {
  if (dest.data !== source.data) {
    copyPixelBuffer(dest.data, source.data);
  }
  if (indices.length === 0) {
    return dest;
  }
  if (mode === 'flat') {
    for (const index of indices) {
      if (!validPixelOffset(dest.data, index)) {
        continue;
      }
      const pixel = index * 4;
      dest.data[pixel] = target.r;
      dest.data[pixel + 1] = target.g;
      dest.data[pixel + 2] = target.b;
    }
    return dest;
  }
  const targetHsl = rgbToHsl(target);
  for (const index of indices) {
    if (!validPixelOffset(source.data, index) || !validPixelOffset(dest.data, index)) {
      continue;
    }
    const pixel = index * 4;
    const original = rgbToHsl({
      r: source.data[pixel],
      g: source.data[pixel + 1],
      b: source.data[pixel + 2],
    });
    const next = hslToRgb(targetHsl.h, targetHsl.s, original.l);
    dest.data[pixel] = next.r;
    dest.data[pixel + 1] = next.g;
    dest.data[pixel + 2] = next.b;
  }
  return dest;
}

export function restoreMask(original: PixelBuffer, dest: PixelBuffer, indices: number[]) {
  for (const index of indices) {
    const pixel = index * 4;
    dest.data[pixel] = original.data[pixel];
    dest.data[pixel + 1] = original.data[pixel + 1];
    dest.data[pixel + 2] = original.data[pixel + 2];
    dest.data[pixel + 3] = original.data[pixel + 3];
  }
}

export function paintHighlight(dest: Uint8ClampedArray, indices: number[], rgb: Rgb = { r: 15, g: 76, b: 92 }) {
  for (const index of indices) {
    const pixel = index * 4;
    dest[pixel] = Math.round(dest[pixel] * 0.62 + rgb.r * 0.38);
    dest[pixel + 1] = Math.round(dest[pixel + 1] * 0.62 + rgb.g * 0.38);
    dest[pixel + 2] = Math.round(dest[pixel + 2] * 0.62 + rgb.b * 0.38);
  }
}

export function averageMaskHex(buffer: PixelBuffer, indices: number[], fallback: Rgb) {
  if (indices.length === 0) {
    return fallback;
  }
  let r = 0;
  let g = 0;
  let b = 0;
  for (const index of indices) {
    const pixel = index * 4;
    r += buffer.data[pixel];
    g += buffer.data[pixel + 1];
    b += buffer.data[pixel + 2];
  }
  const count = indices.length;
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}
