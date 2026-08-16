import { all, first } from './db';
import { displayLabel, materialTypeJson, toBool, toNumber } from './parse';

type Row = Record<string, unknown>;

export async function listCategories(db: D1Database, lang: string, activeOnly: boolean) {
  const rows = await all<Row>(
    db,
    `SELECT c.id, c.code, c.slug, c.image_id, c.display_order, c.is_active,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.name ELSE COALESCE(t_en.name, c.code) END AS name,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.short_description ELSE t_en.short_description END AS short_description,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.seo_title ELSE t_en.seo_title END AS seo_title,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.seo_description ELSE t_en.seo_description END AS seo_description
     FROM categories c
     LEFT JOIN category_translations t_req ON t_req.category_id = c.id AND t_req.language_code = ?
     LEFT JOIN category_translations t_en ON t_en.category_id = c.id AND t_en.language_code = 'en'
     WHERE (? = 0 OR c.is_active = 1)
     ORDER BY c.display_order`,
    lang,
    activeOnly ? 1 : 0,
  );
  return rows.map(mapCategory);
}

export async function getCategoryBySlug(db: D1Database, slug: string, lang: string) {
  const row = await first<Row>(
    db,
    `SELECT c.id, c.code, c.slug, c.image_id, c.display_order, c.is_active,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.name ELSE COALESCE(t_en.name, c.code) END AS name,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.short_description ELSE t_en.short_description END AS short_description,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.seo_title ELSE t_en.seo_title END AS seo_title,
            CASE WHEN t_req.category_id IS NOT NULL THEN t_req.seo_description ELSE t_en.seo_description END AS seo_description
     FROM categories c
     LEFT JOIN category_translations t_req ON t_req.category_id = c.id AND t_req.language_code = ?
     LEFT JOIN category_translations t_en ON t_en.category_id = c.id AND t_en.language_code = 'en'
     WHERE c.slug = ? COLLATE NOCASE
     LIMIT 1`,
    lang,
    slug,
  );
  return row ? mapCategory(row) : null;
}

export async function listCollections(db: D1Database, lang: string, activeOnly: boolean) {
  const rows = await all<Row>(
    db,
    `SELECT c.id, c.slug, c.cover_image_id, c.cover_image_url, c.display_order, c.is_active,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.name ELSE COALESCE(t_en.name, c.slug) END AS name,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.story ELSE t_en.story END AS story,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.seo_title ELSE t_en.seo_title END AS seo_title,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.seo_description ELSE t_en.seo_description END AS seo_description,
            (
              SELECT COUNT(*) FROM products p
              WHERE p.collection_id = c.id AND p.is_demo = 0
            ) AS product_count
     FROM collections c
     LEFT JOIN collection_translations t_req ON t_req.collection_id = c.id AND t_req.language_code = ?
     LEFT JOIN collection_translations t_en ON t_en.collection_id = c.id AND t_en.language_code = 'en'
     WHERE c.is_demo = 0 AND (? = 0 OR c.is_active = 1)
     ORDER BY c.display_order`,
    lang,
    activeOnly ? 1 : 0,
  );
  return rows.map(mapCollection);
}

export async function getCollectionBySlug(db: D1Database, slug: string, lang: string) {
  const row = await first<Row>(
    db,
    `SELECT c.id, c.slug, c.cover_image_id, c.cover_image_url, c.display_order, c.is_active,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.name ELSE COALESCE(t_en.name, c.slug) END AS name,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.story ELSE t_en.story END AS story,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.seo_title ELSE t_en.seo_title END AS seo_title,
            CASE WHEN t_req.collection_id IS NOT NULL THEN t_req.seo_description ELSE t_en.seo_description END AS seo_description,
            (
              SELECT COUNT(*) FROM products p
              WHERE p.collection_id = c.id AND p.is_demo = 0
            ) AS product_count
     FROM collections c
     LEFT JOIN collection_translations t_req ON t_req.collection_id = c.id AND t_req.language_code = ?
     LEFT JOIN collection_translations t_en ON t_en.collection_id = c.id AND t_en.language_code = 'en'
     WHERE c.slug = ? COLLATE NOCASE
     LIMIT 1`,
    lang,
    slug,
  );
  return row ? mapCollection(row) : null;
}

