import { all, first, placeholders } from './db';
import {
  displayLabel,
  EMPTY_GUID,
  parseKind,
  toBool,
  toNumber,
  toNumberOrNull,
  type ProductSort,
} from './parse';

type ProductRow = Record<string, unknown>;

const SEARCH_ALIASES: Record<string, { sql: string; params?: unknown[] }> = {
  patterned: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Patterned', 'Patchwork'] },
  motif: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Patterned', 'Patchwork'] },
  motifs: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Patterned', 'Patchwork'] },
  pattern: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Patterned', 'Patchwork'] },
  plain: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Plain', 'ColorSample'] },
  uni: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Plain', 'ColorSample'] },
  liso: { sql: '(p.catalog_kind = ? OR p.catalog_kind = ?)', params: ['Plain', 'ColorSample'] },
  border: { sql: 'p.catalog_kind = ?', params: ['Border'] },
  borders: { sql: 'p.catalog_kind = ?', params: ['Border'] },
  bordure: { sql: 'p.catalog_kind = ?', params: ['Border'] },
  cenefa: { sql: 'p.catalog_kind = ?', params: ['Border'] },
  patchwork: { sql: 'p.catalog_kind = ?', params: ['Patchwork'] },
  custom: { sql: '(p.is_customizable = 1 OR p.is_simulator_ready = 1)' },
  personnalise: { sql: '(p.is_customizable = 1 OR p.is_simulator_ready = 1)' },
  personalizado: { sql: '(p.is_customizable = 1 OR p.is_simulator_ready = 1)' },
};

