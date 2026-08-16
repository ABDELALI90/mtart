const SVG_NS = 'http://www.w3.org/2000/svg';
export const TRACE_STROKE = '#666666';
export const TRACE_WIDTH = '1.5';
const DETECT_SIZE = 384;
const MIN_REGION_PIXELS = Math.round(DETECT_SIZE * DETECT_SIZE * 0.0012);
const MAX_REGIONS = 48;

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseViewBox(svg: Element): ViewBox {
  const raw = svg.getAttribute('viewBox');
  if (raw) {
    const parts = raw.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      const [x, y, w, h] = parts;
      if (w > 0 && h > 0) {
        return { x, y, w, h };
      }
    }
  }
  const width = parseFloat(svg.getAttribute('width') ?? '200') || 200;
  const height = parseFloat(svg.getAttribute('height') ?? '200') || 200;
  return { x: 0, y: 0, w: width, h: height };
}

export function copyRegionIdAttrs(root: ParentNode) {
  root.querySelectorAll('[data-region-id]:not([data-region])').forEach((node) => {
    node.setAttribute('data-region', node.getAttribute('data-region-id') ?? '');
  });
}

function localName(node: Element) {
  return node.tagName.toLowerCase().replace(/^svg:/, '');
}

export function isInsideTracing(node: Element) {
  return Boolean(node.closest('#tracing, .mould-outlines'));
}

function fillValue(node: Element) {
  return (node.getAttribute('fill') ?? '').trim().toLowerCase();
}

export function isFilledSurface(node: Element) {
  if (isInsideTracing(node)) {
    return false;
  }
  const fill = fillValue(node);
  if (fill === 'none' || fill === 'transparent') {
    return false;
  }
  const name = localName(node);
  return name === 'path' || name === 'polygon' || name === 'rect' || name === 'circle' || name === 'ellipse';
}

export function isBackgroundRect(node: Element, vb: ViewBox) {
  if (localName(node) !== 'rect') {
    return false;
  }
  const width = parseFloat(node.getAttribute('width') ?? '0');
  const height = parseFloat(node.getAttribute('height') ?? '0');
  return width >= vb.w * 0.92 && height >= vb.h * 0.92;
}

export function countFilledSurfaces(svg: Element) {
  return [...svg.querySelectorAll('path, polygon, rect, circle, ellipse')].filter((node) => isFilledSurface(node)).length;
}

export function dilateBinary(ink: Uint8Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return ink.slice();
  }
  const out = ink.slice();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!ink[y * width + x]) {
        continue;
      }
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            out[ny * width + nx] = 1;
          }
        }
      }
    }
  }
  return out;
}

export function erodeBinary(ink: Uint8Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return ink.slice();
  }
  const out = new Uint8Array(ink.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!ink[y * width + x]) {
        continue;
      }
      let keep = 1;
      for (let dy = -radius; dy <= radius && keep; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !ink[ny * width + nx]) {
            keep = 0;
            break;
          }
        }
      }
      out[y * width + x] = keep;
    }
  }
  return out;
}

export function morphClose(ink: Uint8Array, width: number, height: number, dilateRadius = 2, erodeRadius = 1) {
  return erodeBinary(dilateBinary(ink, width, height, dilateRadius), width, height, erodeRadius);
}

function flood(
  labels: Int32Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  from: number,
  to: number,
) {
  const start = y0 * width + x0;
  if (labels[start] !== from) {
    return 0;
  }
  const queue = [x0, y0];
  let head = 0;
  let area = 0;
  while (head < queue.length) {
    const x = queue[head];
    const y = queue[head + 1];
    head += 2;
    const index = y * width + x;
    if (labels[index] !== from) {
      continue;
    }
    labels[index] = to;
    area += 1;
    if (x > 0) {
      queue.push(x - 1, y);
    }
    if (x + 1 < width) {
      queue.push(x + 1, y);
    }
    if (y > 0) {
      queue.push(x, y - 1);
    }
    if (y + 1 < height) {
      queue.push(x, y + 1);
    }
  }
  return area;
}

