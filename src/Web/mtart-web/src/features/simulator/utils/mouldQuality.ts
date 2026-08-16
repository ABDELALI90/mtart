export interface MouldQuality {
  ok: boolean;
  reason?: string;
  pathCount: number;
  closedRatio: number;
  outOfBounds: number;
  tinyPaths: number;
  cornerOnly: number;
  hasCenterMotif: boolean;
}

const MAX_PATHS = 64;
const MIN_CLOSED_RATIO = 0.55;
const MAX_OUT_OF_BOUNDS_RATIO = 0.12;
const MAX_TINY_RATIO = 0.4;
const MAX_CORNER_RATIO = 0.55;

function viewBox(svg: Element) {
  const raw = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (raw.length === 4 && raw.every((value) => Number.isFinite(value))) {
    return { x: raw[0], y: raw[1], w: raw[2], h: raw[3] };
  }
  const width = parseFloat(svg.getAttribute('width') ?? '200') || 200;
  const height = parseFloat(svg.getAttribute('height') ?? '200') || 200;
  return { x: 0, y: 0, w: width, h: height };
}

function pathPoints(d: string) {
  const points: { x: number; y: number }[] = [];
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let command = '';
  let x = 0;
  let y = 0;
  let i = 0;
  const read = () => Number(tokens[i++] ?? 0);
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) {
      break;
    }
    if (/^[MLHVCSQTAZmlhvcsqtaz]$/.test(token)) {
      command = token;
      i += 1;
      if (command === 'Z' || command === 'z') {
        continue;
      }
    }
    if (command === 'M' || command === 'L' || command === 'T') {
      x = read();
      y = read();
    } else if (command === 'm' || command === 'l' || command === 't') {
      x += read();
      y += read();
    } else if (command === 'H') {
      x = read();
    } else if (command === 'h') {
      x += read();
    } else if (command === 'V') {
      y = read();
    } else if (command === 'v') {
      y += read();
    } else if (command === 'C') {
      read(); read(); read(); read();
      x = read();
      y = read();
    } else if (command === 'c') {
      read(); read(); read(); read();
      x += read();
      y += read();
    } else if (command === 'S' || command === 'Q') {
      read(); read();
      x = read();
      y = read();
    } else if (command === 's' || command === 'q') {
      read(); read();
      x += read();
      y += read();
    } else if (command === 'A') {
      read(); read(); read(); read(); read();
      x = read();
      y = read();
    } else if (command === 'a') {
      read(); read(); read(); read(); read();
      x += read();
      y += read();
    } else {
      i += 1;
      continue;
    }
    points.push({ x, y });
  }
  return points;
}

function polygonPoints(pointsAttr: string) {
  return pointsAttr.trim().split(/[\s,]+/).reduce<{ x: number; y: number }[]>((points, value, index, all) => {
    if (index % 2 === 1) {
      const x = Number(all[index - 1]);
      const y = Number(value);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
    return points;
  }, []);
}

export function scoreMouldMarkup(markup: string): MouldQuality {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.querySelector('parsererror') || svg.tagName.toLowerCase() !== 'svg') {
    return { ok: false, reason: 'invalid-svg', pathCount: 0, closedRatio: 0, outOfBounds: 0, tinyPaths: 0, cornerOnly: 0, hasCenterMotif: false };
  }
  const box = viewBox(svg);
  const shapes = [...svg.querySelectorAll('path, polygon')];
  let pathCount = 0;
  let closed = 0;
  let outOfBounds = 0;
  let tinyPaths = 0;
  let cornerOnly = 0;
  let hasCenterMotif = false;
  const pad = 0.75;
  const tinyArea = box.w * box.h * 0.004;
  const center = {
    x1: box.x + box.w * 0.28,
    y1: box.y + box.h * 0.28,
    x2: box.x + box.w * 0.72,
    y2: box.y + box.h * 0.72,
  };
  const edge = Math.max(box.w, box.h) * 0.18;

  for (const node of shapes) {
    const name = node.tagName.toLowerCase();
    if (name === 'rect' || node.getAttribute('data-region') === 'background') {
      continue;
    }
    const points = name === 'polygon'
      ? polygonPoints(node.getAttribute('points') ?? '')
      : pathPoints(node.getAttribute('d') ?? '');
    if (points.length < 3) {
      continue;
    }
    pathCount += 1;
    const d = node.getAttribute('d') ?? '';
    if (name === 'polygon' || /z/i.test(d)) {
      closed += 1;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    if (minX < box.x - pad || minY < box.y - pad || maxX > box.x + box.w + pad || maxY > box.y + box.h + pad) {
      outOfBounds += 1;
    }
    const area = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
    if (area < tinyArea) {
      tinyPaths += 1;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const inCorner = (
      (cx < box.x + edge || cx > box.x + box.w - edge)
      && (cy < box.y + edge || cy > box.y + box.h - edge)
    );
    const hitsCenter = !(maxX < center.x1 || minX > center.x2 || maxY < center.y1 || minY > center.y2);
    if (hitsCenter) {
      hasCenterMotif = true;
    } else if (inCorner) {
      cornerOnly += 1;
    }
  }

  const closedRatio = pathCount === 0 ? 0 : closed / pathCount;
  if (pathCount === 0) {
    return { ok: false, reason: 'empty', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  if (pathCount > MAX_PATHS) {
    return { ok: false, reason: 'too-complex', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  if (closedRatio < MIN_CLOSED_RATIO) {
    return { ok: false, reason: 'open-contours', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  if (outOfBounds / pathCount > MAX_OUT_OF_BOUNDS_RATIO) {
    return { ok: false, reason: 'invalid-bounds', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  if (tinyPaths / pathCount > MAX_TINY_RATIO) {
    return { ok: false, reason: 'fragments', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  if (!hasCenterMotif || cornerOnly / pathCount > MAX_CORNER_RATIO) {
    return { ok: false, reason: 'no-tile-module', pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
  }
  return { ok: true, pathCount, closedRatio, outOfBounds, tinyPaths, cornerOnly, hasCenterMotif };
}

export function isUntrustedTraceUrl(url?: string | null) {
  if (!url) {
    return false;
  }
  return /\/moulds\/imported\//i.test(url) || /\/_rejected\//i.test(url);
}
