/**
 * Scans imported tile assets, original SVG moulds, and generated GEO/ZL geometry.
 * Writes public/moulds/catalogue.json used by Choose a reference (no DB required).
 *
 * Classification:
 *   tile-pattern | tile-mould | room-photo | installation-photo | logo | color-sample | other
 *
 * Only tile-pattern + original/generated moulds enter the catalogue.
 * Raster photos are never wrapped as fake editable SVGs.
 */
import fs from 'node:fs';
import nodePath from 'node:path';

const WEB = nodePath.resolve(import.meta.dirname, '..');
const REPO = nodePath.resolve(WEB, '../../..');
const EXTRACTED = nodePath.join(REPO, 'import', 'extracted', 'images');
const CLASSIFICATION = nodePath.join(REPO, 'import', 'extracted', 'classification.json');
const EXTRACT_MANIFEST = nodePath.join(REPO, 'import', 'extracted', 'manifest.json');
const CATALOG_IMPORT = nodePath.resolve(WEB, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/catalog-import.json');
const MOULD_MANIFEST = nodePath.resolve(WEB, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/mould-manifest.json');
const IMPORTED_OUT = nodePath.resolve(WEB, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/imported-mould-manifest.json');
const PUBLIC_MOULDS = nodePath.join(WEB, 'public', 'moulds');
const PUBLIC_IMPORT = nodePath.join(WEB, 'public', 'images', 'import');
const CATALOGUE_OUT = nodePath.join(PUBLIC_MOULDS, 'catalogue.json');
const DIAGNOSTICS_OUT = nodePath.join(PUBLIC_MOULDS, 'catalogue-diagnostics.json');

const IMAGE_EXT = /\.(png|jpe?g|webp|svg)$/i;
const SKIP_REFS = new Set(['1010']);
const STAR_PAGES = new Set([6, 9, 13, 14, 15, 23, 27, 60]);
const CUBE_PAGES = new Set([35, 37, 39]);
const DIAMOND_PAGES = new Set([10, 11, 12, 42, 43]);
const OCTAGON_PAGES = new Set([18, 19, 20]);
const CROSS_PAGES = new Set([17, 44]);
const ROSETTE_PAGES = new Set([21, 22, 24, 25, 26]);

const ORIGINAL_PATTERNS = [
  { reference: '1025', slug: 'najma', name: 'Najma', category: 'geometric', svg: '/images/patterns/najma.svg', regions: [['background', 'Background'], ['main', 'Star']] },
  { reference: '1026', slug: 'arabia', name: 'Arabia', category: 'traditional', svg: '/images/patterns/arabia.svg', regions: [['background', 'Background'], ['main', 'Motif'], ['accent', 'Accent']] },
  { reference: '1027', slug: 'rif', name: 'Rif', category: 'floral', svg: '/images/patterns/rif.svg', regions: [['background', 'Background'], ['main', 'Petal'], ['secondary', 'Center']] },
  { reference: '1035', slug: 'cube', name: 'Cube', category: 'modern', svg: '/images/patterns/cube.svg', regions: [['light', 'Light face'], ['mid', 'Mid face'], ['dark', 'Dark face']] },
  { reference: '1040', slug: 'quatrefoil', name: 'Quatrefoil', category: 'classic', svg: '/images/patterns/quatrefoil.svg', regions: [['background', 'Background'], ['main', 'Quatrefoil'], ['accent', 'Diamond']] },
  { reference: '1042', slug: 'diamond', name: 'Diamond Lattice', category: 'geometric', svg: '/images/patterns/diamond.svg', regions: [['background', 'Background'], ['main', 'Lattice']] },
  { reference: '1048', slug: 'scroll', name: 'Scroll', category: 'traditional', svg: '/images/patterns/scroll.svg', regions: [['background', 'Background'], ['main', 'Scroll'], ['secondary', 'Fill']] },
  { reference: '1050', slug: 'checker', name: 'Checker', category: 'modern', svg: '/images/patterns/checker.svg', regions: [['a', 'Field A'], ['b', 'Field B']] },
  { reference: '1055', slug: 'petal', name: 'Petal Circle', category: 'floral', svg: '/images/patterns/petal.svg', regions: [['background', 'Background'], ['main', 'Petal'], ['accent', 'Center']] },
  { reference: '1060', slug: 'cabochon', name: 'Cabochon', category: 'classic', svg: '/images/patterns/cabochon.svg', regions: [['field', 'Field'], ['cabochon', 'Cabochon']] },
  { reference: '1068', slug: 'concentric', name: 'Concentric', category: 'geometric', svg: '/images/patterns/concentric.svg', regions: [['outer', 'Outer'], ['ring', 'Ring'], ['center', 'Center']] },
  { reference: '1070', slug: 'medallion', name: 'Medallion', category: 'classic', svg: '/images/patterns/medallion.svg', regions: [['background', 'Background'], ['ring', 'Ring'], ['star', 'Star'], ['center', 'Center']] },
  { reference: '1072', slug: 'garden', name: 'Garden', category: 'floral', svg: '/images/patterns/garden.svg', regions: [['background', 'Background'], ['petalA', 'Petal A'], ['petalB', 'Petal B'], ['center', 'Center']] },
  { reference: '1075', slug: 'compass', name: 'Compass', category: 'geometric', svg: '/images/patterns/compass.svg', regions: [['background', 'Background'], ['north', 'North'], ['east', 'East'], ['west', 'West'], ['south', 'South'], ['center', 'Center']] },
  { reference: '1080', slug: 'frame', name: 'Frame', category: 'borders', svg: '/images/patterns/frame.svg', regions: [['field', 'Field'], ['border', 'Border'], ['inner', 'Inner'], ['corner', 'Corner']] },
  { reference: '1088', slug: 'hexbloom', name: 'Hex Bloom', category: 'floral', svg: '/images/patterns/hexbloom.svg', regions: [['background', 'Background'], ['hex', 'Hexagon'], ['flower', 'Flower'], ['center', 'Center']] },
  { reference: '1092', slug: 'octostar', name: 'Octostar', category: 'geometric', svg: '/images/patterns/octostar.svg', regions: [['background', 'Background'], ['octagon', 'Octagon'], ['star', 'Star'], ['center', 'Center']] },
  { reference: '1095', slug: 'pinwheel', name: 'Pinwheel', category: 'shapes', svg: '/images/patterns/pinwheel.svg', regions: [['background', 'Background'], ['bladeA', 'Blade A'], ['bladeB', 'Blade B'], ['bladeC', 'Blade C'], ['bladeD', 'Blade D'], ['hub', 'Hub']] },
];

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walkImages(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = nodePath.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkImages(full, acc);
    } else if (IMAGE_EXT.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function isSquareAspect(ratio) {
  return Number.isFinite(ratio) && ratio >= 0.88 && ratio <= 1.12;
}

function categoryOf(page) {
  if (page.kind === 'Border') {
    return 'borders';
  }
  if (STAR_PAGES.has(page.page) || (page.page >= 9 && page.page <= 16)) {
    return 'geometric';
  }
  if (CUBE_PAGES.has(page.page) || (page.page >= 33 && page.page <= 41)) {
    return 'modern';
  }
  if (page.page >= 21 && page.page <= 32) {
    return 'floral';
  }
  if (page.page >= 46 && page.page <= 56) {
    return 'arabesque';
  }
  return 'traditional';
}

function templateOf(page, mouldByRef) {
  let reference = null;
  let svg = null;
  if (STAR_PAGES.has(page.page)) {
    reference = 'GEO-003';
  } else if (CUBE_PAGES.has(page.page)) {
    reference = '1035';
    svg = '/images/patterns/cube.svg';
  } else if (DIAMOND_PAGES.has(page.page) || page.shape === 'diamond') {
    reference = 'GEO-007';
  } else if (page.shape === 'hexagon') {
    reference = 'GEO-009';
  } else if (OCTAGON_PAGES.has(page.page) || page.shape === 'octagon') {
    reference = 'GEO-010';
  } else if (CROSS_PAGES.has(page.page)) {
    reference = 'GEO-012';
  } else if (ROSETTE_PAGES.has(page.page)) {
    reference = 'GEO-020';
  } else if (page.kind === 'Border') {
    reference = 'GEO-015';
  }
  if (!reference) {
    return null;
  }
  const mould = mouldByRef[reference];
  if (reference !== '1035' && !mould) {
    return null;
  }
  return {
    reference,
    svg: svg ?? mould?.svg ?? null,
    regions: mould?.regions ?? (reference === '1035'
      ? [{ key: 'light', name: 'Light face' }, { key: 'mid', name: 'Mid face' }, { key: 'dark', name: 'Dark face' }]
      : []),
  };
}

function nameOf(page, reference, template) {
  if (STAR_PAGES.has(page.page)) {
    return `Moroccan Star ${reference}`;
  }
  if (CUBE_PAGES.has(page.page)) {
    return `Cube ${reference}`;
  }
  if (page.kind === 'Border') {
    return `Border ${reference}`;
  }
  if (template) {
    return `${template.reference} tile ${reference}`;
  }
  return page.names?.en?.replace(/\s+CAT-P\d+$/i, '').trim() || `Moroccan Tile ${reference}`;
}

function tagsOf(page, category) {
  const tags = ['moroccan', 'cement', category, `p${String(page.page).padStart(3, '0')}`];
  if (STAR_PAGES.has(page.page)) {
    tags.push('star', 'geometric', 'najma');
  }
  if (CUBE_PAGES.has(page.page)) {
    tags.push('cube', 'modern');
  }
  if (page.kind === 'Border') {
    tags.push('border', 'frame');
  }
  if (page.shape) {
    tags.push(page.shape);
  }
  return [...new Set(tags)];
}

function classifyFile(fileName, page, aspect) {
  const lower = fileName.toLowerCase();
  if (/logo|wordmark|mtart-mark/.test(lower)) {
    return 'logo';
  }
  if (!page) {
    if (/kitchen|bath|stair|room|floor|project|install|lifestyle/.test(lower)) {
      return 'room-photo';
    }
    if (/color|sample|uni|plain/.test(lower)) {
      return 'color-sample';
    }
    return 'other';
  }
  if (page.classification === 'Marketing' || page.kind === 'Marketing') {
    return 'logo';
  }
  if (page.classification === 'ColorSample' || page.kind === 'Plain') {
    return 'color-sample';
  }
  if (page.kind === 'Project' || page.classification === 'Project') {
    return isSquareAspect(aspect) ? 'installation-photo' : 'room-photo';
  }
  if (page.kind === 'Patchwork') {
    return 'installation-photo';
  }
  if (page.kind === 'Patterned' || page.kind === 'Border') {
    const isPrimary = page.sourceImage && fileName === page.sourceImage;
    if (isPrimary || isSquareAspect(aspect)) {
      return 'tile-pattern';
    }
    return 'installation-photo';
  }
  return 'other';
}

function regionsFromSvgFile(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  const markup = fs.readFileSync(file, 'utf8');
  const keys = [];
  const seen = new Set();
  for (const match of markup.matchAll(/data-region="([^"]+)"/g)) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      keys.push({
        key: match[1],
        name: match[1] === 'background' ? 'Background' : `Area ${keys.length}`,
      });
    }
  }
  return keys;
}

