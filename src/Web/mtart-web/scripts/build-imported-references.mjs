/**
 * Builds imported Moroccan/cement-tile references from catalog-import.json.
 * Raster photos become catalogue thumbnails. Editable SVG is attached only when
 * a constructed MT ART mould template is a reliable geometric match.
 * Does not trace photos and does not wrap JPGs in <svg>.
 */
import fs from 'node:fs';
import nodePath from 'node:path';

const ROOT = nodePath.resolve(import.meta.dirname, '..');
const CATALOG = nodePath.resolve(ROOT, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/catalog-import.json');
const MOULD_MANIFEST = nodePath.resolve(ROOT, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/mould-manifest.json');
const OUT = nodePath.resolve(ROOT, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData/imported-mould-manifest.json');
const PUBLIC_CATALOG = nodePath.join(ROOT, 'public', 'images', 'catalog');

const STAR_PAGES = new Set([6, 9, 13, 14, 15, 23, 27, 60]);
const CUBE_PAGES = new Set([35, 37, 39]);
const SKIP_CLASS = new Set(['Project', 'Marketing', 'ColorSample']);
const SKIP_KIND = new Set(['Project', 'Marketing', 'Plain']);

function categoryOf(page) {
  if (page.kind === 'Border') {
    return 'borders';
  }
  if (page.kind === 'Patchwork') {
    return 'patchwork';
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

function templateOf(page) {
  if (STAR_PAGES.has(page.page)) {
    return { reference: 'GEO-003', svg: '/moulds/cement/geometric/GEO-003.svg' };
  }
  if (CUBE_PAGES.has(page.page)) {
    return { reference: '1035', svg: '/images/patterns/cube.svg' };
  }
  if (page.kind === 'Border') {
    return { reference: 'GEO-015', svg: '/moulds/cement/borders/GEO-015.svg' };
  }
  return null;
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
  if (page.kind === 'Patchwork') {
    return `Patchwork ${reference}`;
  }
  return `Moroccan Tile ${reference}`;
}

function tagsOf(page, category) {
  const tags = ['moroccan', 'cement', category, `p${String(page.page).padStart(3, '0')}`];
  if (STAR_PAGES.has(page.page)) {
    tags.push('star', 'geometric', 'najma');
  }
  if (CUBE_PAGES.has(page.page)) {
    tags.push('cube', 'modern');
  }
  if (page.kind === 'Floral' || category === 'floral') {
    tags.push('floral');
  }
  if (page.kind === 'Border') {
    tags.push('border', 'frame');
  }
  return [...new Set(tags)];
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const moulds = JSON.parse(fs.readFileSync(MOULD_MANIFEST, 'utf8'));
const byRef = Object.fromEntries(moulds.map((item) => [item.reference, item]));
byRef['1035'] = {
  reference: '1035',
  regions: [
    { key: 'light', name: 'Light face' },
    { key: 'mid', name: 'Mid face' },
    { key: 'dark', name: 'Dark face' },
  ],
};

const pages = (catalog.pages ?? []).filter((page) => {
  if (SKIP_CLASS.has(page.classification) || SKIP_KIND.has(page.kind)) {
    return false;
  }
  return page.kind === 'Patterned' || page.kind === 'Patchwork' || page.kind === 'Border';
});

const entries = [];
let n = 1;
for (const page of pages) {
  const reference = `MOR-${String(n).padStart(3, '0')}`;
  n += 1;
  const imageUrl = page.imageUrl;
  const imagePath = nodePath.join(PUBLIC_CATALOG, nodePath.basename(imageUrl ?? ''));
  const imageExists = Boolean(imageUrl) && fs.existsSync(imagePath);
  const template = templateOf(page);
  const mould = template ? byRef[template.reference] : null;
  const hasSvg = Boolean(template && mould);
  let status = 'needs-vectorization';
  if (!imageExists) {
    status = 'invalid-source';
  } else if (page.kind === 'Patchwork') {
    status = 'photo-only';
  } else if (hasSvg) {
    status = 'editable';
  }

  const category = categoryOf(page);
  entries.push({
    reference,
    slug: reference.toLowerCase(),
    name: nameOf(page, reference, template),
    family: 'cement',
    category,
    sourceImage: page.sourceImage ? `/import/extracted/images/${page.sourceImage}` : null,
    thumbnail: imageUrl,
    svg: hasSvg ? template.svg : null,
    templateReference: hasSvg ? template.reference : null,
    editable: status === 'editable',
    status,
    catalogPage: page.page,
    importId: page.importId,
    tags: tagsOf(page, category),
    regions: hasSvg ? mould.regions : [],
  });
}

fs.writeFileSync(OUT, `${JSON.stringify(entries, null, 2)}\n`);
const counts = entries.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] || 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${entries.length} imported references → ${OUT}`);
console.log(counts);