export async function listColors(
  db: D1Database,
  lang: string,
  activeOnly: boolean,
  family?: string | null,
  materialType?: string | null,
  source?: string | null,
) {
  const where = ['c.is_demo = 0'];
  const params: unknown[] = [lang];
  if (activeOnly) {
    where.push('c.is_active = 1');
  }
  if (family) {
    where.push('c.family = ? COLLATE NOCASE');
    params.push(family);
  }
  if (materialType) {
    where.push('(c.material_type = ? COLLATE NOCASE OR c.material_type = ? COLLATE NOCASE)');
    params.push(materialType, 'Universal');
  }
  if (source) {
    where.push('c.source = ?');
    params.push(source);
  }

  const rows = await all<Row>(
    db,
    `SELECT c.id, c.code, c.slug, c.hex_approximation, c.image_id, c.image_url, c.texture_image_url,
            c.family, c.material_type, c.display_order, c.is_active, c.is_featured, c.source, c.rgb,
            CASE WHEN t_req.color_id IS NOT NULL THEN COALESCE(t_req.name, c.code) ELSE COALESCE(t_en.name, c.code) END AS name,
            CASE WHEN t_req.color_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description
     FROM colors c
     LEFT JOIN color_translations t_req ON t_req.color_id = c.id AND t_req.language_code = ?
     LEFT JOIN color_translations t_en ON t_en.color_id = c.id AND t_en.language_code = 'en'
     WHERE ${where.join(' AND ')}
     ORDER BY c.display_order`,
    ...params,
  );
  return rows.map(mapColor);
}

export async function getColorBySlug(db: D1Database, slug: string, lang: string) {
  const row = await first<Row>(
    db,
    `SELECT c.id, c.code, c.slug, c.hex_approximation, c.image_id, c.image_url, c.texture_image_url,
            c.family, c.material_type, c.display_order, c.is_active, c.is_featured, c.source, c.rgb,
            CASE WHEN t_req.color_id IS NOT NULL THEN COALESCE(t_req.name, c.code) ELSE COALESCE(t_en.name, c.code) END AS name,
            CASE WHEN t_req.color_id IS NOT NULL THEN t_req.description ELSE t_en.description END AS description
     FROM colors c
     LEFT JOIN color_translations t_req ON t_req.color_id = c.id AND t_req.language_code = ?
     LEFT JOIN color_translations t_en ON t_en.color_id = c.id AND t_en.language_code = 'en'
     WHERE c.slug = ? COLLATE NOCASE AND c.is_demo = 0
     LIMIT 1`,
    lang,
    slug,
  );
  return row ? mapColor(row) : null;
}