export function labelEnclosedRegions(ink: Uint8Array, width: number, height: number, minArea = MIN_REGION_PIXELS) {
  const labels = new Int32Array(width * height);
  for (let i = 0; i < labels.length; i += 1) {
    labels[i] = ink[i] ? -1 : 0;
  }

  const markBorder = (x: number, y: number) => {
    if (labels[y * width + x] === 0) {
      flood(labels, width, height, x, y, 0, -2);
    }
  };
  for (let x = 0; x < width; x += 1) {
    markBorder(x, 0);
    markBorder(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    markBorder(0, y);
    markBorder(width - 1, y);
  }

  const areas = new Map<number, number>();
  let next = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (labels[y * width + x] !== 0) {
        continue;
      }
      const area = flood(labels, width, height, x, y, 0, next);
      if (area < minArea) {
        flood(labels, width, height, x, y, next, -2);
        continue;
      }
      areas.set(next, area);
      next += 1;
      if (areas.size >= MAX_REGIONS) {
        return { labels, areas };
      }
    }
  }
  return { labels, areas };
}

const N8: Array<[number, number]> = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

export function traceOuterContour(labels: Int32Array, id: number, width: number, height: number) {
  let sx = -1;
  let sy = -1;
  for (let y = 0; y < height && sx < 0; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (labels[y * width + x] === id) {
        sx = x;
        sy = y;
        break;
      }
    }
  }
  if (sx < 0) {
    return [] as Array<[number, number]>;
  }

  const points: Array<[number, number]> = [];
  let x = sx;
  let y = sy;
  let dir = 0;
  let guard = width * height * 8;
  do {
    points.push([x + 0.5, y + 0.5]);
    let found = false;
    for (let step = 0; step < 8; step += 1) {
      const look = (dir + 6 + step) % 8;
      const nx = x + N8[look][0];
      const ny = y + N8[look][1];
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && labels[ny * width + nx] === id) {
        x = nx;
        y = ny;
        dir = look;
        found = true;
        break;
      }
    }
    if (!found) {
      break;
    }
    guard -= 1;
  } while ((x !== sx || y !== sy) && guard > 0);

  return simplifyContour(points, 1.35);
}

function simplifyContour(points: Array<[number, number]>, epsilon: number) {
  if (points.length < 8) {
    return points;
  }
  return rdp(points, epsilon);
}

