/**
 * Offline conversion of imported tile-pattern photographs into editable SVG moulds.
 * Does not wrap JPGs in <svg>. Does not keep source colours as fills.
 *
 * source image → crop repeat unit → quantize colours → closed regions → simplified SVG
 */
import fs from 'node:fs';
import nodePath from 'node:path';
import sharp from 'sharp';

const WEB = nodePath.resolve(import.meta.dirname, '..');
const REPO = nodePath.resolve(WEB, '../../..');
const EXTRACTED = nodePath.join(REPO, 'import', 'extracted', 'images');
const CATALOGUE = nodePath.join(WEB, 'public', 'moulds', 'catalogue.json');
const OUT_DIR = nodePath.join(WEB, 'public', 'moulds', 'imported');
const REPORT = nodePath.join(WEB, 'public', 'moulds', 'vectorization-report.json');
const IMPORTED_MANIFEST = nodePath.resolve(
  WEB,
  '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/imported-mould-manifest.json',
);

const SIZE = 180;
const MIN_REGION_RATIO = 0.012;
const MAX_REGIONS = 8;
const MIN_REGIONS = 2;
const STROKE = '#666666';
const FILL = '#ffffff';

function round(n) {
  return Math.round(n * 100) / 100;
}

function dist2(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function kmeans(pixels, k, rounds = 10) {
  const n = pixels.length / 4;
  const centers = [];
  const step = Math.max(1, Math.floor(n / (k * 7)));
  for (let i = 0; i < n && centers.length < k; i += step) {
    const idx = i * 4;
    const color = [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
    if (!centers.some((c) => dist2(c, color) < 900)) {
      centers.push(color);
    }
  }
  while (centers.length < k) {
    const idx = Math.floor(Math.random() * n) * 4;
    centers.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
  }

  const assign = new Int16Array(n);
  for (let round = 0; round < rounds; round += 1) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i += 1) {
      const idx = i * 4;
      const color = [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centers.length; c += 1) {
        const d = dist2(centers[c], color);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
      sums[best][0] += color[0];
      sums[best][1] += color[1];
      sums[best][2] += color[2];
      sums[best][3] += 1;
    }
    for (let c = 0; c < centers.length; c += 1) {
      if (sums[c][3] === 0) {
        continue;
      }
      centers[c] = [
        sums[c][0] / sums[c][3],
        sums[c][1] / sums[c][3],
        sums[c][2] / sums[c][3],
      ];
    }
  }
  return { centers: centers.map((c) => c.map((v) => Math.round(v))), assign };
}

function majorityFilter(labels, w, h, iterations = 2) {
  let current = Int16Array.from(labels);
  for (let n = 0; n < iterations; n += 1) {
    const next = new Int16Array(current.length);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const counts = new Map();
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
              continue;
            }
            const label = current[ny * w + nx];
            counts.set(label, (counts.get(label) ?? 0) + 1);
          }
        }
        let best = current[y * w + x];
        let bestN = 0;
        for (const [label, count] of counts) {
          if (count > bestN) {
            bestN = count;
            best = label;
          }
        }
        next[y * w + x] = best;
      }
    }
    current = next;
  }
  return current;
}

function connectedComponents(labels, w, h) {
  const seen = new Uint8Array(labels.length);
  const components = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < labels.length; i += 1) {
    if (seen[i]) {
      continue;
    }
    const color = labels[i];
    const stack = [i];
    seen[i] = 1;
    const pixels = [];
    while (stack.length) {
      const cur = stack.pop();
      pixels.push(cur);
      const x = cur % w;
      const y = Math.floor(cur / w);
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          continue;
        }
        const ni = ny * w + nx;
        if (!seen[ni] && labels[ni] === color) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    components.push({ color, pixels });
  }
  return components;
}

