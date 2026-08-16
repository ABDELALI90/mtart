/**
 * Generates original MT ART mould SVGs (empty geometry: white fill, grey stroke)
 * and a backend manifest. Re-run whenever new moulds are added.
 */
import fs from 'node:fs';
import nodePath from 'node:path';

const ROOT = nodePath.resolve(import.meta.dirname, '..');
const PUBLIC = nodePath.join(ROOT, 'public', 'moulds');
const MANIFEST = nodePath.resolve(ROOT, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/mould-manifest.json');

const FILL = '#ffffff';
const STROKE = '#6b6b6b';
const SW = 1.25;

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

function pts(list) {
  return list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

function pathFrom(list, close = true) {
  const [first, ...rest] = list;
  return `M${round(first[0])} ${round(first[1])} ${rest.map((p) => `L${round(p[0])} ${round(p[1])}`).join(' ')}${close ? ' Z' : ''}`;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function regular(n, cx, cy, r, rot = -90) {
  return Array.from({ length: n }, (_, i) => polar(cx, cy, r, rot + (i * 360) / n));
}

function star(n, cx, cy, outer, inner, rot = -90) {
  const ptsOut = [];
  for (let i = 0; i < n; i += 1) {
    ptsOut.push(polar(cx, cy, outer, rot + (i * 360) / n));
    ptsOut.push(polar(cx, cy, inner, rot + (i * 360) / n + 180 / n));
  }
  return ptsOut;
}

function khatem(cx, cy, r) {
  const a = r / Math.SQRT2;
  return [
    [cx + r, cy],
    [cx + a, cy + a],
    [cx, cy + r],
    [cx - a, cy + a],
    [cx - r, cy],
    [cx - a, cy - a],
    [cx, cy - r],
    [cx + a, cy - a],
  ];
}

function diamond(cx, cy, rx, ry) {
  return [
    [cx, cy - ry],
    [cx + rx, cy],
    [cx, cy + ry],
    [cx - rx, cy],
  ];
}

function cross(cx, cy, arm, thick) {
  const t = thick / 2;
  return [
    [cx - t, cy - arm],
    [cx + t, cy - arm],
    [cx + t, cy - t],
    [cx + arm, cy - t],
    [cx + arm, cy + t],
    [cx + t, cy + t],
    [cx + t, cy + arm],
    [cx - t, cy + arm],
    [cx - t, cy + t],
    [cx - arm, cy + t],
    [cx - arm, cy - t],
    [cx - t, cy - t],
  ];
}

function el(tag, attrs, d) {
  const body = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  if (d) {
    return `<${tag} ${body}>${d}</${tag}>`;
  }
  return `<${tag} ${body} />`;
}

function regionRect(key, extra = {}) {
  return el('rect', { 'data-region': key, x: 0, y: 0, width: 200, height: 200, fill: FILL, stroke: STROKE, 'stroke-width': SW, ...extra });
}

function regionPath(key, d) {
  return el('path', { 'data-region': key, d, fill: FILL, stroke: STROKE, 'stroke-width': SW, 'fill-rule': 'evenodd' });
}

function regionPoly(key, points) {
  return el('polygon', { 'data-region': key, points: pts(points), fill: FILL, stroke: STROKE, 'stroke-width': SW });
}

function regionCircle(key, cx, cy, r) {
  return el('circle', { 'data-region': key, cx, cy, r, fill: FILL, stroke: STROKE, 'stroke-width': SW });
}

function svg(parts) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">\n  ${parts.join('\n  ')}\n</svg>\n`;
}

function petals(n, cx, cy, r, inner) {
  const parts = [];
  for (let i = 0; i < n; i += 1) {
    const a = -90 + (i * 360) / n;
    const tip = polar(cx, cy, r, a);
    const left = polar(cx, cy, inner, a - 180 / n);
    const right = polar(cx, cy, inner, a + 180 / n);
    parts.push(`M${cx} ${cy} Q${round(left[0])} ${round(left[1])} ${round(tip[0])} ${round(tip[1])} Q${round(right[0])} ${round(right[1])} ${cx} ${cy} Z`);
  }
  return parts.join(' ');
}

const moulds = [];

function add(def) {
  moulds.push(def);
}

function bg(key = 'background') {
  return regionRect(key);
}

// —— Cement geometric / classic / floral / modern ——
add({
  reference: 'GEO-001', slug: 'star-4', name: 'Four Point Star', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('star', star(4, 100, 100, 78, 28))]),
});
add({
  reference: 'GEO-002', slug: 'star-6', name: 'Six Point Star', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('star', star(6, 100, 100, 78, 32))]),
});
add({
  reference: 'GEO-003', slug: 'star-8', name: 'Eight Point Star', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('star', star(8, 100, 100, 80, 34))]),
});
add({
  reference: 'GEO-004', slug: 'star-8-center', name: 'Eight Point Star with Center', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('star', star(8, 100, 100, 82, 36)), regionCircle('center', 100, 100, 18)]),
});
add({
  reference: 'GEO-005', slug: 'star-10', name: 'Ten Point Star', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('star', star(10, 100, 100, 80, 38))]),
});
add({
  reference: 'GEO-006', slug: 'star-12', name: 'Twelve Point Star', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('star', star(12, 100, 100, 82, 40)), regionCircle('center', 100, 100, 16)]),
});
add({
  reference: 'GEO-007', slug: 'diamond-field', name: 'Centered Diamond', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['diamond', 'Diamond']],
  markup: svg([bg(), regionPoly('diamond', diamond(100, 100, 70, 70))]),
});
add({
  reference: 'GEO-008', slug: 'rhombus-cross', name: 'Rhombus Cross', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['main', 'Main motif'], ['detail', 'Detail']],
  markup: svg([
    bg(),
    regionPoly('main', diamond(100, 100, 82, 52)),
    regionPoly('detail', diamond(100, 100, 28, 28)),
  ]),
});
add({
  reference: 'GEO-009', slug: 'hex-field', name: 'Hexagon', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['hex', 'Hexagon']],
  markup: svg([bg(), regionPoly('hex', regular(6, 100, 100, 78, 0))]),
});
add({
  reference: 'GEO-010', slug: 'octagon-field', name: 'Octagon', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['octagon', 'Octagon'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('octagon', regular(8, 100, 100, 80, 22.5)), regionCircle('center', 100, 100, 22)]),
});
add({
  reference: 'GEO-011', slug: 'triangle-pair', name: 'Opposed Triangles', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['a', 'Field A'], ['b', 'Field B']],
  markup: svg([
    bg(),
    regionPoly('a', [[20, 180], [180, 180], [100, 28]]),
    regionPoly('b', [[20, 20], [180, 20], [100, 172]]),
  ]),
});
add({
  reference: 'GEO-012', slug: 'cross-field', name: 'Cross', family: 'cement', category: 'shapes',
  regions: [['background', 'Background'], ['cross', 'Cross'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('cross', cross(100, 100, 78, 42)), regionCircle('center', 100, 100, 14)]),
});
add({
  reference: 'GEO-013', slug: 'rings-4', name: 'Four Rings', family: 'cement', category: 'classic',
  regions: [['outer', 'Outer'], ['ring', 'Ring'], ['inner', 'Inner'], ['center', 'Center']],
  markup: svg([
    regionRect('outer'),
    regionCircle('ring', 100, 100, 78),
    regionCircle('inner', 100, 100, 52),
    regionCircle('center', 100, 100, 24),
  ]),
});
add({
  reference: 'GEO-014', slug: 'quarter-fan', name: 'Quarter Fan', family: 'cement', category: 'modern',
  regions: [['background', 'Background'], ['north', 'North'], ['east', 'East'], ['west', 'West'], ['south', 'South']],
  markup: svg([
    bg(),
    regionPath('north', 'M100 100 L20 20 L180 20 Z'),
    regionPath('east', 'M100 100 L180 20 L180 180 Z'),
    regionPath('south', 'M100 100 L180 180 L20 180 Z'),
    regionPath('west', 'M100 100 L20 180 L20 20 Z'),
  ]),
});
add({
  reference: 'GEO-015', slug: 'frame-band', name: 'Frame Band', family: 'cement', category: 'borders',
  regions: [['field', 'Field'], ['border', 'Border'], ['inner', 'Inner']],
  markup: svg([
    regionRect('field'),
    regionPath('border', 'M12 12 H188 V188 H12 Z M28 28 V172 H172 V28 Z'),
    regionRect('inner', { x: 44, y: 44, width: 112, height: 112 }),
  ]),
});
add({
  reference: 'GEO-016', slug: 'quatre-diamond', name: 'Quatrefoil Diamond', family: 'cement', category: 'classic',
  regions: [['background', 'Background'], ['main', 'Main motif'], ['accent', 'Accent']],
  markup: svg([
    bg(),
    regionPath('main', 'M100 22 C132 22 178 68 178 100 C178 132 132 178 100 178 C68 178 22 132 22 100 C22 68 68 22 100 22 Z'),
    regionPoly('accent', diamond(100, 100, 22, 22)),
  ]),
});
add({
  reference: 'GEO-017', slug: 'blade-star', name: 'Five Blade Star', family: 'cement', category: 'shapes',
  regions: [['background', 'Background'], ['bladeA', 'Blade A'], ['bladeB', 'Blade B'], ['bladeC', 'Blade C'], ['bladeD', 'Blade D'], ['hub', 'Hub']],
  markup: svg([
    bg(),
    ...['bladeA', 'bladeB', 'bladeC', 'bladeD'].map((key, i) => {
      const a = -90 + i * 90;
      const tip = polar(100, 100, 86, a);
      const l = polar(100, 100, 18, a - 28);
      const r = polar(100, 100, 18, a + 28);
      return regionPath(key, pathFrom([l, tip, r]));
    }),
    regionCircle('hub', 100, 100, 20),
  ]),
});
add({
  reference: 'GEO-018', slug: 'nested-octagon', name: 'Nested Octagons', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['octagon', 'Octagon'], ['inner', 'Inner'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('octagon', regular(8, 100, 100, 84, 22.5)),
    regionPoly('inner', regular(8, 100, 100, 52, 22.5)),
    regionPoly('center', regular(8, 100, 100, 22, 22.5)),
  ]),
});
add({
  reference: 'GEO-019', slug: 'lattice-9', name: 'Nine Diamond Lattice', family: 'cement', category: 'geometric',
  regions: [['background', 'Background'], ['main', 'Lattice'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPath(
      'main',
      [40, 100, 160]
        .flatMap((y) => [40, 100, 160].map((x) => pathFrom(diamond(x, y, 22, 22))))
        .join(' '),
    ),
    regionPoly('center', diamond(100, 100, 16, 16)),
  ]),
});
add({
  reference: 'GEO-020', slug: 'floral-4', name: 'Four Petal', family: 'cement', category: 'floral',
  regions: [['background', 'Background'], ['petalA', 'Petal A'], ['petalB', 'Petal B'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPath('petalA', petals(4, 100, 100, 82, 28)),
    regionPath('petalB', petals(4, 100, 100, 54, 18)),
    regionCircle('center', 100, 100, 16),
  ]),
});
add({
  reference: 'GEO-021', slug: 'mono-circle', name: 'Circle Field', family: 'cement', category: 'monochrome',
  regions: [['background', 'Background'], ['main', 'Main motif']],
  markup: svg([bg(), regionCircle('main', 100, 100, 70)]),
});
add({
  reference: 'GEO-022', slug: 'corner-squares', name: 'Corner Squares', family: 'cement', category: 'modern',
  regions: [['field', 'Field'], ['corner', 'Corner'], ['center', 'Center']],
  markup: svg([
    regionRect('field'),
    regionPath('corner', 'M8 8 H52 V52 H8 Z M148 8 H192 V52 H148 Z M8 148 H52 V192 H8 Z M148 148 H192 V192 H148 Z'),
    regionPoly('center', regular(4, 100, 100, 36, 45)),
  ]),
});