function rdp(points: Array<[number, number]>, epsilon: number): Array<[number, number]> {
  if (points.length < 3) {
    return points;
  }
  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = pointLineDistance(points[i], first, last);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function pointLineDistance(point: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  return Math.abs(dy * point[0] - dx * point[1] + b[0] * a[1] - b[1] * a[0]) / length;
}

function pointsToPath(points: Array<[number, number]>, vb: ViewBox, size: number) {
  if (points.length < 3) {
    return '';
  }
  const toVb = (px: number, py: number) => [
    +(vb.x + (px / size) * vb.w).toFixed(2),
    +(vb.y + (py / size) * vb.h).toFixed(2),
  ];
  const [x0, y0] = toVb(points[0][0], points[0][1]);
  let d = `M${x0} ${y0}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = toVb(points[i][0], points[i][1]);
    d += `L${x} ${y}`;
  }
  return `${d}Z`;
}

function matchGroupFromGeometry(area: number, bounds: { w: number; h: number }) {
  const areaBucket = Math.max(1, Math.round(area / 90));
  const aspect = bounds.h > 0 ? Math.round((bounds.w / bounds.h) * 8) : 8;
  return `match-${areaBucket}-${aspect}`;
}

function boundsOfLabel(labels: Int32Array, id: number, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (labels[y * width + x] !== id) {
        continue;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { w: Math.max(1, maxX - minX + 1), h: Math.max(1, maxY - minY + 1) };
}

function strokeShape(ctx: CanvasRenderingContext2D, node: Element, vb: ViewBox) {
  const name = localName(node);
  const transform = node.getAttribute('transform');
  if (transform) {
    ctx.save();
    applySvgTransform(ctx, transform);
  }
  try {
    if (name === 'path') {
      const d = node.getAttribute('d');
      if (!d) {
        return;
      }
      strokePathData(ctx, d);
      return;
    }
    if (name === 'polygon' || name === 'polyline') {
      const points = parsePoints(node.getAttribute('points') ?? '');
      if (points.length < 2) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      if (name === 'polygon') {
        ctx.closePath();
      }
      ctx.stroke();
      return;
    }
    if (name === 'line') {
      ctx.beginPath();
      ctx.moveTo(parseFloat(node.getAttribute('x1') ?? '0'), parseFloat(node.getAttribute('y1') ?? '0'));
      ctx.lineTo(parseFloat(node.getAttribute('x2') ?? '0'), parseFloat(node.getAttribute('y2') ?? '0'));
      ctx.stroke();
      return;
    }
    if (name === 'circle') {
      ctx.beginPath();
      ctx.arc(
        parseFloat(node.getAttribute('cx') ?? '0'),
        parseFloat(node.getAttribute('cy') ?? '0'),
        parseFloat(node.getAttribute('r') ?? '0'),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      return;
    }
    if (name === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(
        parseFloat(node.getAttribute('cx') ?? '0'),
        parseFloat(node.getAttribute('cy') ?? '0'),
        parseFloat(node.getAttribute('rx') ?? '0'),
        parseFloat(node.getAttribute('ry') ?? '0'),
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      return;
    }
    if (name === 'rect' && !isBackgroundRect(node, vb)) {
      const x = parseFloat(node.getAttribute('x') ?? '0');
      const y = parseFloat(node.getAttribute('y') ?? '0');
      const w = parseFloat(node.getAttribute('width') ?? '0');
      const h = parseFloat(node.getAttribute('height') ?? '0');
      if (w > 0 && h > 0) {
        ctx.strokeRect(x, y, w, h);
      }
    }
  } finally {
    if (transform) {
      ctx.restore();
    }
  }
}

function strokePathData(ctx: CanvasRenderingContext2D, d: string) {
  if (typeof Path2D !== 'undefined') {
    try {
      ctx.stroke(new Path2D(d));
      return;
    } catch {
      // fall through to command playback
    }
  }
  playPath(ctx, d);
  ctx.stroke();
}

function playPath(ctx: CanvasRenderingContext2D, d: string) {
  const tokens = d.match(/[MmLlHhVvCcQqTtSsAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  ctx.beginPath();
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = 'M';
  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token;
      i += 1;
      if (cmd === 'Z' || cmd === 'z') {
        ctx.closePath();
        cx = sx;
        cy = sy;
      }
      continue;
    }
    const num = () => {
      const value = Number(tokens[i] ?? 0);
      i += 1;
      return value;
    };
    if (cmd === 'M' || cmd === 'm') {
      const x = num();
      const y = num();
      if (cmd === 'M') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      ctx.moveTo(cx, cy);
      sx = cx;
      sy = cy;
      cmd = cmd === 'M' ? 'L' : 'l';
      continue;
    }
    if (cmd === 'L' || cmd === 'l') {
      const x = num();
      const y = num();
      if (cmd === 'L') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      ctx.lineTo(cx, cy);
      continue;
    }
    if (cmd === 'H' || cmd === 'h') {
      cx = cmd === 'H' ? num() : cx + num();
      ctx.lineTo(cx, cy);
      continue;
    }
    if (cmd === 'V' || cmd === 'v') {
      cy = cmd === 'V' ? num() : cy + num();
      ctx.lineTo(cx, cy);
      continue;
    }
    if (cmd === 'C' || cmd === 'c') {
      const x1 = cmd === 'C' ? num() : cx + num();
      const y1 = cmd === 'C' ? num() : cy + num();
      const x2 = cmd === 'C' ? num() : cx + num();
      const y2 = cmd === 'C' ? num() : cy + num();
      const x = cmd === 'C' ? num() : cx + num();
      const y = cmd === 'C' ? num() : cy + num();
      ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
      cx = x;
      cy = y;
      continue;
    }
    if (cmd === 'Q' || cmd === 'q') {
      const x1 = cmd === 'Q' ? num() : cx + num();
      const y1 = cmd === 'Q' ? num() : cy + num();
      const x = cmd === 'Q' ? num() : cx + num();
      const y = cmd === 'Q' ? num() : cy + num();
      ctx.quadraticCurveTo(x1, y1, x, y);
      cx = x;
      cy = y;
      continue;
    }
    num();
  }
}

function parsePoints(raw: string) {
  const nums = raw.trim().split(/[\s,]+/).map(Number).filter((value) => Number.isFinite(value));
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push([nums[i], nums[i + 1]]);
  }
  return points;
}

function applySvgTransform(ctx: CanvasRenderingContext2D, transform: string) {
  const translate = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transform);
  if (translate) {
    ctx.translate(Number(translate[1]), Number(translate[2]));
  }
  const scale = /scale\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?\s*\)/.exec(transform);
  if (scale) {
    ctx.scale(Number(scale[1]), Number(scale[2] ?? scale[1]));
  }
}

function rasterizeStrokes(svg: SVGSVGElement, vb: ViewBox) {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = DETECT_SIZE;
  canvas.height = DETECT_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DETECT_SIZE, DETECT_SIZE);
  ctx.setTransform(DETECT_SIZE / vb.w, 0, 0, DETECT_SIZE / vb.h, -vb.x * (DETECT_SIZE / vb.w), -vb.y * (DETECT_SIZE / vb.h));
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(vb.w, vb.h) * (2.6 / DETECT_SIZE);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const shapes = svg.querySelectorAll('path, polygon, polyline, line, circle, ellipse, rect');
  shapes.forEach((node) => {
    if (isBackgroundRect(node, vb)) {
      return;
    }
    if (isFilledSurface(node) && fillValue(node) !== '' && fillValue(node) !== 'none') {
      const stroke = (node.getAttribute('stroke') ?? '').trim().toLowerCase();
      if (!stroke || stroke === 'none') {
        return;
      }
    }
    strokeShape(ctx, node, vb);
  });

  const image = ctx.getImageData(0, 0, DETECT_SIZE, DETECT_SIZE);
  const ink = new Uint8Array(DETECT_SIZE * DETECT_SIZE);
  for (let i = 0, p = 0; i < ink.length; i += 1, p += 4) {
    ink[i] = image.data[p] < 128 ? 1 : 0;
  }
  return morphClose(ink, DETECT_SIZE, DETECT_SIZE, 2, 1);
}

function ensureBackgroundRect(svg: SVGSVGElement, vb: ViewBox) {
  const existing = [...svg.querySelectorAll('rect')].find((node) => isBackgroundRect(node, vb));
  if (existing) {
    if (!existing.getAttribute('data-region')) {
      existing.setAttribute('data-region', 'background');
    }
    if (!existing.getAttribute('data-region-id')) {
      existing.setAttribute('data-region-id', existing.getAttribute('data-region') ?? 'background');
    }
    if (!existing.getAttribute('fill') || fillValue(existing) === 'none') {
      existing.setAttribute('fill', '#FFFFFF');
    }
    return existing;
  }
  const rect = svg.ownerDocument.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('data-region', 'background');
  rect.setAttribute('data-region-id', 'background');
  rect.setAttribute('data-match-group', 'background');
  rect.setAttribute('x', String(vb.x));
  rect.setAttribute('y', String(vb.y));
  rect.setAttribute('width', String(vb.w));
  rect.setAttribute('height', String(vb.h));
  rect.setAttribute('fill', '#FFFFFF');
  rect.setAttribute('stroke', 'none');
  svg.insertBefore(rect, svg.firstChild);
  return rect;
}

function shoelace(points: Array<[number, number]>) {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function polylineFromPath(d: string) {
  const tokens = d.match(/[MmLlHhVvZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const points: Array<[number, number]> = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let cmd = 'M';
  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token;
      i += 1;
      continue;
    }
    const num = () => {
      const value = Number(tokens[i] ?? 0);
      i += 1;
      return value;
    };
    if (cmd === 'M' || cmd === 'm' || cmd === 'L' || cmd === 'l') {
      const x = num();
      const y = num();
      if (cmd === 'M' || cmd === 'L') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      points.push([cx, cy]);
      if (cmd === 'M') cmd = 'L';
      if (cmd === 'm') cmd = 'l';
      continue;
    }
    if (cmd === 'H' || cmd === 'h') {
      cx = cmd === 'H' ? num() : cx + num();
      points.push([cx, cy]);
      continue;
    }
    if (cmd === 'V' || cmd === 'v') {
      cy = cmd === 'V' ? num() : cy + num();
      points.push([cx, cy]);
      continue;
    }
    num();
  }
  return points;
}

export function extractClosedSubpaths(d: string, closeGap = 3) {
  const chunks = d.split(/(?=[Mm])/).map((part) => part.trim()).filter(Boolean);
  const closed: string[] = [];
  for (const chunk of chunks) {
    if (/[zZ]/.test(chunk)) {
      closed.push(/[zZ]\s*$/.test(chunk) ? chunk : `${chunk}Z`);
      continue;
    }
    const points = polylineFromPath(chunk);
    if (points.length < 3) {
      continue;
    }
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= closeGap) {
      closed.push(`${chunk}Z`);
    }
  }
  return closed;
}

function appendFillRegion(svg: SVGSVGElement, d: string, index: number, area: number, bounds: { w: number; h: number }) {
  const path = svg.ownerDocument.createElementNS(SVG_NS, 'path');
  const regionId = `region-${index}`;
  path.setAttribute('d', d);
  path.setAttribute('fill', '#FFFFFF');
  path.setAttribute('stroke', 'none');
  path.setAttribute('data-region', regionId);
  path.setAttribute('data-region-id', regionId);
  path.setAttribute('data-match-group', matchGroupFromGeometry(area, bounds));
  path.setAttribute('data-detected', 'true');
  svg.appendChild(path);
}

export function addRegionsFromClosedStrokes(svg: SVGSVGElement) {
  const vb = parseViewBox(svg);
  const minArea = vb.w * vb.h * 0.0012;
  const candidates: Array<{ d: string; area: number; bounds: { w: number; h: number } }> = [];

  svg.querySelectorAll('path, polygon, circle, ellipse, rect').forEach((node) => {
    if (isBackgroundRect(node, vb) || (isFilledSurface(node) && !isInsideTracing(node))) {
      return;
    }
    const name = localName(node);
    if (name === 'polygon') {
      const points = parsePoints(node.getAttribute('points') ?? '');
      if (points.length < 3) {
        return;
      }
      const d = `M${points.map((point) => point.join(' ')).join('L')}Z`;
      const xs = points.map((point) => point[0]);
      const ys = points.map((point) => point[1]);
      candidates.push({
        d,
        area: shoelace(points),
        bounds: { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) },
      });
      return;
    }
    if (name === 'circle') {
      const cx = parseFloat(node.getAttribute('cx') ?? '0');
      const cy = parseFloat(node.getAttribute('cy') ?? '0');
      const r = parseFloat(node.getAttribute('r') ?? '0');
      if (r <= 0) {
        return;
      }
      candidates.push({
        d: `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`,
        area: Math.PI * r * r,
        bounds: { w: r * 2, h: r * 2 },
      });
      return;
    }
    if (name === 'rect') {
      const x = parseFloat(node.getAttribute('x') ?? '0');
      const y = parseFloat(node.getAttribute('y') ?? '0');
      const w = parseFloat(node.getAttribute('width') ?? '0');
      const h = parseFloat(node.getAttribute('height') ?? '0');
      if (w <= 0 || h <= 0) {
        return;
      }
      candidates.push({
        d: `M${x} ${y}H${x + w}V${y + h}H${x}Z`,
        area: w * h,
        bounds: { w, h },
      });
      return;
    }
    if (name !== 'path') {
      return;
    }
    const gap = Math.max(vb.w, vb.h) * 0.018;
    extractClosedSubpaths(node.getAttribute('d') ?? '', gap).forEach((d) => {
      const points = polylineFromPath(d);
      const xs = points.map((point) => point[0]);
      const ys = points.map((point) => point[1]);
      const area = shoelace(points);
      if (area < minArea) {
        return;
      }
      candidates.push({
        d,
        area,
        bounds: {
          w: (xs.length ? Math.max(...xs) - Math.min(...xs) : 1),
          h: (ys.length ? Math.max(...ys) - Math.min(...ys) : 1),
        },
      });
    });
  });

  candidates.sort((a, b) => b.area - a.area);
  ensureBackgroundRect(svg, vb);
  candidates.slice(0, MAX_REGIONS).forEach((item, index) => {
    appendFillRegion(svg, item.d, index + 1, item.area, item.bounds);
  });
  return candidates.length;
}

export function detectClosedRegionsFromStrokes(svg: SVGSVGElement) {
  const vb = parseViewBox(svg);
  const ink = rasterizeStrokes(svg, vb);
  if (!ink) {
    return 0;
  }
  const { labels, areas } = labelEnclosedRegions(ink, DETECT_SIZE, DETECT_SIZE);
  const ranked = [...areas.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return 0;
  }

  ensureBackgroundRect(svg, vb);
  let created = 0;
  ranked.forEach(([id, area], index) => {
    const contour = traceOuterContour(labels, id, DETECT_SIZE, DETECT_SIZE);
    const d = pointsToPath(contour, vb, DETECT_SIZE);
    if (!d) {
      return;
    }
    const path = svg.ownerDocument.createElementNS(SVG_NS, 'path');
    const regionId = `region-${index + 1}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', '#FFFFFF');
    path.setAttribute('stroke', 'none');
    path.setAttribute('data-region', regionId);
    path.setAttribute('data-region-id', regionId);
    path.setAttribute('data-match-group', matchGroupFromGeometry(area, boundsOfLabel(labels, id, DETECT_SIZE, DETECT_SIZE)));
    path.setAttribute('data-detected', 'true');
    svg.appendChild(path);
    created += 1;
  });
  return created;
}