function firstExistingUrl(candidates) {
  for (const url of candidates) {
    if (!url) {
      continue;
    }
    const abs = nodePath.join(WEB, 'public', url.replace(/^\//, '').replaceAll('/', nodePath.sep));
    if (fs.existsSync(abs)) {
      return url;
    }
  }
  return candidates.find(Boolean) ?? null;
}

function regionsOf(list) {
  return (list ?? []).map((item) => (
    Array.isArray(item) ? { key: item[0], name: item[1] } : { key: item.key, name: item.name }
  ));
}

function mouldItem({ reference, slug, name, category, family, sourceImage, thumbnail, svgUrl, editable, status, regions, displayOrder, tags, confidence }) {
  return {
    id: reference,
    reference,
    slug: slug ?? reference.toLowerCase(),
    name,
    category,
    family: family ?? 'cement',
    sourceImage: sourceImage ?? null,
    thumbnail: thumbnail ?? svgUrl ?? null,
    svgUrl: svgUrl ?? null,
    editable: Boolean(editable && svgUrl),
    status,
    regions: regionsOf(regions),
    displayOrder,
    tags: tags ?? [],
    ...(confidence != null ? { confidence } : {}),
  };
}

const classification = readJson(CLASSIFICATION, readJson(CATALOG_IMPORT, { pages: [], counts: {} }));
const extractManifest = readJson(EXTRACT_MANIFEST, { pages: [] });
const mouldManifest = readJson(MOULD_MANIFEST, []);
const mouldByRef = Object.fromEntries(mouldManifest.map((item) => [item.reference, item]));

const pageByNumber = new Map((classification.pages ?? []).map((page) => [page.page, page]));
const aspectByFile = new Map();
for (const page of extractManifest.pages ?? []) {
  for (const image of page.images ?? []) {
    aspectByFile.set(image.file, image.aspectRatio);
  }
}

const scanned = walkImages(EXTRACTED);
const scannedNames = new Set(scanned.map((file) => nodePath.basename(file)));
if (scanned.length === 0) {
  for (const page of extractManifest.pages ?? []) {
    for (const image of page.images ?? []) {
      scannedNames.add(image.file);
    }
  }
}

const classCounts = {
  'tile-pattern': 0,
  'tile-mould': 0,
  'room-photo': 0,
  'installation-photo': 0,
  logo: 0,
  'color-sample': 0,
  other: 0,
};
const classified = [];
for (const name of [...scannedNames].sort()) {
  const match = name.match(/^p(\d+)/i);
  const page = match ? pageByNumber.get(Number(match[1])) : null;
  const kind = classifyFile(name, page, aspectByFile.get(name));
  classCounts[kind] = (classCounts[kind] ?? 0) + 1;
  classified.push({ file: name, kind, page: page?.page ?? null });
}

fs.mkdirSync(PUBLIC_IMPORT, { recursive: true });
fs.mkdirSync(PUBLIC_MOULDS, { recursive: true });

for (const file of scanned) {
  const dest = nodePath.join(PUBLIC_IMPORT, nodePath.basename(file));
  try {
    fs.copyFileSync(file, dest);
  } catch {
    // keep going if a single file is locked
  }
}

const items = [];
let order = 0;

for (const pattern of ORIGINAL_PATTERNS) {
  if (SKIP_REFS.has(pattern.reference)) {
    continue;
  }
  const abs = nodePath.join(WEB, 'public', pattern.svg.replace(/^\//, '').replaceAll('/', nodePath.sep));
  if (!fs.existsSync(abs)) {
    console.warn('Missing original mould SVG, skipped:', pattern.reference, pattern.svg);
    continue;
  }
  items.push(mouldItem({
    ...pattern,
    svgUrl: pattern.svg,
    thumbnail: pattern.svg,
    editable: true,
    status: 'original',
    family: 'cement',
    displayOrder: order++,
  }));
}

for (const mould of mouldManifest) {
  if (SKIP_REFS.has(mould.reference)) {
    continue;
  }
  items.push(mouldItem({
    reference: mould.reference,
    slug: mould.slug,
    name: mould.name,
    category: mould.category,
    family: mould.family ?? 'cement',
    svgUrl: mould.svg,
    thumbnail: mould.svg,
    editable: true,
    status: 'original',
    regions: mould.regions,
    displayOrder: 100 + order++,
    tags: [mould.family, mould.category],
  }));
}

const importedEntries = [];
let importedN = 1;
const usedSources = new Set();
const patternedPages = (classification.pages ?? []).filter((page) => page.kind === 'Patterned' || page.kind === 'Border');
const review = readJson(nodePath.join(PUBLIC_MOULDS, 'vectorize-review.json'), { items: [], publishThreshold: 0.8 });
const reviewByRef = Object.fromEntries((review.items ?? []).map((item) => [item.reference, item]));

for (const page of patternedPages) {
  const candidates = classified
    .filter((item) => item.page === page.page && item.kind === 'tile-pattern')
    .map((item) => item.file);
  const files = candidates.length > 0
    ? candidates
    : (page.sourceImage ? [page.sourceImage] : []);
  let extra = 0;
  for (const fileName of files) {
    if (usedSources.has(fileName)) {
      continue;
    }
    usedSources.add(fileName);
    extra += 1;
    const reference = extra === 1
      ? `MOR-${String(importedN).padStart(3, '0')}`
      : `MOR-${String(importedN).padStart(3, '0')}-${extra}`;
    if (extra === 1) {
      importedN += 1;
    }
    const generatedSvg = `/moulds/moroccan/${reference}.svg`;
    const generatedAbs = nodePath.join(WEB, 'public', 'moulds', 'moroccan', `${reference}.svg`);
    const reviewItem = reviewByRef[reference];
    const hasGenerated = fs.existsSync(generatedAbs) && Boolean(reviewItem?.published);
    const catalogPng = page.imageUrl;
    const importUrl = `/images/import/${fileName}`;
    const sourceUrl = `/import/extracted/images/${fileName}`;
    const thumbnail = firstExistingUrl([catalogPng, importUrl, sourceUrl]);
    const svg = hasGenerated ? generatedSvg : null;
    const editable = Boolean(svg);
    const generatedRegions = hasGenerated ? regionsFromSvgFile(generatedAbs) : [];
    const entry = {
      reference,
      slug: reference.toLowerCase(),
      name: nameOf(page, reference, null),
      family: 'cement',
      category: categoryOf(page),
      sourceImage: sourceUrl,
      thumbnail,
      svg,
      templateReference: null,
      editable,
      status: hasGenerated ? 'editable-svg' : (reviewItem?.status ?? 'needs-manual-vectorization'),
      catalogPage: page.page,
      importId: page.importId,
      tags: tagsOf(page, categoryOf(page)),
      regions: generatedRegions,
      confidence: reviewItem?.confidence ?? null,
    };
    importedEntries.push(entry);
    items.push(mouldItem({
      reference,
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      family: 'cement',
      sourceImage: sourceUrl,
      thumbnail,
      svgUrl: entry.svg,
      editable,
      status: entry.status,
      regions: entry.regions,
      displayOrder: editable ? 300 + items.length : 500 + items.length,
      tags: entry.tags,
      confidence: entry.confidence,
    }));
  }
}

fs.writeFileSync(IMPORTED_OUT, `${JSON.stringify(importedEntries, null, 2)}\n`);

const diagnostics = {
  generatedAt: new Date().toISOString(),
  extractedFolderExists: fs.existsSync(EXTRACTED),
  totalSourceAssets: scannedNames.size,
  classified: classCounts,
  tilePatternCandidates: classCounts['tile-pattern'],
  editableSvgMoulds: items.filter((item) => item.editable).length,
  rasterOnlyPatterns: items.filter((item) => !item.editable).length,
  rejectedRoomPhotos: classCounts['room-photo'] + classCounts['installation-photo'],
  rejectedOther: classCounts.logo + classCounts['color-sample'] + classCounts.other,
  originalMoulds: items.filter((item) => item.status === 'original').length,
  importedReferences: importedEntries.length,
  catalogueSize: items.length,
  excludedBlank: ['1010 / uni.svg'],
};

const catalogue = { diagnostics, items };

fs.writeFileSync(CATALOGUE_OUT, `${JSON.stringify(catalogue, null, 2)}\n`);
fs.writeFileSync(DIAGNOSTICS_OUT, `${JSON.stringify(diagnostics, null, 2)}\n`);

console.log('Total source assets found:', diagnostics.totalSourceAssets);
console.log('Tile-pattern candidates:', diagnostics.tilePatternCandidates);
console.log('Editable SVG moulds:', diagnostics.editableSvgMoulds);
console.log('Raster-only patterns:', diagnostics.rasterOnlyPatterns);
console.log('Rejected room/photos:', diagnostics.rejectedRoomPhotos);
console.log('Catalogue items:', diagnostics.catalogueSize);
console.log(`Wrote ${CATALOGUE_OUT}`);
console.log(`Wrote ${IMPORTED_OUT} (${importedEntries.length} imported refs)`);
