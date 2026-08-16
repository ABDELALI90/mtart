import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../_lib/env';
import { bindError, json, problem, safeError } from '../../../_lib/http';
import {
  normalizeLang,
  parseBool,
  parseGuid,
  parseIntParam,
  parseMaterialTypeName,
  parseMaterialTypeNumber,
  parseOptionalBool,
  parseSlug,
  parseSort,
} from '../../../_lib/parse';
import { getProductBySlug, listProducts } from '../../../_lib/products';
import {
  getCategoryBySlug,
  getCollectionBySlug,
  getColorBySlug,
  listCategories,
  listCollections,
  listColors,
  listFinishes,
  listFormats,
  listShapes,
} from '../../../_lib/taxonomy';

const COLOR_FAMILIES: Record<string, string> = {
  white: 'White',
  cream: 'Cream',
  beige: 'Beige',
  yellow: 'Yellow',
  orange: 'Orange',
  terracotta: 'Terracotta',
  red: 'Red',
  pink: 'Pink',
  purple: 'Purple',
  green: 'Green',
  turquoise: 'Turquoise',
  blue: 'Blue',
  brown: 'Brown',
  grey: 'Grey',
  black: 'Black',
  metallic: 'Metallic',
  special: 'Special',
};

function routeParts(route: string | string[] | undefined): string[] {
  if (!route) {
    return [];
  }
  return Array.isArray(route) ? route : [route];
}

export const onRequestGet: PagesFunction<Env, 'route'> = async (context) => {
  const url = new URL(context.request.url);
  const instance = url.pathname;
  const segments = routeParts(context.params.route);
  const db = context.env.DB;
  if (!db) {
    return problem(500, 'server_error', 'An unexpected error occurred.', instance);
  }

  try {
    const lang = normalizeLang(url.searchParams.get('lang'));

    if (segments[0] === 'products' && segments.length === 1) {
      return await handleProductList(db, url, instance, lang);
    }
    if (segments[0] === 'products' && segments[1] === 'featured' && segments.length === 2) {
      return await handleFeatured(db, url, instance, lang);
    }
    if (segments[0] === 'products' && segments[1] === 'search' && segments.length === 2) {
      return await handleSearch(db, url, instance, lang);
    }
    if (segments[0] === 'products' && segments.length === 2) {
      const slug = parseSlug(segments[1]);
      if (!slug) {
        return problem(404, 'products.not_found', `Product '${segments[1]}' was not found.`, instance, 'notfound');
      }
      const product = await getProductBySlug(db, slug, lang);
      if (!product) {
        return problem(404, 'products.not_found', `Product '${segments[1]}' was not found.`, instance, 'notfound');
      }
      return json(product);
    }

    if (segments[0] === 'colors' && segments.length === 1) {
      const familyRaw = url.searchParams.get('family');
      const family = familyRaw ? (COLOR_FAMILIES[familyRaw.trim().toLowerCase()] ?? null) : null;
      const material = parseMaterialTypeName(url.searchParams.get('materialType') ?? url.searchParams.get('material'));
      const source = url.searchParams.get('source');
      const colors = await listColors(
        db,
        lang,
        parseBool(url.searchParams.get('activeOnly'), true),
        family,
        material,
        source && source.trim() ? source.trim() : null,
      );
      return json(colors);
    }
    if (segments[0] === 'colors' && segments.length === 2) {
      const slug = parseSlug(segments[1]);
      if (!slug) {
        return problem(404, 'colors.not_found', `Color '${segments[1]}' was not found.`, instance, 'notfound');
      }
      const color = await getColorBySlug(db, slug, lang);
      if (!color) {
        return problem(404, 'colors.not_found', `Color '${segments[1]}' was not found.`, instance, 'notfound');
      }
      return json(color);
    }

    if (segments[0] === 'categories' && segments.length === 1) {
      return json(await listCategories(db, lang, parseBool(url.searchParams.get('activeOnly'), true)));
    }
    if (segments[0] === 'categories' && segments.length === 2) {
      const slug = parseSlug(segments[1]);
      if (!slug) {
        return problem(404, 'categories.not_found', `Category '${segments[1]}' was not found.`, instance, 'notfound');
      }
      const category = await getCategoryBySlug(db, slug, lang);
      if (!category) {
        return problem(404, 'categories.not_found', `Category '${segments[1]}' was not found.`, instance, 'notfound');
      }
      return json(category);
    }

    if (segments[0] === 'collections' && segments.length === 1) {
      return json(await listCollections(db, lang, parseBool(url.searchParams.get('activeOnly'), true)));
    }
    if (segments[0] === 'collections' && segments.length === 2) {
      const slug = parseSlug(segments[1]);
      if (!slug) {
        return problem(404, 'collections.not_found', `Collection '${segments[1]}' was not found.`, instance, 'notfound');
      }
      const collection = await getCollectionBySlug(db, slug, lang);
      if (!collection) {
        return problem(404, 'collections.not_found', `Collection '${segments[1]}' was not found.`, instance, 'notfound');
      }
      return json(collection);
    }

    if (segments[0] === 'formats' && segments.length === 1) {
      const shape = parseGuid(url.searchParams.get('shapeId'));
      if (!shape.ok) {
        return bindError(instance, 'shapeId', url.searchParams.get('shapeId') ?? '');
      }
      const material = parseMaterialTypeNumber(url.searchParams.get('materialType'));
      if (!material.ok) {
        return bindError(instance, 'materialType', url.searchParams.get('materialType') ?? '');
      }
      return json(
        await listFormats(db, lang, parseBool(url.searchParams.get('activeOnly'), true), shape.value, material.value),
      );
    }

    if (segments[0] === 'shapes' && segments.length === 1) {
      return json(await listShapes(db, lang));
    }
    if (segments[0] === 'finishes' && segments.length === 1) {
      return json(await listFinishes(db, lang));
    }

    return problem(404, 'not_found', 'The requested resource was not found.', instance, 'notfound');
  } catch {
    return safeError(instance);
  }
};