export interface ListProductsInput {
  lang: string;
  category?: string | null;
  collection?: string | null;
  colorId?: string | null;
  shapeId?: string | null;
  formatId?: string | null;
  finishId?: string | null;
  inStockOnly?: boolean | null;
  customizableOnly?: boolean | null;
  q?: string | null;
  kind?: string | null;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

export async function listProducts(db: D1Database, input: ListProductsInput) {
  const where: string[] = ["p.status = 'Published'", 'p.is_deleted = 0', 'p.is_demo = 0'];
  const params: unknown[] = [];

  const kind = parseKind(input.kind ?? null);
  if (kind) {
    where.push('p.catalog_kind = ?');
    params.push(kind);
  }

  if (input.category) {
    const category = await first<{ id: string }>(
      db,
      'SELECT id FROM categories WHERE slug = ? COLLATE NOCASE LIMIT 1',
      input.category,
    );
    where.push('p.category_id = ? COLLATE NOCASE');
    params.push(category?.id ?? EMPTY_GUID);
  }

  if (input.collection) {
    const collection = await first<{ id: string }>(
      db,
      'SELECT id FROM collections WHERE slug = ? COLLATE NOCASE LIMIT 1',
      input.collection,
    );
    where.push('p.collection_id = ? COLLATE NOCASE');
    params.push(collection?.id ?? EMPTY_GUID);
  }

  if (input.shapeId) {
    where.push('p.shape_id = ? COLLATE NOCASE');
    params.push(input.shapeId);
  }

  if (input.finishId) {
    where.push(
      '(p.finish_id = ? COLLATE NOCASE OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.finish_id = ? COLLATE NOCASE))',
    );
    params.push(input.finishId, input.finishId);
  }

  if (input.colorId) {
    where.push(
      'EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.color_id = ? COLLATE NOCASE)',
    );
    params.push(input.colorId);
  }

  if (input.formatId) {
    where.push(
      'EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.format_id = ? COLLATE NOCASE)',
    );
    params.push(input.formatId);
  }

  if (input.inStockOnly === true) {
    where.push('p.is_in_stock = 1');
  }

  if (input.customizableOnly === true) {
    where.push('p.is_customizable = 1');
  }

  const term = input.q?.trim();
  if (term) {
    const alias = SEARCH_ALIASES[term.toLowerCase()];
    if (alias) {
      where.push(alias.sql);
      if (alias.params) {
        params.push(...alias.params);
      }
    } else {
      where.push(`(
        p.reference LIKE ? OR
        EXISTS (
          SELECT 1 FROM product_translations t
          WHERE t.product_id = p.id AND (
            t.name LIKE ? OR
            (t.short_description IS NOT NULL AND t.short_description LIKE ?) OR
            (t.description IS NOT NULL AND t.description LIKE ?)
          )
        )
      )`);
      const like = `%${term}%`;
      params.push(like, like, like, like);
    }
  }

  const orderBy =
    input.sort === 'Newest'
      ? 'p.created_at DESC'
      : input.sort === 'ReferenceAsc'
        ? 'p.reference ASC'
        : 'p.is_featured DESC, p.display_order ASC';

  const whereSql = where.join(' AND ');
  const countRow = await first<{ total: number }>(
    db,
    `SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`,
    ...params,
  );
  const totalCount = toNumber(countRow?.total);
  const offset = (input.page - 1) * input.pageSize;

  const rows = await all<ProductRow>(
    db,
    `SELECT p.id, p.reference, p.slug, p.category_id, p.collection_id, p.is_featured, p.is_new,
            p.is_customizable, p.is_simulator_ready, p.is_in_stock, p.status, p.catalog_kind,
            p.price_per_m2, p.currency, p.price_visibility, p.pattern_slug,
            COALESCE(pt_req.name, pt_en.name, p.reference) AS name,
            COALESCE(pt_req.short_description, pt_en.short_description) AS short_description
     FROM products p
     LEFT JOIN product_translations pt_req ON pt_req.product_id = p.id AND pt_req.language_code = ?
     LEFT JOIN product_translations pt_en ON pt_en.product_id = p.id AND pt_en.language_code = 'en'
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    input.lang,
    ...params,
    input.pageSize,
    offset,
  );

  const items = await mapListItems(db, rows, input.lang);
  const totalPages = input.pageSize === 0 ? 0 : Math.ceil(totalCount / input.pageSize);
  return {
    items,
    pageNumber: input.page,
    pageSize: input.pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: input.page > 1,
    hasNextPage: input.page < totalPages,
  };
}

export async function getProductBySlug(db: D1Database, slug: string, lang: string) {
  const product = await first<ProductRow>(
    db,
    `SELECT p.* FROM products p
     WHERE p.slug = ? COLLATE NOCASE AND p.is_deleted = 0 AND p.is_demo = 0
     LIMIT 1`,
    slug,
  );
  if (!product) {
    return null;
  }

  const [translation, images, variants, related, category, collection, shape, finish] = await Promise.all([
    pickProductTranslation(db, String(product.id), lang),
    all<ProductRow>(
      db,
      'SELECT id, media_id, image_url, role, display_order FROM product_images WHERE product_id = ? ORDER BY display_order, role',
      product.id,
    ),
    all<ProductRow>(
      db,
      `SELECT v.id, v.sku, v.reference, v.color_id, v.format_id, v.finish_id, v.stock_status,
              v.units_per_m2, v.weight_per_m2_kg, v.thickness_cm, v.minimum_order,
              c.code AS color_code, c.hex_approximation AS color_hex,
              COALESCE(ct_req.name, ct_en.name, c.code) AS color_name,
              f.width_cm, f.height_cm,
              COALESCE(ft_req.name, ft_en.name) AS finish_name
       FROM product_variants v
       JOIN colors c ON c.id = v.color_id
       JOIN formats f ON f.id = v.format_id
       LEFT JOIN color_translations ct_req ON ct_req.color_id = c.id AND ct_req.language_code = ?
       LEFT JOIN color_translations ct_en ON ct_en.color_id = c.id AND ct_en.language_code = 'en'
       LEFT JOIN finishes fin ON fin.id = v.finish_id
       LEFT JOIN finish_translations ft_req ON ft_req.finish_id = fin.id AND ft_req.language_code = ?
       LEFT JOIN finish_translations ft_en ON ft_en.finish_id = fin.id AND ft_en.language_code = 'en'
       WHERE v.product_id = ?`,
      lang,
      lang,
      product.id,
    ),
    all<ProductRow>(
      db,
      `SELECT rp.related_product_id AS id, p.slug,
              COALESCE(pt_req.name, pt_en.name, p.reference) AS name,
              (SELECT media_id FROM product_images i WHERE i.product_id = p.id AND i.role = 'Primary' ORDER BY i.display_order LIMIT 1) AS primary_image_id
       FROM product_related_products rp
       JOIN products p ON p.id = rp.related_product_id AND p.is_deleted = 0
       LEFT JOIN product_translations pt_req ON pt_req.product_id = p.id AND pt_req.language_code = ?
       LEFT JOIN product_translations pt_en ON pt_en.product_id = p.id AND pt_en.language_code = 'en'
       WHERE rp.product_id = ?
       ORDER BY rp.display_order`,
      lang,
      product.id,
    ),
    first<ProductRow>(
      db,
      `SELECT c.id, c.code, c.slug, COALESCE(t_req.name, t_en.name, c.code) AS name
       FROM categories c
       LEFT JOIN category_translations t_req ON t_req.category_id = c.id AND t_req.language_code = ?
       LEFT JOIN category_translations t_en ON t_en.category_id = c.id AND t_en.language_code = 'en'
       WHERE c.id = ? COLLATE NOCASE`,
      lang,
      product.category_id,
    ),
    product.collection_id
      ? first<ProductRow>(
          db,
          `SELECT c.id, c.slug, COALESCE(t_req.name, t_en.name, c.slug) AS name
           FROM collections c
           LEFT JOIN collection_translations t_req ON t_req.collection_id = c.id AND t_req.language_code = ?
           LEFT JOIN collection_translations t_en ON t_en.collection_id = c.id AND t_en.language_code = 'en'
           WHERE c.id = ? COLLATE NOCASE`,
          lang,
          product.collection_id,
        )
      : Promise.resolve(null),
    product.shape_id
      ? first<ProductRow>(
          db,
          `SELECT COALESCE(t_req.name, t_en.name, s.code) AS name
           FROM shapes s
           LEFT JOIN shape_translations t_req ON t_req.shape_id = s.id AND t_req.language_code = ?
           LEFT JOIN shape_translations t_en ON t_en.shape_id = s.id AND t_en.language_code = 'en'
           WHERE s.id = ? COLLATE NOCASE`,
          lang,
          product.shape_id,
        )
      : Promise.resolve(null),
    product.finish_id
      ? first<ProductRow>(
          db,
          `SELECT COALESCE(t_req.name, t_en.name, f.code) AS name
           FROM finishes f
           LEFT JOIN finish_translations t_req ON t_req.finish_id = f.id AND t_req.language_code = ?
           LEFT JOIN finish_translations t_en ON t_en.finish_id = f.id AND t_en.language_code = 'en'
           WHERE f.id = ? COLLATE NOCASE`,
          lang,
          product.finish_id,
        )
      : Promise.resolve(null),
  ]);

  return {
    id: product.id,
    reference: product.reference,
    slug: product.slug,
    name: (translation?.name as string | undefined) ?? product.reference,
    shortDescription: (translation?.short_description as string | null | undefined) ?? null,
    description: (translation?.description as string | null | undefined) ?? null,
    craftsmanship: (translation?.craftsmanship as string | null | undefined) ?? null,
    installationAdvice: (translation?.installation_advice as string | null | undefined) ?? null,
    maintenanceAdvice: (translation?.maintenance_advice as string | null | undefined) ?? null,
    categoryId: product.category_id,
    categorySlug: (category?.slug as string | undefined) ?? '',
    categoryName: (category?.name as string | undefined) ?? (category?.code as string | undefined) ?? '',
    collectionId: product.collection_id ?? null,
    collectionSlug: (collection?.slug as string | undefined) ?? null,
    collectionName: (collection?.name as string | undefined) ?? null,
    shapeId: product.shape_id ?? null,
    shapeName: (shape?.name as string | undefined) ?? null,
    finishId: product.finish_id ?? null,
    finishName: (finish?.name as string | undefined) ?? null,
    isFeatured: toBool(product.is_featured),
    isNew: toBool(product.is_new),
    isCustomizable: toBool(product.is_customizable),
    isInStock: toBool(product.is_in_stock),
    minimumOrderM2: toNumberOrNull(product.minimum_order_m2),
    unitsPerSquareMeter: toNumberOrNull(product.units_per_square_meter),
    weightPerSquareMeterKg: toNumberOrNull(product.weight_per_square_meter_kg),
    thicknessCm: toNumberOrNull(product.thickness_cm),
    countryOfOrigin: product.country_of_origin ?? null,
    material: product.material ?? null,
    productionLeadTime: product.production_lead_time ?? null,
    pricePerM2: toNumberOrNull(product.price_per_m2),
    currency: product.currency,
    priceVisibility: product.price_visibility,
    isSimulatorReady: toBool(product.is_simulator_ready),
    catalogKind: product.catalog_kind,
    patternId: product.pattern_id ?? null,
    patternSlug: product.pattern_slug ?? null,
    status: product.status,
    seoTitle: (translation?.seo_title as string | null | undefined) ?? null,
    seoDescription: (translation?.seo_description as string | null | undefined) ?? null,
    images: images.map((image) => ({
      id: image.id,
      mediaId: image.media_id,
      imageUrl: image.image_url ?? null,
      role: image.role,
      displayOrder: toNumber(image.display_order),
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      reference: variant.reference,
      colorId: variant.color_id,
      colorCode: variant.color_code ?? '',
      colorName: variant.color_name ?? variant.color_code ?? '',
      colorHexApproximation: variant.color_hex ?? null,
      formatId: variant.format_id,
      formatLabel: displayLabel(variant.width_cm, variant.height_cm),
      finishId: variant.finish_id ?? null,
      finishName: variant.finish_name ?? null,
      stockStatus: variant.stock_status,
      unitsPerM2: toNumber(variant.units_per_m2),
      weightPerM2Kg: toNumber(variant.weight_per_m2_kg),
      thicknessCm: toNumber(variant.thickness_cm),
      minimumOrder: toNumberOrNull(variant.minimum_order),
    })),
    relatedProducts: related.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      primaryImageId: item.primary_image_id ?? null,
    })),
  };
}

async function mapListItems(db: D1Database, rows: ProductRow[], lang: string) {
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => String(row.id));
  const inList = placeholders(ids.length);

  const [images, variants, categories, collections] = await Promise.all([
    all<ProductRow>(
      db,
      `SELECT product_id, media_id, image_url, role
       FROM product_images
       WHERE product_id IN (${inList})
       ORDER BY display_order, role`,
      ...ids,
    ),
    all<ProductRow>(
      db,
      `SELECT v.product_id, v.color_id, v.format_id,
              c.code AS color_code,
              COALESCE(ct_req.name, ct_en.name, c.code) AS color_name,
              f.width_cm, f.height_cm
       FROM product_variants v
       JOIN colors c ON c.id = v.color_id
       JOIN formats f ON f.id = v.format_id
       LEFT JOIN color_translations ct_req ON ct_req.color_id = c.id AND ct_req.language_code = ?
       LEFT JOIN color_translations ct_en ON ct_en.color_id = c.id AND ct_en.language_code = 'en'
       WHERE v.product_id IN (${inList})`,
      lang,
      ...ids,
    ),
    all<ProductRow>(
      db,
      `SELECT c.id, c.code, c.slug, COALESCE(t_req.name, t_en.name, c.code) AS name
       FROM categories c
       LEFT JOIN category_translations t_req ON t_req.category_id = c.id AND t_req.language_code = ?
       LEFT JOIN category_translations t_en ON t_en.category_id = c.id AND t_en.language_code = 'en'
       WHERE c.id IN (${placeholders(new Set(rows.map((row) => String(row.category_id))).size)})`,
      lang,
      ...[...new Set(rows.map((row) => String(row.category_id)))],
    ),
    (() => {
      const collectionIds = [...new Set(rows.map((row) => row.collection_id).filter(Boolean).map(String))];
      if (collectionIds.length === 0) {
        return Promise.resolve([] as ProductRow[]);
      }
      return all<ProductRow>(
        db,
        `SELECT c.id, c.slug FROM collections c WHERE c.id IN (${placeholders(collectionIds.length)})`,
        ...collectionIds,
      );
    })(),
  ]);

  const imagesByProduct = groupBy(images, 'product_id');
  const variantsByProduct = groupBy(variants, 'product_id');
  const categoryById = Object.fromEntries(categories.map((item) => [String(item.id), item]));
  const collectionById = Object.fromEntries(collections.map((item) => [String(item.id), item]));

  return rows.map((row) => {
    const category = categoryById[String(row.category_id)];
    const collection = row.collection_id ? collectionById[String(row.collection_id)] : undefined;
    const productImages = imagesByProduct[String(row.id)] ?? [];
    const primary = productImages.find((image) => image.role === 'Primary') ?? productImages[0];
    const hover = productImages.find((image) => image.role === 'Hover');
    const productVariants = variantsByProduct[String(row.id)] ?? [];
    const colorNames = [...new Set(productVariants.map((item) => String(item.color_name ?? item.color_code ?? '')).filter(Boolean))];
    const formatLabels = [
      ...new Set(productVariants.map((item) => displayLabel(item.width_cm, item.height_cm))),
    ];

    return {
      id: row.id,
      reference: row.reference,
      slug: row.slug,
      name: row.name,
      shortDescription: row.short_description ?? null,
      categoryId: row.category_id,
      categorySlug: (category?.slug as string | undefined) ?? '',
      categoryName: (category?.name as string | undefined) ?? (category?.code as string | undefined) ?? '',
      collectionId: row.collection_id ?? null,
      collectionSlug: (collection?.slug as string | undefined) ?? null,
      primaryImageId: primary?.media_id ?? null,
      hoverImageId: hover?.media_id ?? null,
      primaryImageUrl: primary?.image_url ?? null,
      hoverImageUrl: hover?.image_url ?? null,
      isFeatured: toBool(row.is_featured),
      isNew: toBool(row.is_new),
      isCustomizable: toBool(row.is_customizable),
      isSimulatorReady: toBool(row.is_simulator_ready),
      isInStock: toBool(row.is_in_stock),
      status: row.status,
      catalogKind: row.catalog_kind,
      pricePerM2: toNumberOrNull(row.price_per_m2),
      currency: row.currency,
      priceVisibility: row.price_visibility,
      patternSlug: row.pattern_slug ?? null,
      representativeColorNames: colorNames,
      representativeFormatLabels: formatLabels,
    };
  });
}

async function pickProductTranslation(
  db: D1Database,
  id: string,
  lang: string,
): Promise<ProductRow | null> {
  const requested = await first<ProductRow>(
    db,
    'SELECT * FROM product_translations WHERE product_id = ? AND language_code = ? LIMIT 1',
    id,
    lang,
  );
  if (requested) {
    return requested;
  }
  if (lang !== 'en') {
    const english = await first<ProductRow>(
      db,
      "SELECT * FROM product_translations WHERE product_id = ? AND language_code = 'en' LIMIT 1",
      id,
    );
    if (english) {
      return english;
    }
  }
  return first<ProductRow>(db, 'SELECT * FROM product_translations WHERE product_id = ? LIMIT 1', id);
}

function groupBy(rows: ProductRow[], key: string): Record<string, ProductRow[]> {
  const grouped: Record<string, ProductRow[]> = {};
  for (const row of rows) {
    const id = String(row[key]);
    (grouped[id] ??= []).push(row);
  }
  return grouped;
}
