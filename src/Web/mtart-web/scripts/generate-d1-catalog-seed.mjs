/**
 * Generates migrations/0002_catalog_seed.sql from real catalog seed sources.
 * Deterministic UUIDs (UUIDv5). Does not seed demo products/colors/collections.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEED = path.resolve(ROOT, '../../Services/Catalog/MTArt.Catalog.Infrastructure/SeedData');
const OUT = path.join(ROOT, 'migrations/0002_catalog_seed.sql');
const CREATED = '2026-03-03T00:00:00+00:00';
const NS = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');

function uuidv5(name) {
  const hash = crypto.createHash('sha1').update(Buffer.concat([NS, Buffer.from(`mtart.catalog.${name}`)])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const h = hash.subarray(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function id(...parts) {
  return uuidv5(parts.join(':'));
}

function sql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, rows, columns) {
  if (rows.length === 0) {
    return '';
  }
  const chunks = [];
  for (let i = 0; i < rows.length; i += 40) {
    const slice = rows.slice(i, i + 40);
    const values = slice
      .map((row) => `(${columns.map((col) => sql(row[col])).join(', ')})`)
      .join(',\n  ');
    chunks.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES\n  ${values};`);
  }
  return chunks.join('\n');
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function colorSlug(code) {
  const normalized = String(code).trim().toLowerCase();
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized) ? normalized : null;
}

function displayLabel(width, height) {
  const fmt = (n) => {
    const value = Number(n);
    return Number.isInteger(value) ? String(value) : String(value);
  };
  return `${fmt(width)} × ${fmt(height)} cm`;
}

function pickCollection(kind, page) {
  if (kind === 'Patchwork') return 'patchwork';
  if (kind === 'Border') return 'borders';
  if (kind === 'Project') return 'installed-projects';
  if (kind === 'Plain') return 'geometric-stars';
  if ((page >= 9 && page <= 16) || (page >= 21 && page <= 32)) return 'geometric-stars';
  return 'traditional-floral';
}

function matchPatternSlug(page) {
  if ([6, 9, 13, 14, 15, 23, 27, 60].includes(page)) return 'najma';
  if ([35, 37, 39].includes(page)) return 'cube';
  return null;
}

function hexDistance(a, b) {
  const pa = a.replace('#', '');
  const pb = b.replace('#', '');
  if (pa.length < 6 || pb.length < 6) return Number.POSITIVE_INFINITY;
  const da = [pa.slice(0, 2), pa.slice(2, 4), pa.slice(4, 6)].map((x) => parseInt(x, 16));
  const db = [pb.slice(0, 2), pb.slice(2, 4), pb.slice(4, 6)].map((x) => parseInt(x, 16));
  return Math.abs(da[0] - db[0]) + Math.abs(da[1] - db[1]) + Math.abs(da[2] - db[2]);
}

function pickColorCode(colors, dominant) {
  if (!dominant?.length) return colors[0].code;
  const hex = dominant[0];
  let best = colors[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of colors) {
    if (!color.hex) continue;
    const distance = hexDistance(hex, color.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }
  return best.code;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

const catalogImport = readJson(path.join(SEED, 'catalog-import.json'));
const unicolorImport = readJson(path.join(SEED, 'unicolor-import.json'));
const bejmatImport = readJson(path.join(SEED, 'bejmat-import.json'));

const categories = [
  ['zellige', 'ZELLIGE', 'Zellige', 'Zellige', 'Zellige', 'الزليج', 'Handmade Zellige tiles from Morocco.', 'Carreaux Zellige artisanaux du Maroc.', 'Azulejos Zellige artesanales de Marruecos.', 'بلاط الزليج يدوي الصنع من المغرب.'],
  ['bejmat', 'BEJMAT', 'Bejmat', 'Bejmat', 'Bejmat', 'بجمات', 'Handmade Bejmat tiles from Morocco.', 'Carreaux Bejmat artisanaux du Maroc.', 'Azulejos Bejmat artesanales de Marruecos.', 'بلاط بجمات يدوي الصنع من المغرب.'],
  ['cement-tiles', 'CEMENT', 'Cement Tiles', 'Carreaux de Ciment', 'Baldosas de Cemento', 'بلاط الأسمنت', 'Handmade Cement Tiles tiles from Morocco.', 'Carreaux Carreaux de Ciment artisanaux du Maroc.', 'Azulejos Baldosas de Cemento artesanales de Marruecos.', 'بلاط بلاط الأسمنت يدوي الصنع من المغرب.'],
  ['terracotta', 'TERRACOTTA', 'Terracotta', 'Terre Cuite', 'Terracota', 'الطين المشوي', 'Handmade Terracotta tiles from Morocco.', 'Carreaux Terre Cuite artisanaux du Maroc.', 'Azulejos Terracota artesanales de Marruecos.', 'بلاط الطين المشوي يدوي الصنع من المغرب.'],
].map((row, order) => ({
  id: id('category', row[1]),
  code: row[1],
  slug: row[0],
  display_order: order,
  names: { en: row[2], fr: row[3], es: row[4], ar: row[5] },
  shorts: { en: row[6], fr: row[7], es: row[8], ar: row[9] },
}));

const shapes = [
  ['square', 'Square', 'Carré', 'Cuadrado', 'مربع'],
  ['hexagon', 'Hexagon', 'Hexagone', 'Hexágono', 'سداسي'],
  ['triangle', 'Triangle', 'Triangle', 'Triángulo', 'مثلث'],
  ['diamond', 'Diamond', 'Losange', 'Diamante', 'معين'],
  ['star', 'Star & Cross', 'Étoile & Croix', 'Estrella y Cruz', 'نجمة وصليب'],
].map((row, order) => ({
  id: id('shape', row[0]),
  code: row[0],
  display_order: order,
  names: { en: row[1], fr: row[2], es: row[3], ar: row[4] },
}));

const finishes = [
  ['glossy', 'Glossy', 'Brillant', 'Brillante', 'لامع'],
  ['matte', 'Matte', 'Mat', 'Mate', 'غير لامع'],
  ['natural', 'Natural', 'Naturel', 'Natural', 'طبيعي'],
].map((row, order) => ({
  id: id('finish', row[0]),
  code: row[0],
  display_order: order,
  names: { en: row[1], fr: row[2], es: row[3], ar: row[4] },
}));

const squareId = shapes.find((s) => s.code === 'square').id;
const formatDefs = [
  ['10x10', 10, 10, 1.2, 100, 0.18, 0, 1],
  ['5x5', 5, 5, 1, 400, 0.045, 1, 1],
  ['3x3', 3, 3, 0.8, 1111, 0.018, 2, 1],
  ['15x5-bejmat', 15, 5, 1.4, 133, 0.15, 3, 4],
  ['20x10-bejmat', 20, 10, 1.4, 50, 0.32, 4, 4],
  ['20x20', 20, 20, 1.6, 25, 0.72, 10, 2],
  ['20x5-bejmat', 20, 5, 1.4, 100, 0, 40, 4],
];
const formats = formatDefs.map(([reference, width, height, thickness, units, weightUnit, order, material]) => ({
  id: id('format', reference),
  reference,
  width_cm: width,
  height_cm: height,
  thickness_cm: thickness,
  units_per_m2: units,
  weight_per_unit_kg: weightUnit,
  weight_per_m2_kg: Math.round(weightUnit * units * 100) / 100,
  shape_id: squareId,
  display_order: order,
  material_type: material,
}));
formats.find((f) => f.reference === '20x20').weight_per_m2_kg = 18;

const collections = [
  ['geometric-stars', 'Geometric Stars', 'Étoiles géométriques', 'Estrellas geométricas', 'نجوم هندسية', '/images/catalog/p009.webp', 10, 'A curated MT ART grouping of geometric stars.'],
  ['traditional-floral', 'Traditional Floral', 'Floral traditionnel', 'Floral tradicional', 'زهور تقليدية', '/images/catalog/p022.webp', 11, 'A curated MT ART grouping of traditional floral.'],
  ['installed-projects', 'Installed Projects', 'Projets réalisés', 'Proyectos instalados', 'مشاريع منفذة', '/images/catalog/p069.webp', 12, 'A curated MT ART grouping of installed projects.'],
  ['patchwork', 'Patchwork', 'Patchwork', 'Patchwork', 'باتشورك', '/images/catalog/p020.webp', 13, 'A curated MT ART grouping of patchwork.'],
  ['borders', 'Borders & Frames', 'Bordures et cadres', 'Cenefas y marcos', 'إطارات وحواف', '/images/catalog/p180.webp', 14, 'A curated MT ART grouping of borders & frames.'],
  ['handmade-bjmat', 'Handmade Bjmat', 'Bjmat artisanal', 'Bjmat artesanal', 'بجمات يدوي', bejmatImport.images[0]?.imageUrl ?? null, 20, 'Elongated terracotta tiles, laid in straight, brick or herringbone patterns.'],
].map((row) => ({
  id: id('collection', row[0]),
  slug: row[0],
  cover_image_url: row[5],
  display_order: row[6],
  names: { en: row[1], fr: row[2], es: row[3], ar: row[4] },
  stories: {
    en: row[7],
    fr: row[0] === 'handmade-bjmat' ? 'Carreaux de terre cuite allongés, posés en lignes, en brique ou en chevron.' : null,
    es: row[0] === 'handmade-bjmat' ? 'Baldosas de terracota alargadas, en hilera, ladrillo o espiga.' : null,
    ar: row[0] === 'handmade-bjmat' ? 'بلاط طيني مستطيل يُركّب بشكل مستقيم أو طوب أو عظم السمكة.' : null,
  },
  descriptions: {
    en: row[0] === 'handmade-bjmat' ? 'A dedicated MT ART Bjmat library photographed in the workshop.' : null,
    fr: row[0] === 'handmade-bjmat' ? "Une bibliothèque Bjmat MT ART photographiée à l'atelier." : null,
    es: row[0] === 'handmade-bjmat' ? 'Biblioteca Bjmat de MT ART fotografiada en el taller.' : null,
    ar: row[0] === 'handmade-bjmat' ? 'مكتبة بجمات MT ART مصوّرة في الورشة.' : null,
  },
}));

const cementColors = (catalogImport.colors ?? [])
  .filter((item) => item.code && colorSlug(item.code))
  .map((item, index) => ({
  id: id('color', item.code),
  code: item.code,
  slug: colorSlug(item.code) ?? slugify(item.code),
  family: item.family || 'Special',
  material_type: 'CementTile',
  hex: item.hex,
  rgb: null,
  source: null,
  image_url: item.imageUrl,
  display_order: 100 + index,
  is_featured: Boolean(item.isFeatured),
  names: item.names,
  descriptions: {
    en: 'Handmade cement-tile pigment. Photograph shows natural surface variation.',
    fr: 'Pigment de carreau de ciment. La photo montre la variation naturelle.',
    es: 'Pigmento de baldosa de cemento. La foto muestra la variación natural.',
    ar: 'صبغة بلاط إسمنتي يدوي. الصورة تُظهر التباين الطبيعي.',
  },
}));

const usedColorCodes = new Set(cementColors.map((c) => c.code.toLowerCase()));
const colorByCodeMutable = Object.fromEntries(cementColors.map((c) => [c.code.toLowerCase(), c]));
const unicolorColors = [];
const unicolorDescription = 'MT ART Collection UNICOLOR. Mineral pigment for handmade cement tiles. Source: UNICOLOR.';
for (const item of unicolorImport.colors ?? []) {
  if (!item.code) {
    continue;
  }
  const slug = colorSlug(item.code);
  if (!slug) {
    continue;
  }
  const order = Number.parseInt(item.code, 10);
  const names = {
    en: item.name || item.code,
    fr: item.name || item.code,
    es: item.name || item.code,
    ar: item.name || item.code,
  };
  const descriptions = { en: unicolorDescription, fr: unicolorDescription, es: unicolorDescription, ar: unicolorDescription };
  const existing = colorByCodeMutable[String(item.code).toLowerCase()];
  if (existing) {
    if (existing.source && existing.source !== 'UNICOLOR') {
      continue;
    }
    existing.family = item.family || existing.family || 'Special';
    existing.hex = item.hex;
    existing.rgb = item.rgb || null;
    existing.source = 'UNICOLOR';
    existing.image_url = item.imageUrl;
    existing.display_order = Number.isFinite(order) ? order : existing.display_order;
    existing.names = names;
    existing.descriptions = descriptions;
    continue;
  }
  usedColorCodes.add(String(item.code).toLowerCase());
  const color = {
    id: id('color', 'UNICOLOR', item.code),
    code: item.code,
    slug,
    family: item.family || 'Special',
    material_type: 'CementTile',
    hex: item.hex,
    rgb: item.rgb || null,
    source: 'UNICOLOR',
    image_url: item.imageUrl,
    display_order: Number.isFinite(order) ? order : 1000,
    is_featured: false,
    names,
    descriptions,
  };
  unicolorColors.push(color);
  colorByCodeMutable[String(item.code).toLowerCase()] = color;
}

const bejmatColors = [];
for (const [index, item] of (bejmatImport.images ?? []).entries()) {
  if (!item.colorCode || !colorSlug(item.colorCode) || usedColorCodes.has(String(item.colorCode).toLowerCase())) {
    continue;
  }
  usedColorCodes.add(String(item.colorCode).toLowerCase());
  bejmatColors.push({
    id: id('color', item.colorCode),
    code: item.colorCode,
    slug: colorSlug(item.colorCode),
    family: item.detectedColor || 'Terracotta',
    material_type: 'Bejmat',
    hex: item.hexApproximation || '#B5623F',
    rgb: null,
    source: null,
    image_url: item.imageUrl,
    display_order: index + 1,
    is_featured: Boolean(item.isFeatured),
    names: {
      en: `Bjmat ${item.colorCode}`,
      fr: `Bjmat ${item.colorCode}`,
      es: `Bjmat ${item.colorCode}`,
      ar: `بجمات ${item.colorCode}`,
    },
    descriptions: {
      en: 'Photographed Bjmat sample. Colour varies from piece to piece.',
      fr: "Échantillon Bjmat photographié. La couleur varie d'une pièce à l'autre.",
      es: 'Muestra Bjmat fotografiada. El color varía de una pieza a otra.',
      ar: 'عينة بجمات مصوّرة. اللون يختلف من قطعة إلى أخرى.',
    },
  });
}

const colors = [...cementColors, ...unicolorColors, ...bejmatColors];
const colorByCode = Object.fromEntries(colors.map((c) => [c.code.toLowerCase(), c]));

const cementId = categories.find((c) => c.code === 'CEMENT').id;
const bejmatId = categories.find((c) => c.code === 'BEJMAT').id;
const hexagonId = shapes.find((s) => s.code === 'hexagon').id;
const matteId = finishes.find((f) => f.code === 'matte').id;
const naturalId = finishes.find((f) => f.code === 'natural').id;
const format20 = formats.find((f) => f.reference === '20x20');
const format15 = formats.find((f) => f.reference === '15x5-bejmat');
const collectionBySlug = Object.fromEntries(collections.map((c) => [c.slug, c]));

const products = [];
for (const item of catalogImport.products ?? []) {
  const kind = item.kind || 'Patterned';
  const collectionSlug = pickCollection(kind, item.page);
  const linkedSlug = matchPatternSlug(item.page);
  const isSimulatorReady = Boolean(linkedSlug);
  const color = colorByCode[pickColorCode(cementColors, item.dominantColors).toLowerCase()] ?? cementColors[0];
  const shapeId = item.shape === 'hexagon' ? hexagonId : squareId;
  const names = item.names;
  products.push({
    id: id('product', item.importId),
    reference: item.importId,
    slug: slugify(item.importId),
    category_id: cementId,
    collection_id: collectionBySlug[collectionSlug].id,
    shape_id: shapeId,
    finish_id: matteId,
    is_featured: Boolean(item.isFeatured),
    is_customizable: Boolean(item.isSimulatorReady),
    is_in_stock: 0,
    is_simulator_ready: isSimulatorReady ? 1 : 0,
    status: 'Published',
    catalog_kind: kind,
    price_per_m2: item.priceDhPerM2 ?? null,
    currency: 'MAD',
    price_visibility: 'Public',
    minimum_order_m2: 5,
    units_per_square_meter: format20.units_per_m2,
    weight_per_square_meter_kg: format20.weight_per_m2_kg,
    thickness_cm: format20.thickness_cm,
    country_of_origin: 'Morocco',
    material: 'White cement, marble powder, mineral pigments',
    production_lead_time: '4-6 weeks',
    source_catalog: catalogImport.sourceCatalog,
    source_page: item.page,
    pattern_id: linkedSlug ? id('pattern', linkedSlug === 'najma' ? '1025' : '1035') : null,
    pattern_slug: linkedSlug,
    display_order: item.page,
    names,
    shorts: {
      en: `${names.en}. Handmade cement tile from MT ART, Meknes.`,
      fr: `${names.fr}. Carreau de ciment artisanal MT ART, Meknès.`,
      es: `${names.es}. Baldosa de cemento artesanal MT ART, Meknes.`,
      ar: `${names.ar}. بلاط إسمنتي مصنوع يدويًا في مكناس.`,
    },
    descriptions: {
      en: 'Pressed by hand in Meknes from white cement, marble powder and mineral pigments. Natural variation in pigment and pattern alignment is part of the craft.',
    },
    craftsmanship: {
      en: "Hand-pressed in steel moulds, cured, then waxed. Each tile is a unique impression of the artisan's work.",
    },
    installation: {
      en: 'Install over a stable, level screed with a suitable cement-tile adhesive. Maintain 1.5–2 mm joints. Seal after installation.',
    },
    maintenance: {
      en: 'Clean with a pH-neutral cleaner. Do not use acids or abrasives on sealed cement tiles.',
    },
    seo_title: { en: `${names.en} | MT ART` },
    seo_description: { en: `Handmade Moroccan cement tile ${item.importId} by MT ART.` },
    image_url: item.imageUrl,
    color_id: color.id,
    format_id: format20.id,
    finish_id_variant: matteId,
    sku: `SKU-${item.importId}`,
    variant_weight: format20.weight_per_m2_kg,
    variant_units: format20.units_per_m2,
    variant_thickness: format20.thickness_cm,
  });
}

let bejmatOrder = 0;
for (const item of bejmatImport.images ?? []) {
  bejmatOrder += 1;
  const kind = item.imageType === 'InstalledProject' ? 'Project' : item.imageType === 'FlatSample' ? 'ColorSample' : 'Plain';
  const color = colorByCode[String(item.colorCode || '').toLowerCase()];
  products.push({
    id: id('product', item.importId),
    reference: item.importId,
    slug: slugify(item.importId),
    category_id: bejmatId,
    collection_id: collectionBySlug['handmade-bjmat'].id,
    shape_id: squareId,
    finish_id: naturalId,
    is_featured: Boolean(item.isFeatured) || bejmatOrder <= 8,
    is_customizable: 0,
    is_in_stock: 0,
    is_simulator_ready: 0,
    status: 'Published',
    catalog_kind: kind,
    price_per_m2: null,
    currency: 'MAD',
    price_visibility: 'QuoteOnly',
    minimum_order_m2: 5,
    units_per_square_meter: format15.units_per_m2,
    weight_per_square_meter_kg: null,
    thickness_cm: format15.thickness_cm,
    country_of_origin: 'Morocco',
    material: 'Handmade terracotta Bjmat',
    production_lead_time: '4-6 weeks',
    source_catalog: 'bejmat-whatsapp',
    source_page: bejmatOrder,
    pattern_id: null,
    pattern_slug: null,
    display_order: bejmatOrder,
    names: {
      en: `Handmade Bjmat ${item.importId}`,
      fr: `Bjmat artisanal ${item.importId}`,
      es: `Bjmat artesanal ${item.importId}`,
      ar: `بجمات يدوي ${item.importId}`,
    },
    shorts: {
      en: `Handmade Moroccan Bjmat. Temporary reference ${item.importId} pending studio review.`,
      fr: `Bjmat marocain fait main. Référence temporaire ${item.importId}.`,
      es: `Bjmat marroquí hecho a mano. Referencia temporal ${item.importId}.`,
      ar: `بجمات مغربي مصنوع يدوياً. مرجع مؤقت ${item.importId}.`,
    },
    descriptions: {
      en: 'Pressed and fired terracotta with natural variation in tone and edge. Format to be confirmed from the workshop.',
    },
    craftsmanship: { en: 'Each piece is shaped by hand. Colour and texture vary from tile to tile.' },
    installation: { en: 'Install over a stable screed with a suitable adhesive. Maintain even joints.' },
    maintenance: { en: 'Clean with a pH-neutral cleaner.' },
    seo_title: { en: `Bjmat ${item.importId} | MT ART` },
    seo_description: { en: `Handmade Moroccan Bjmat ${item.importId} by MT ART.` },
    image_url: item.imageUrl,
    color_id: color?.id ?? null,
    format_id: format15.id,
    finish_id_variant: naturalId,
    sku: `SKU-${item.importId}`,
    variant_weight: 0,
    variant_units: format15.units_per_m2,
    variant_thickness: format15.thickness_cm,
  });
}

const langs = ['en', 'fr', 'es', 'ar'];
const categoryRows = categories.map((c) => ({
  id: c.id, code: c.code, slug: c.slug, image_id: null, display_order: c.display_order, is_active: 1, created_at: CREATED, updated_at: null,
}));
const categoryTr = categories.flatMap((c) => langs.map((lang) => ({
  id: id('category-tr', c.code, lang),
  category_id: c.id,
  language_code: lang,
  name: c.names[lang],
  short_description: c.shorts[lang],
  description: null,
  seo_title: lang === 'en' ? `${c.names.en} Tiles | MT ART` : null,
  seo_description: lang === 'en' ? `Discover handmade ${c.names.en} tiles, crafted in Morocco.` : null,
})));

const collectionRows = collections.map((c) => ({
  id: c.id, slug: c.slug, cover_image_id: null, cover_image_url: c.cover_image_url, display_order: c.display_order,
  is_active: 1, is_demo: 0, created_at: CREATED, updated_at: null,
}));
const collectionTr = collections.flatMap((c) => langs.map((lang) => ({
  id: id('collection-tr', c.slug, lang),
  collection_id: c.id,
  language_code: lang,
  name: c.names[lang],
  story: c.stories[lang],
  description: c.descriptions[lang],
  seo_title: lang === 'en' ? `${c.names.en} | MT ART` : null,
  seo_description: null,
})));

const colorRows = colors.map((c) => ({
  id: c.id, code: c.code, slug: c.slug, family: c.family, material_type: c.material_type,
  hex_approximation: c.hex, rgb: c.rgb, source: c.source, image_id: null, image_url: c.image_url,
  texture_image_id: null, texture_image_url: c.image_url, display_order: c.display_order,
  is_active: 1, is_featured: c.is_featured ? 1 : 0, is_demo: 0, created_at: CREATED, updated_at: null,
}));
const colorTr = colors.flatMap((c) => langs.map((lang) => ({
  id: id('color-tr', c.code, lang),
  color_id: c.id,
  language_code: lang,
  name: c.names[lang],
  description: c.descriptions[lang],
})));

const shapeRows = shapes.map((s) => ({
  id: s.id, code: s.code, display_order: s.display_order, is_active: 1, created_at: CREATED, updated_at: null,
}));
const shapeTr = shapes.flatMap((s) => langs.map((lang) => ({
  id: id('shape-tr', s.code, lang), shape_id: s.id, language_code: lang, name: s.names[lang],
})));
const finishRows = finishes.map((f) => ({
  id: f.id, code: f.code, display_order: f.display_order, is_active: 1, created_at: CREATED, updated_at: null,
}));
const finishTr = finishes.flatMap((f) => langs.map((lang) => ({
  id: id('finish-tr', f.code, lang), finish_id: f.id, language_code: lang, name: f.names[lang],
})));

const formatRows = formats.map((f) => ({
  id: f.id, reference: f.reference, width_cm: f.width_cm, height_cm: f.height_cm, thickness_cm: f.thickness_cm,
  units_per_m2: f.units_per_m2, weight_per_unit_kg: f.weight_per_unit_kg, weight_per_m2_kg: f.weight_per_m2_kg,
  shape_id: f.shape_id, diagram_image_id: null, display_order: f.display_order, is_active: 1,
  material_type: f.material_type, has_verified_technical_data: 0, created_at: CREATED, updated_at: null,
}));
const formatTr = formats.flatMap((f) => {
  if (f.reference === '20x20') {
    return [
      { id: id('format-tr', f.reference, 'en'), format_id: f.id, language_code: 'en', name: '20 x 20 cm', description: 'Standard cement tile format.' },
      { id: id('format-tr', f.reference, 'fr'), format_id: f.id, language_code: 'fr', name: '20 x 20 cm', description: null },
      { id: id('format-tr', f.reference, 'es'), format_id: f.id, language_code: 'es', name: '20 x 20 cm', description: null },
      { id: id('format-tr', f.reference, 'ar'), format_id: f.id, language_code: 'ar', name: '20 × 20 سم', description: null },
    ];
  }
  if (f.reference === '20x5-bejmat') {
    return langs.map((lang) => ({
      id: id('format-tr', f.reference, lang),
      format_id: f.id,
      language_code: lang,
      name: lang === 'ar' ? '20 × 5 سم بجمات' : '20 × 5 cm Bjmat',
      description:
        lang === 'en'
          ? 'Bjmat format. Technical weights available on request.'
          : lang === 'fr'
            ? 'Format Bjmat. Poids techniques sur demande.'
            : lang === 'es'
              ? 'Formato Bjmat. Pesos técnicos bajo petición.'
              : 'مقاس بجمات. الأوزان التقنية عند الطلب.',
    }));
  }
  return [{
    id: id('format-tr', f.reference, 'en'),
    format_id: f.id,
    language_code: 'en',
    name: `${f.width_cm} x ${f.height_cm} cm`,
    description: null,
  }];
});

const productRows = products.map((p) => ({
  id: p.id, reference: p.reference, slug: p.slug, category_id: p.category_id, collection_id: p.collection_id,
  shape_id: p.shape_id, finish_id: p.finish_id, is_featured: p.is_featured ? 1 : 0, is_new: 0,
  is_customizable: p.is_customizable ? 1 : 0, is_in_stock: p.is_in_stock, is_simulator_ready: p.is_simulator_ready,
  is_demo: 0, is_deleted: 0, status: p.status, catalog_kind: p.catalog_kind, price_per_m2: p.price_per_m2,
  currency: p.currency, price_visibility: p.price_visibility, minimum_order_m2: p.minimum_order_m2,
  units_per_square_meter: p.units_per_square_meter, weight_per_square_meter_kg: p.weight_per_square_meter_kg,
  thickness_cm: p.thickness_cm, country_of_origin: p.country_of_origin, material: p.material,
  production_lead_time: p.production_lead_time, source_catalog: p.source_catalog, source_page: p.source_page,
  pattern_id: p.pattern_id, pattern_slug: p.pattern_slug, display_order: p.display_order,
  created_at: CREATED, updated_at: null, deleted_at: null,
}));

const productTr = products.flatMap((p) => langs.map((lang) => ({
  id: id('product-tr', p.reference, lang),
  product_id: p.id,
  language_code: lang,
  name: p.names[lang],
  short_description: p.shorts[lang] ?? null,
  description: p.descriptions[lang] ?? null,
  craftsmanship: p.craftsmanship[lang] ?? null,
  installation_advice: p.installation[lang] ?? null,
  maintenance_advice: p.maintenance[lang] ?? null,
  seo_title: p.seo_title[lang] ?? null,
  seo_description: p.seo_description[lang] ?? null,
})));

const imageRows = products.map((p) => ({
  id: id('product-image', p.reference, 'primary'),
  product_id: p.id,
  media_id: id('media', p.reference, 'primary'),
  image_url: p.image_url,
  role: 'Primary',
  display_order: 0,
}));

const variantRows = products
  .filter((p) => p.color_id)
  .map((p) => ({
    id: id('product-variant', p.reference),
    product_id: p.id,
    color_id: p.color_id,
    format_id: p.format_id,
    finish_id: p.finish_id_variant,
    sku: p.sku,
    reference: p.reference,
    stock_status: 'MadeToOrder',
    units_per_m2: p.variant_units,
    weight_per_m2_kg: p.variant_weight,
    thickness_cm: p.variant_thickness,
    minimum_order: 5,
  }));

const sqlParts = [
  '-- Generated public catalog seed. Deterministic UUIDs. No demo products.',
  'PRAGMA foreign_keys = ON;',
  insert('categories', categoryRows, ['id', 'code', 'slug', 'image_id', 'display_order', 'is_active', 'created_at', 'updated_at']),
  insert('category_translations', categoryTr, ['id', 'category_id', 'language_code', 'name', 'short_description', 'description', 'seo_title', 'seo_description']),
  insert('shapes', shapeRows, ['id', 'code', 'display_order', 'is_active', 'created_at', 'updated_at']),
  insert('shape_translations', shapeTr, ['id', 'shape_id', 'language_code', 'name']),
  insert('finishes', finishRows, ['id', 'code', 'display_order', 'is_active', 'created_at', 'updated_at']),
  insert('finish_translations', finishTr, ['id', 'finish_id', 'language_code', 'name']),
  insert('formats', formatRows, ['id', 'reference', 'width_cm', 'height_cm', 'thickness_cm', 'units_per_m2', 'weight_per_unit_kg', 'weight_per_m2_kg', 'shape_id', 'diagram_image_id', 'display_order', 'is_active', 'material_type', 'has_verified_technical_data', 'created_at', 'updated_at']),
  insert('format_translations', formatTr, ['id', 'format_id', 'language_code', 'name', 'description']),
  insert('collections', collectionRows, ['id', 'slug', 'cover_image_id', 'cover_image_url', 'display_order', 'is_active', 'is_demo', 'created_at', 'updated_at']),
  insert('collection_translations', collectionTr, ['id', 'collection_id', 'language_code', 'name', 'story', 'description', 'seo_title', 'seo_description']),
  insert('colors', colorRows, ['id', 'code', 'slug', 'family', 'material_type', 'hex_approximation', 'rgb', 'source', 'image_id', 'image_url', 'texture_image_id', 'texture_image_url', 'display_order', 'is_active', 'is_featured', 'is_demo', 'created_at', 'updated_at']),
  insert('color_translations', colorTr, ['id', 'color_id', 'language_code', 'name', 'description']),
  insert('products', productRows, ['id', 'reference', 'slug', 'category_id', 'collection_id', 'shape_id', 'finish_id', 'is_featured', 'is_new', 'is_customizable', 'is_in_stock', 'is_simulator_ready', 'is_demo', 'is_deleted', 'status', 'catalog_kind', 'price_per_m2', 'currency', 'price_visibility', 'minimum_order_m2', 'units_per_square_meter', 'weight_per_square_meter_kg', 'thickness_cm', 'country_of_origin', 'material', 'production_lead_time', 'source_catalog', 'source_page', 'pattern_id', 'pattern_slug', 'display_order', 'created_at', 'updated_at', 'deleted_at']),
  insert('product_translations', productTr, ['id', 'product_id', 'language_code', 'name', 'short_description', 'description', 'craftsmanship', 'installation_advice', 'maintenance_advice', 'seo_title', 'seo_description']),
  insert('product_images', imageRows, ['id', 'product_id', 'media_id', 'image_url', 'role', 'display_order']),
  insert('product_variants', variantRows, ['id', 'product_id', 'color_id', 'format_id', 'finish_id', 'sku', 'reference', 'stock_status', 'units_per_m2', 'weight_per_m2_kg', 'thickness_cm', 'minimum_order']),
];

fs.writeFileSync(OUT, `${sqlParts.filter(Boolean).join('\n\n')}\n`);

const summary = {
  categories: categoryRows.length,
  collections: collectionRows.length,
  colors: colorRows.length,
  cementColors: cementColors.length,
  unicolorColors: unicolorColors.length,
  bejmatColors: bejmatColors.length,
  shapes: shapeRows.length,
  finishes: finishRows.length,
  formats: formatRows.length,
  products: productRows.length,
  cementProducts: (catalogImport.products ?? []).length,
  bejmatProducts: (bejmatImport.images ?? []).length,
  productImages: imageRows.length,
  productVariants: variantRows.length,
  bytes: fs.statSync(OUT).size,
};
fs.writeFileSync(path.join(ROOT, 'migrations/seed-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
console.log('wrote', OUT);