// —— Zellige / Moroccan ——
add({
  reference: 'ZL-001', slug: 'khatem', name: 'Khatem Star', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('star', khatem(100, 100, 78)), regionPoly('center', regular(8, 100, 100, 22, 22.5))]),
});
add({
  reference: 'ZL-002', slug: 'moroccan-8', name: 'Moroccan Eight Point Star', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['star', 'Star'], ['ring', 'Ring'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('star', star(8, 100, 100, 84, 32)),
    regionCircle('ring', 100, 100, 36),
    regionCircle('center', 100, 100, 16),
  ]),
});
add({
  reference: 'ZL-003', slug: 'star-cross', name: 'Star and Cross', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['cross', 'Cross'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('cross', cross(100, 100, 86, 36)),
    regionPoly('star', star(8, 100, 100, 40, 16)),
    regionCircle('center', 100, 100, 10),
  ]),
});
add({
  reference: 'ZL-004', slug: 'rosette-8', name: 'Eight Petal Rosette', family: 'zellige', category: 'rosettes',
  regions: [['background', 'Background'], ['flower', 'Flower'], ['ring', 'Ring'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPath('flower', petals(8, 100, 100, 82, 30)),
    regionCircle('ring', 100, 100, 34),
    regionCircle('center', 100, 100, 14),
  ]),
});
add({
  reference: 'ZL-005', slug: 'radial-8', name: 'Eight Fold Radial', family: 'zellige', category: 'moorish',
  regions: [['background', 'Background'], ['main', 'Main motif'], ['inner', 'Inner'], ['center', 'Center'], ['detail', 'Detail']],
  markup: svg([
    bg(),
    regionPoly('main', regular(8, 100, 100, 86, 22.5)),
    regionPoly('inner', star(8, 100, 100, 58, 24)),
    regionPoly('center', regular(8, 100, 100, 28, 22.5)),
    regionCircle('detail', 100, 100, 10),
  ]),
});
add({
  reference: 'ZL-006', slug: 'diamond-ring', name: 'Diamond Ring', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['main', 'Diamonds'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPath(
      'main',
      Array.from({ length: 8 }, (_, i) => {
        const [x, y] = polar(100, 100, 62, -90 + i * 45);
        return pathFrom(diamond(x, y, 16, 22));
      }).join(' '),
    ),
    regionPoly('center', khatem(100, 100, 28)),
  ]),
});
add({
  reference: 'ZL-007', slug: 'interlace-oct', name: 'Interlaced Octagons', family: 'zellige', category: 'moorish',
  regions: [['background', 'Background'], ['octagon', 'Octagon'], ['inner', 'Inner']],
  markup: svg([
    bg(),
    regionPoly('octagon', regular(8, 100, 100, 82, 0)),
    regionPoly('inner', regular(8, 100, 100, 82, 22.5)),
  ]),
});
add({
  reference: 'ZL-008', slug: 'zellige-12', name: 'Twelve Point Zellige Star', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['star', 'Star'], ['hex', 'Hexagon'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('star', star(12, 100, 100, 84, 42)),
    regionPoly('hex', regular(6, 100, 100, 32, 0)),
    regionCircle('center', 100, 100, 12),
  ]),
});
add({
  reference: 'ZL-009', slug: 'hex-star', name: 'Hexagon and Star', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['hex', 'Hexagon'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('hex', regular(6, 100, 100, 84, 0)), regionPoly('star', star(6, 100, 100, 48, 20))]),
});
add({
  reference: 'ZL-010', slug: 'zellige-border', name: 'Zellige Border', family: 'zellige', category: 'moorish',
  regions: [['field', 'Field'], ['border', 'Border'], ['star', 'Star']],
  markup: svg([
    regionRect('field'),
    regionPath('border', 'M10 10 H190 V190 H10 Z M26 26 V174 H174 V26 Z'),
    regionPoly('star', star(8, 100, 100, 48, 20)),
  ]),
});
add({
  reference: 'ZL-011', slug: 'star-10-zellige', name: 'Ten Point Moroccan Star', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([bg(), regionPoly('star', star(10, 100, 100, 82, 34)), regionCircle('center', 100, 100, 16)]),
});
add({
  reference: 'ZL-012', slug: 'moorish-8', name: 'Moorish Eight Fold', family: 'zellige', category: 'moorish',
  regions: [['background', 'Background'], ['outer', 'Outer'], ['star', 'Star'], ['inner', 'Inner'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('outer', regular(16, 100, 100, 88, -90)),
    regionPoly('star', star(8, 100, 100, 70, 30)),
    regionPoly('inner', khatem(100, 100, 32)),
    regionCircle('center', 100, 100, 10),
  ]),
});
add({
  reference: 'ZL-013', slug: 'khatem-grid', name: 'Khatem Grid', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['main', 'Main motif']],
  markup: svg([
    bg(),
    regionPath('main', [khatem(60, 60, 38), khatem(140, 60, 38), khatem(60, 140, 38), khatem(140, 140, 38)].map((p) => pathFrom(p)).join(' ')),
  ]),
});
add({
  reference: 'ZL-014', slug: 'triangle-mosaic', name: 'Triangle Mosaic', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['a', 'Field A'], ['b', 'Field B']],
  markup: svg([
    bg(),
    regionPath('a', 'M20 20 L100 20 L60 90 Z M100 20 L180 20 L140 90 Z M20 110 L100 110 L60 180 Z M100 110 L180 110 L140 180 Z'),
    regionPath('b', 'M60 90 L100 20 L140 90 Z M60 90 L20 110 L100 110 Z M140 90 L180 110 L100 110 Z M60 180 L100 110 L140 180 Z'),
  ]),
});
add({
  reference: 'ZL-015', slug: 'octagon-square', name: 'Octagon and Square', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['octagon', 'Octagon'], ['field', 'Field']],
  markup: svg([
    bg(),
    regionPoly('octagon', regular(8, 100, 100, 78, 22.5)),
    regionPoly('field', regular(4, 100, 100, 36, 45)),
  ]),
});
add({
  reference: 'ZL-016', slug: 'star-4-zellige', name: 'Four Point Moroccan Star', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['star', 'Star']],
  markup: svg([bg(), regionPoly('star', star(4, 100, 100, 80, 26, -90))]),
});
add({
  reference: 'ZL-017', slug: 'nested-stars', name: 'Nested Stars', family: 'zellige', category: 'stars',
  regions: [['background', 'Background'], ['star', 'Star'], ['inner', 'Inner'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('star', star(8, 100, 100, 84, 36)),
    regionPoly('inner', star(8, 100, 100, 48, 20)),
    regionCircle('center', 100, 100, 12),
  ]),
});
add({
  reference: 'ZL-018', slug: 'rosette-12', name: 'Twelve Petal Rosette', family: 'zellige', category: 'rosettes',
  regions: [['background', 'Background'], ['flower', 'Flower'], ['center', 'Center']],
  markup: svg([bg(), regionPath('flower', petals(12, 100, 100, 84, 34)), regionCircle('center', 100, 100, 18)]),
});
add({
  reference: 'ZL-019', slug: 'cross-tessera', name: 'Cross Tessera', family: 'zellige', category: 'moorish',
  regions: [['background', 'Background'], ['cross', 'Cross'], ['diamond', 'Diamond']],
  markup: svg([bg(), regionPoly('cross', cross(100, 100, 80, 40)), regionPoly('diamond', diamond(100, 100, 18, 18))]),
});
add({
  reference: 'ZL-020', slug: 'islamic-8', name: 'Eight Fold Construction', family: 'zellige', category: 'moorish',
  regions: [['background', 'Background'], ['octagon', 'Octagon'], ['star', 'Star'], ['ring', 'Ring'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPoly('octagon', regular(8, 100, 100, 86, 22.5)),
    regionPoly('star', star(8, 100, 100, 64, 26)),
    regionCircle('ring', 100, 100, 28),
    regionCircle('center', 100, 100, 12),
  ]),
});
add({
  reference: 'ZL-021', slug: 'rosette-6', name: 'Six Petal Rosette', family: 'zellige', category: 'rosettes',
  regions: [['background', 'Background'], ['flower', 'Flower'], ['center', 'Center']],
  markup: svg([bg(), regionPath('flower', petals(6, 100, 100, 82, 28)), regionCircle('center', 100, 100, 16)]),
});
add({
  reference: 'ZL-022', slug: 'diamond-khatem', name: 'Diamonds around Khatem', family: 'zellige', category: 'moroccan',
  regions: [['background', 'Background'], ['main', 'Diamonds'], ['star', 'Star'], ['center', 'Center']],
  markup: svg([
    bg(),
    regionPath(
      'main',
      [0, 90, 180, 270]
        .map((deg) => {
          const [x, y] = polar(100, 100, 68, deg);
          return pathFrom(diamond(x, y, 18, 24));
        })
        .join(' '),
    ),
    regionPoly('star', khatem(100, 100, 36)),
    regionCircle('center', 100, 100, 10),
  ]),
});

const manifest = moulds.map(({ markup, ...meta }) => ({
  ...meta,
  svg: `/moulds/${meta.family}/${meta.category}/${meta.reference}.svg`,
  regions: meta.regions.map(([key, name]) => ({ key, name })),
}));

for (const mould of moulds) {
  const dir = nodePath.join(PUBLIC, mould.family, mould.category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(nodePath.join(dir, `${mould.reference}.svg`), mould.markup);
}

fs.mkdirSync(nodePath.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${moulds.length} mould SVGs and manifest.`);