function absorbTiny(labels, components, w, h, minPixels) {
  const next = Int16Array.from(labels);
  for (const component of components) {
    if (component.pixels.length >= minPixels) {
      continue;
    }
    const neighborVotes = new Map();
    for (const i of component.pixels) {
      const x = i % w;
      const y = Math.floor(i / w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
          continue;
        }
        const label = labels[ny * w + nx];
        if (label !== component.color) {
          neighborVotes.set(label, (neighborVotes.get(label) ?? 0) + 1);
        }
      }
    }
    let replacement = component.color;
    let best = 0;
    for (const [label, count] of neighborVotes) {
      if (count > best) {
        best = count;
        replacement = label;
      }
    }
    for (const i of component.pixels) {
      next[i] = replacement;
    }
  }
  return next;
}

function traceContour(mask, w, h) {
  const start = mask.findIndex((v) => v === 1);
  if (start < 0) {
    return [];
  }
  const sx = start % w;
  const sy = Math.floor(start / w);
  const dirs = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];
  const points = [];
  let x = sx;
  let y = sy;
  let dir = 0;
  for (let step = 0; step < w * h * 2; step += 1) {
    points.push([x, y]);
    let found = false;
    for (let i = 0; i < 8; i += 1) {
      const look = (dir + 6 + i) % 8;
      const nx = x + dirs[look][0];
      const ny = y + dirs[look][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
        continue;
      }
      if (mask[ny * w + nx] === 1) {
        x = nx;
        y = ny;
        dir = look;
        found = true;
        break;
      }
    }
    if (!found || (x === sx && y === sy && points.length > 3)) {
      break;
    }
  }
  return points;
}