function isNearWhite(color: string) {
  const value = color.trim().toLowerCase();
  return value === '#fff' || value === '#ffffff' || value === 'white' || value === 'rgb(255,255,255)' || value === 'rgb(255, 255, 255)';
}

function inheritedAttribute(node: Element, name: string) {
  let current: Element | null = node;
  while (current) {
    const value = (current.getAttribute(name) ?? '').trim();
    if (value) {
      return value;
    }
    current = current.parentElement;
  }
  return '';
}

export function bakeTracingStroke(node: Element) {
  const stroke = inheritedAttribute(node, 'stroke');
  const width = inheritedAttribute(node, 'stroke-width');
  const join = inheritedAttribute(node, 'stroke-linejoin');
  const cap = inheritedAttribute(node, 'stroke-linecap');
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', !stroke || stroke.toLowerCase() === 'none' || isNearWhite(stroke) ? TRACE_STROKE : stroke);
  node.setAttribute('stroke-width', width && width !== '0' ? width : TRACE_WIDTH);
  if (join) {
    node.setAttribute('stroke-linejoin', join);
  }
  if (cap) {
    node.setAttribute('stroke-linecap', cap);
  }
  if (!node.getAttribute('vector-effect')) {
    node.setAttribute('vector-effect', 'non-scaling-stroke');
  }
  node.setAttribute('pointer-events', 'none');
}