export async function listFormats(
  db: D1Database,
  lang: string,
  activeOnly: boolean,
  shapeId?: string | null,
  materialType?: number | null,
) {
  const where: string[] = [];
  const params: unknown[] = [lang, lang];
  if (activeOnly) {
    where.push('f.is_active = 1');
  }
  if (shapeId) {
    where.push('f.shape_id = ? COLLATE NOCASE');
    params.push(shapeId);
  }
  if (materialType !== null && materialType !== undefined) {
    where.push('f.material_type = ?');
    params.push(materialType);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await all<Row>(
    db,
    `SELECT f.id, f.reference, f.width_cm, f.height_cm, f.thickness_cm, f.units_per_m2,
            f.weight_per_unit_kg, f.weight_per_m2_kg, f.shape_id, f.diagram_image_id,
            f.display_order, f.is_active, f.material_type, f.has_verified_technical_data,
            CASE WHEN t_req.format_id IS NOT NULL THEN t_req.name ELSE t_en.name END AS name,
            CASE WHEN st_req.shape_id IS NOT NULL THEN COALESCE(st_req.name, s.code) ELSE COALESCE(st_en.name, s.code, '') END AS shape_name
     FROM formats f
     LEFT JOIN format_translations t_req ON t_req.format_id = f.id AND t_req.language_code = ?
     LEFT JOIN format_translations t_en ON t_en.format_id = f.id AND t_en.language_code = 'en'
     LEFT JOIN shapes s ON s.id = f.shape_id
     LEFT JOIN shape_translations st_req ON st_req.shape_id = s.id AND st_req.language_code = ?
     LEFT JOIN shape_translations st_en ON st_en.shape_id = s.id AND st_en.language_code = 'en'
     ${whereSql}
     ORDER BY f.display_order`,
    ...params,
  );
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    name: (row.name as string | null | undefined) ?? displayLabel(row.width_cm, row.height_cm),
    widthCm: toNumber(row.width_cm),
    heightCm: toNumber(row.height_cm),
    thicknessCm: toNumber(row.thickness_cm),
    unitsPerM2: toNumber(row.units_per_m2),
    weightPerUnitKg: toNumber(row.weight_per_unit_kg),
    weightPerM2Kg: toNumber(row.weight_per_m2_kg),
    shapeId: row.shape_id,
    shapeName: row.shape_name ?? '',
    diagramImageId: row.diagram_image_id ?? null,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
    materialType: materialTypeJson(row.material_type),
    hasVerifiedTechnicalData: toBool(row.has_verified_technical_data),
  }));
}

export async function listShapes(db: D1Database, lang: string) {
  const rows = await all<Row>(
    db,
    `SELECT s.id, s.code, s.display_order, s.is_active,
            CASE WHEN t_req.shape_id IS NOT NULL THEN COALESCE(t_req.name, s.code) ELSE COALESCE(t_en.name, s.code) END AS name
     FROM shapes s
     LEFT JOIN shape_translations t_req ON t_req.shape_id = s.id AND t_req.language_code = ?
     LEFT JOIN shape_translations t_en ON t_en.shape_id = s.id AND t_en.language_code = 'en'
     WHERE s.is_active = 1
     ORDER BY s.display_order`,
    lang,
  );
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
  }));
}

export async function listFinishes(db: D1Database, lang: string) {
  const rows = await all<Row>(
    db,
    `SELECT f.id, f.code, f.display_order, f.is_active,
            CASE WHEN t_req.finish_id IS NOT NULL THEN COALESCE(t_req.name, f.code) ELSE COALESCE(t_en.name, f.code) END AS name
     FROM finishes f
     LEFT JOIN finish_translations t_req ON t_req.finish_id = f.id AND t_req.language_code = ?
     LEFT JOIN finish_translations t_en ON t_en.finish_id = f.id AND t_en.language_code = 'en'
     WHERE f.is_active = 1
     ORDER BY f.display_order`,
    lang,
  );
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
  }));
}

function mapCategory(row: Row) {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? null,
    description: row.description ?? null,
    imageId: row.image_id ?? null,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
  };
}

function mapCollection(row: Row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    story: row.story ?? null,
    description: row.description ?? null,
    coverImageId: row.cover_image_id ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    productCount: toNumber(row.product_count),
  };
}

function mapColor(row: Row) {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    hexApproximation: row.hex_approximation ?? null,
    imageId: row.image_id ?? null,
    imageUrl: row.image_url ?? null,
    textureImageUrl: row.texture_image_url ?? null,
    family: row.family,
    materialType: row.material_type,
    displayOrder: toNumber(row.display_order),
    isActive: toBool(row.is_active),
    isFeatured: toBool(row.is_featured),
    source: row.source ?? null,
    rgb: row.rgb ?? null,
  };
}