function rdp(points, epsilon) {
  if (points.length < 3) {
    return points;
  }
  let maxD = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const length = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = Math.abs(dy * points[i][0] - dx * points[i][1] + last[0] * first[1] - last[1] * first[0]) / length;
    if (d > maxD) {
      index = i;
      maxD = d;
    }
  }
  if (maxD > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function pathFrom(points, scale) {
  if (points.length < 3) {
    return null;
  }
  const cmds = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p[0] * scale)} ${round(p[1] * scale)}`);
  return `${cmds.join(' ')} Z`;
}

function borderScore(pixels, w, h) {
  let score = 0;
  for (const i of pixels) {
    const x = i % w;
    const y = Math.floor(i / w);
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
      score += 1;
    }
  }
  return score;
}

function downsampleDiff(a, b) {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / (n / 4);
}

function isBorderJunk(pixels, w, h) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (const i of pixels) {
    const x = i % w;
    const y = Math.floor(i / w);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const border = borderScore(pixels, w, h);
  const thinStrip = (bh < h * 0.38 && bw > w * 0.62) || (bw < w * 0.38 && bh > h * 0.62);
  const hugsEdge = minX <= 2 || minY <= 2 || maxX >= w - 3 || maxY >= h - 3;
  if (hugsEdge && thinStrip && border > 4) {
    return true;
  }
  const corners = (minX <= 1) + (minY <= 1) + (maxX >= w - 2) + (maxY >= h - 2);
  return corners >= 3 && border / pixels.length > 0.015;
}

function detectFrameInset(data, probe) {
  const at = (x, y) => {
    const i = (y * probe + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [at(0, 0), at(probe - 1, 0), at(0, probe - 1), at(probe - 1, probe - 1)];
  const avg = [0, 0, 0];
  for (const c of corners) {
    avg[0] += c[0];
    avg[1] += c[1];
    avg[2] += c[2];
  }
  avg[0] /= 4;
  avg[1] /= 4;
  avg[2] /= 4;
  const cornerSpread = Math.max(...corners.map((c) => dist2(c, avg)));
  if (cornerSpread > 2800) {
    return 0;
  }
  let inset = 0;
  for (let d = 0; d < Math.floor(probe * 0.2); d += 1) {
    let similar = 0;
    let total = 0;
    for (let i = d; i < probe - d; i += 1) {
      const samples = [
        at(i, d),
        at(i, probe - 1 - d),
        at(d, i),
        at(probe - 1 - d, i),
      ];
      for (const color of samples) {
        total += 1;
        if (dist2(color, avg) < 2000) {
          similar += 1;
        }
      }
    }
    if (similar / total > 0.7) {
      inset = d + 1;
    } else {
      break;
    }
  }
  return inset;
}

async function extractRepeatUnit(input) {
  const meta = await sharp(input).rotate().metadata();
  const width = meta.width ?? SIZE;
  const height = meta.height ?? SIZE;
  const side = Math.min(width, height);
  const left = Math.floor((width - side) / 2);
  const top = Math.floor((height - side) / 2);
  const square = sharp(input).rotate().extract({ left, top, width: side, height: side });

  let repeatUnit = '1x1';
  let repeatMode = 'straight';
  let crop = { left: 0, top: 0, width: side, height: side };

  const probe = 96;
  const { data } = await square.clone().resize(probe, probe, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frameInset = Math.floor((detectFrameInset(data, probe) / probe) * side);
  if (frameInset > 4) {
    const inner = side - frameInset * 2;
    if (inner > side * 0.55) {
      crop = { left: frameInset, top: frameInset, width: inner, height: inner };
    }
  }

  const innerProbe = await sharp(input)
    .rotate()
    .extract({ left: left + crop.left, top: top + crop.top, width: crop.width, height: crop.height })
    .resize(probe, probe, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  for (const n of [2, 3, 4]) {
    const cell = Math.floor(probe / n);
    const first = Buffer.alloc(cell * cell * 4);
    for (let y = 0; y < cell; y += 1) {
      innerProbe.copy(first, y * cell * 4, y * probe * 4, y * probe * 4 + cell * 4);
    }
    let ok = true;
    for (let gy = 0; gy < n && ok; gy += 1) {
      for (let gx = 0; gx < n && ok; gx += 1) {
        if (gx === 0 && gy === 0) {
          continue;
        }
        const other = Buffer.alloc(cell * cell * 4);
        for (let y = 0; y < cell; y += 1) {
          const src = ((gy * cell + y) * probe + gx * cell) * 4;
          innerProbe.copy(other, y * cell * 4, src, src + cell * 4);
        }
        if (downsampleDiff(first, other) > 38) {
          ok = false;
        }
      }
    }
    if (ok) {
      const unit = Math.floor(crop.width / n);
      crop = { left: crop.left, top: crop.top, width: unit, height: unit };
      repeatUnit = `${n}x${n}`;
      repeatMode = 'straight';
      break;
    }
  }

  const buffer = await sharp(input)
    .rotate()
    .extract({ left: left + crop.left, top: top + crop.top, width: crop.width, height: crop.height })
    .resize(SIZE, SIZE, { fit: 'fill' })
    .median(5)
    .ensureAlpha()
    .raw()
    .toBuffer();

  return { pixels: buffer, w: SIZE, h: SIZE, repeatUnit, repeatMode };
}

function labelsToSvg(labels, w, h) {
  const minPixels = Math.floor(w * h * MIN_REGION_RATIO);
  const components = connectedComponents(labels, w, h).filter((item) => item.pixels.length >= minPixels);
  const byColor = new Map();
  for (const component of components) {
    const list = byColor.get(component.color) ?? [];
    list.push(component);
    byColor.set(component.color, list);
  }
  const regions = [...byColor.entries()]
    .map(([color, items]) => ({
      color,
      pixels: items.flatMap((item) => item.pixels),
      parts: items,
      border: items.reduce((sum, item) => sum + borderScore(item.pixels, w, h), 0),
    }))
    .sort((a, b) => b.pixels.length - a.pixels.length);

  if (regions.length < MIN_REGIONS || regions.length > MAX_REGIONS) {
    return null;
  }

  const scale = 200 / w;
  const parts = [
    `<rect data-region="background" data-region-id="background" x="0" y="0" width="200" height="200" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5" vector-effect="non-scaling-stroke" />`,
  ];
  const regionMeta = [{ key: 'background', name: 'Background' }];
  let index = 1;
  const backgroundColor = regions[0].color;

  for (const region of regions) {
    if (region.color === backgroundColor) {
      continue;
    }
    const key = `region-${index}`;
    const added = [];
    for (const part of region.parts) {
      const mask = new Uint8Array(w * h);
      for (const i of part.pixels) {
        mask[i] = 1;
      }
      const contour = rdp(traceContour(mask, w, h), 2.4);
      const d = pathFrom(contour, scale);
      if (!d || contour.length < 5) {
        continue;
      }
      if (isBorderJunk(part.pixels, w, h)) {
        continue;
      }
      const xs = contour.map((p) => p[0]);
      const ys = contour.map((p) => p[1]);
      const bw = (Math.max(...xs) - Math.min(...xs)) * scale;
      const bh = (Math.max(...ys) - Math.min(...ys)) * scale;
      const hugsBorder = borderScore(part.pixels, w, h) > 18;
      if ((part.pixels.length > w * h * 0.55 && hugsBorder) || (bw * bh > 200 * 200 * 0.9 && hugsBorder)) {
        continue;
      }
      added.push(
        `<path data-region="${key}" data-region-id="${key}" d="${d}" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />`,
      );
    }
    if (added.length === 0) {
      continue;
    }
    regionMeta.push({ key, name: `Area ${index}` });
    parts.push(...added);
    index += 1;
  }

  const motifCount = parts.length - 1;
  if (motifCount < 1) {
    return null;
  }

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" preserveAspectRatio="xMidYMid meet">\n  ${parts.join('\n  ')}\n</svg>\n`;
  return { markup, regions: regionMeta };
}