function ensureLayer(svg: SVGSVGElement, id: string, pointerEvents?: string) {
  const existing = svg.querySelector(`#${id}`);
  if (existing) {
    if (pointerEvents) {
      existing.setAttribute('pointer-events', pointerEvents);
    }
    if (id === 'tracing') {
      existing.setAttribute('fill', 'none');
      if (!existing.getAttribute('stroke') || existing.getAttribute('stroke') === 'none') {
        existing.setAttribute('stroke', TRACE_STROKE);
      }
      if (!existing.getAttribute('stroke-width')) {
        existing.setAttribute('stroke-width', TRACE_WIDTH);
      }
    }
    return existing;
  }
  const group = svg.ownerDocument.createElementNS(SVG_NS, 'g');
  group.setAttribute('id', id);
  if (pointerEvents) {
    group.setAttribute('pointer-events', pointerEvents);
  }
  if (id === 'tracing') {
    group.setAttribute('fill', 'none');
    group.setAttribute('stroke', TRACE_STROKE);
    group.setAttribute('stroke-width', TRACE_WIDTH);
    group.setAttribute('stroke-linejoin', 'round');
    group.setAttribute('stroke-linecap', 'round');
  }
  svg.appendChild(group);
  return group;
}

export function splitFillAndTracing(svg: SVGSVGElement) {
  const vb = parseViewBox(svg);
  const colorG = ensureLayer(svg, 'color-regions');
  const traceG = ensureLayer(svg, 'tracing', 'none');
  if (!traceG.getAttribute('class')?.includes('mould-outlines')) {
    traceG.setAttribute('class', `${traceG.getAttribute('class') ?? ''} mould-outlines`.trim());
  }

  const shapes = [...svg.querySelectorAll('path, polygon, polyline, line, circle, ellipse, rect')];
  for (const node of shapes) {
    if (colorG.contains(node) || traceG.contains(node)) {
      continue;
    }
    if (isFilledSurface(node) || (localName(node) === 'rect' && isBackgroundRect(node, vb))) {
      const stroke = (node.getAttribute('stroke') ?? '').trim();
      const hasOwnStroke = Boolean(stroke) && stroke.toLowerCase() !== 'none';
      if (hasOwnStroke && !node.getAttribute('data-detected')) {
        const clone = node.cloneNode(true) as Element;
        clone.removeAttribute('data-region');
        clone.removeAttribute('data-region-id');
        clone.removeAttribute('data-match-group');
        clone.removeAttribute('data-selected');
        clone.setAttribute('fill', 'none');
        clone.setAttribute('stroke', stroke);
        clone.setAttribute('pointer-events', 'none');
        if (!clone.getAttribute('stroke-width')) {
          clone.setAttribute('stroke-width', '1.5');
        }
        if (!clone.getAttribute('vector-effect')) {
          clone.setAttribute('vector-effect', 'non-scaling-stroke');
        }
        traceG.appendChild(clone);
      }
      node.setAttribute('stroke', 'none');
      (node as SVGElement).style.cursor = 'pointer';
      colorG.appendChild(node);
      continue;
    }
    bakeTracingStroke(node);
    traceG.appendChild(node);
  }

  svg.querySelectorAll('g.mould-outlines').forEach((group) => {
    if (group.getAttribute('id') === 'tracing') {
      return;
    }
    if (!group.querySelector('path, polygon, polyline, line, circle, ellipse, rect')) {
      group.remove();
    }
  });

  svg.appendChild(colorG);
  svg.appendChild(traceG);
}