async function handleProductList(db: D1Database, url: URL, instance: string, lang: string) {
  const page = parseIntParam(url.searchParams.get('page'), 1);
  const pageSize = parseIntParam(url.searchParams.get('pageSize'), 20);
  if (page < 1) {
    return problem(400, 'validation', 'pageNumber must be greater than or equal to 1.', instance);
  }
  if (pageSize < 1 || pageSize > 100) {
    return problem(400, 'validation', 'pageSize must be between 1 and 100.', instance);
  }
  const sort = parseSort(url.searchParams.get('sort'));
  if (!sort) {
    return bindError(instance, 'sort', url.searchParams.get('sort') ?? '');
  }
  const color = parseGuid(url.searchParams.get('color'));
  const shape = parseGuid(url.searchParams.get('shape'));
  const format = parseGuid(url.searchParams.get('format'));
  const finish = parseGuid(url.searchParams.get('finish'));
  if (!color.ok) return bindError(instance, 'color', url.searchParams.get('color') ?? '');
  if (!shape.ok) return bindError(instance, 'shape', url.searchParams.get('shape') ?? '');
  if (!format.ok) return bindError(instance, 'format', url.searchParams.get('format') ?? '');
  if (!finish.ok) return bindError(instance, 'finish', url.searchParams.get('finish') ?? '');

  const result = await listProducts(db, {
    lang,
    category: url.searchParams.get('category'),
    collection: url.searchParams.get('collection'),
    colorId: color.value,
    shapeId: shape.value,
    formatId: format.value,
    finishId: finish.value,
    inStockOnly: parseOptionalBool(url.searchParams.get('inStock')),
    customizableOnly: parseOptionalBool(url.searchParams.get('customizable')),
    q: url.searchParams.get('q'),
    kind: url.searchParams.get('kind'),
    sort,
    page,
    pageSize,
  });
  return json(result);
}

async function handleFeatured(db: D1Database, url: URL, instance: string, lang: string) {
  const count = parseIntParam(url.searchParams.get('count'), 8);
  if (count < 1 || count > 100) {
    return problem(400, 'validation', 'pageSize must be between 1 and 100.', instance);
  }
  const result = await listProducts(db, {
    lang,
    sort: 'Featured',
    page: 1,
    pageSize: count,
  });
  return json(result.items);
}

async function handleSearch(db: D1Database, url: URL, instance: string, lang: string) {
  const q = url.searchParams.get('q');
  if (!q || !q.trim()) {
    return json([]);
  }
  const limit = parseIntParam(url.searchParams.get('limit'), 10);
  if (limit < 1 || limit > 100) {
    return problem(400, 'validation', 'pageSize must be between 1 and 100.', instance);
  }
  const result = await listProducts(db, {
    lang,
    q,
    sort: 'Featured',
    page: 1,
    pageSize: limit,
  });
  return json(result.items);
}