function chooseK(pixels) {
  let best = null;
  for (const k of [3, 4, 5, 6]) {
    const { assign, centers } = kmeans(pixels, k);
    const filtered = majorityFilter(assign, SIZE, SIZE, 4);
    const minPixels = Math.floor(SIZE * SIZE * MIN_REGION_RATIO);
    const components = connectedComponents(filtered, SIZE, SIZE);
    const absorbed = absorbTiny(filtered, components, SIZE, SIZE, minPixels);
    const large = connectedComponents(absorbed, SIZE, SIZE).filter((item) => item.pixels.length >= minPixels);
    const colors = new Set(large.map((item) => item.color));
    if (colors.size < MIN_REGIONS || colors.size > MAX_REGIONS) {
      continue;
    }
    const score = Math.abs(4 - colors.size) * 10 + large.length;
    if (!best || score < best.score) {
      best = { labels: absorbed, k, centers, score, colors: colors.size };
    }
  }
  return best;
}

function resolveSource(entry) {
  const names = [];
  if (entry.sourceImage) {
    names.push(nodePath.basename(entry.sourceImage));
  }
  if (entry.thumbnail) {
    names.push(nodePath.basename(entry.thumbnail));
  }
  const dirs = [
    EXTRACTED,
    nodePath.join(WEB, 'public', 'images', 'import'),
    nodePath.join(WEB, 'public', 'images', 'catalog'),
    nodePath.join(WEB, 'public', 'images', 'catalog', 'web'),
  ];
  for (const name of names) {
    for (const dir of dirs) {
      const full = nodePath.join(dir, name);
      if (fs.existsSync(full)) {
        return full;
      }
    }
  }
  return null;
}

function looksSuitable(entry) {
  if (entry.status === 'photo-only' || entry.status === 'invalid') {
    return false;
  }
  const tags = (entry.tags ?? []).join(' ');
  if (/project|room|install|kitchen|stair/.test(tags)) {
    return false;
  }
  return Boolean(entry.sourceImage || entry.thumbnail);
}