export function uniquifyColorRegions(svg: SVGSVGElement) {
  const nodes = [...svg.querySelectorAll('#color-regions [data-region], #color-regions [data-region-id], #color-regions path, #color-regions polygon, #color-regions rect, #color-regions circle, #color-regions ellipse')];
  const seen = new Set<Element>();
  let next = 1;
  for (const node of nodes) {
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);
    const original = node.getAttribute('data-region') || node.getAttribute('data-region-id') || '';
    const group = node.getAttribute('data-match-group') || original || `match-${next}`;
    if (original === 'background' || (localName(node) === 'rect' && isBackgroundRect(node, parseViewBox(svg)))) {
      node.setAttribute('data-region', 'background');
      node.setAttribute('data-region-id', 'background');
      node.setAttribute('data-match-group', 'background');
      continue;
    }
    if (!node.getAttribute('data-match-group')) {
      node.setAttribute('data-match-group', group || `match-${next}`);
    }
    if (!original) {
      const id = `region-${next}`;
      next += 1;
      node.setAttribute('data-region', id);
      node.setAttribute('data-region-id', id);
      continue;
    }
  }

  const groups = new Map<string, Element[]>();
  [...svg.querySelectorAll('#color-regions [data-region]')].forEach((node) => {
    const key = node.getAttribute('data-region') ?? '';
    if (key === 'background') {
      return;
    }
    const list = groups.get(key) ?? [];
    list.push(node);
    groups.set(key, list);
  });
  groups.forEach((list, key) => {
    if (list.length < 2) {
      return;
    }
    list.forEach((node, index) => {
      if (!node.getAttribute('data-match-group')) {
        node.setAttribute('data-match-group', key);
      }
      const unique = `${key}__${index}`;
      node.setAttribute('data-region', unique);
      node.setAttribute('data-region-id', unique);
    });
  });

  let unnamed = 1;
  svg.querySelectorAll('#color-regions path, #color-regions polygon, #color-regions rect, #color-regions circle, #color-regions ellipse').forEach((node) => {
    if (node.getAttribute('data-region')) {
      return;
    }
    const id = `region-${unnamed}`;
    unnamed += 1;
    node.setAttribute('data-region', id);
    node.setAttribute('data-region-id', id);
    if (!node.getAttribute('data-match-group')) {
      node.setAttribute('data-match-group', id);
    }
  });
}

export function matchingRegionIds(root: ParentNode, regionId: string) {
  const node = root.querySelector(`[data-region="${cssAttr(regionId)}"], [data-region-id="${cssAttr(regionId)}"]`);
  const group = node?.getAttribute('data-match-group');
  if (!node || !group) {
    return [regionId];
  }
  const ids = [...root.querySelectorAll(`[data-match-group="${cssAttr(group)}"]`)]
    .map((item) => item.getAttribute('data-region') ?? item.getAttribute('data-region-id'))
    .filter((value): value is string => Boolean(value));
  return ids.length > 0 ? [...new Set(ids)] : [regionId];
}

function cssAttr(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function ensureColorableSvg(svg: SVGSVGElement) {
  copyRegionIdAttrs(svg);
  if (countFilledSurfaces(svg) <= 1) {
    addRegionsFromClosedStrokes(svg);
  }
  if (countFilledSurfaces(svg) <= 1) {
    detectClosedRegionsFromStrokes(svg);
  }
  splitFillAndTracing(svg);
  uniquifyColorRegions(svg);
}