async function vectorizeEntry(entry) {
  const source = resolveSource(entry);
  if (!source) {
    return { status: 'invalid', reason: 'missing-source' };
  }
  const extracted = await extractRepeatUnit(source);
  const chosen = chooseK(extracted.pixels);
  if (!chosen) {
    return { status: 'vectorization-failed', reason: 'no-stable-palette', repeatUnit: extracted.repeatUnit };
  }
  const svg = labelsToSvg(chosen.labels, extracted.w, extracted.h);
  if (!svg) {
    return { status: 'vectorization-failed', reason: 'no-clean-regions', repeatUnit: extracted.repeatUnit };
  }
  const svgUrl = `/moulds/imported/${entry.reference}.svg`;
  fs.writeFileSync(nodePath.join(OUT_DIR, `${entry.reference}.svg`), svg.markup);
  return {
    status: 'editable-svg',
    svgUrl,
    regions: svg.regions,
    repeatUnit: extracted.repeatUnit,
    repeatMode: extracted.repeatMode,
    regionCount: svg.regions.length,
  };
}

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = catalogue.items.filter((item) => item.reference.startsWith('MOR-') && looksSuitable(item));
const report = [];
let converted = 0;
let failed = 0;

for (const entry of targets) {
  try {
    const previousSvg = entry.svgUrl;
    const result = await vectorizeEntry(entry);
    report.push({ reference: entry.reference, source: entry.sourceImage, ...result });
    if (result.status === 'editable-svg') {
      converted += 1;
      entry.editable = true;
      entry.status = 'editable-svg';
      entry.svgUrl = result.svgUrl;
      entry.regions = result.regions;
      entry.repeatUnit = result.repeatUnit;
      entry.repeatMode = result.repeatMode;
      entry.displayOrder = Math.min(entry.displayOrder, 250);
    } else if (previousSvg && (entry.regions?.length ?? 0) >= 3) {
      entry.editable = true;
      entry.status = 'editable-svg';
      entry.svgUrl = previousSvg;
      report[report.length - 1].keptTemplate = previousSvg;
    } else {
      failed += 1;
      entry.status = result.status;
      entry.editable = false;
      if (!previousSvg || (entry.regions?.length ?? 0) < 3) {
        entry.svgUrl = null;
      }
    }
    console.log(entry.reference, result.status, result.regionCount ?? result.reason ?? '', result.repeatUnit ?? '');
  } catch (error) {
    failed += 1;
    entry.status = 'vectorization-failed';
    report.push({ reference: entry.reference, status: 'vectorization-failed', reason: String(error) });
    console.warn(entry.reference, 'error', error);
  }
}

catalogue.diagnostics = {
  ...catalogue.diagnostics,
  vectorizedImported: converted,
  vectorizationFailed: failed,
  editableSvgMoulds: catalogue.items.filter((item) => item.editable).length,
  rasterOnlyPatterns: catalogue.items.filter((item) => !item.editable).length,
};

fs.writeFileSync(CATALOGUE, `${JSON.stringify(catalogue, null, 2)}\n`);
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  nodePath.join(WEB, 'public', 'moulds', 'moulds.json'),
  `${JSON.stringify(
    catalogue.items.map((item) => ({
      reference: item.reference,
      source: item.sourceImage ?? item.thumbnail ?? null,
      status: item.status,
      svgUrl: item.editable ? item.svgUrl ?? null : null,
      editable: Boolean(item.editable),
    })),
    null,
    2,
  )}\n`,
);

if (fs.existsSync(IMPORTED_MANIFEST)) {
  const imported = JSON.parse(fs.readFileSync(IMPORTED_MANIFEST, 'utf8'));
  const byRef = Object.fromEntries(catalogue.items.map((item) => [item.reference, item]));
  for (const entry of imported) {
    const cat = byRef[entry.reference];
    if (!cat) {
      continue;
    }
    entry.status = cat.status;
    entry.editable = Boolean(cat.editable);
    entry.svg = cat.svgUrl ?? entry.svg ?? null;
    entry.regions = cat.regions ?? entry.regions ?? [];
    entry.repeatUnit = cat.repeatUnit ?? '1x1';
    entry.repeatMode = cat.repeatMode ?? 'straight';
  }
  fs.writeFileSync(IMPORTED_MANIFEST, `${JSON.stringify(imported, null, 2)}\n`);
}

console.log(`Vectorized ${converted} imported moulds, ${failed} skipped/failed`);
console.log(`Wrote ${OUT_DIR}`);
