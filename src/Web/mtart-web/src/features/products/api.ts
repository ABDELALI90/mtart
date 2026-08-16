import { apiClient, expectArray, expectPaged } from '@/services/apiClient';
import type { PagedResult } from '@/types/pagination';
import type { ProductDetail, ProductListItem, ProductListParams } from '@/types/catalog';

/** GET /api/v1/catalog/products */
export async function fetchProducts(params: ProductListParams): Promise<PagedResult<ProductListItem>> {
  const { data } = await apiClient.get<PagedResult<ProductListItem>>('/api/v1/catalog/products', {
    params: {
      lang: params.lang,
      category: params.category,
      collection: params.collection,
      color: params.color,
      shape: params.shape,
      format: params.format,
      finish: params.finish,
      inStock: params.inStock,
      customizable: params.customizable,
      q: params.q,
      kind: params.kind,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return expectPaged<ProductListItem>(data, '/api/v1/catalog/products');
}

/** GET /api/v1/catalog/products/featured */
export async function fetchFeaturedProducts(lang: string, count = 8): Promise<ProductListItem[]> {
  const { data } = await apiClient.get<ProductListItem[]>('/api/v1/catalog/products/featured', {
    params: { lang, count },
  });
  return expectArray<ProductListItem>(data, '/api/v1/catalog/products/featured');
}

/** GET /api/v1/catalog/products/search */
export async function searchProducts(q: string, lang: string, limit = 10): Promise<ProductListItem[]> {
  const { data } = await apiClient.get<ProductListItem[]>('/api/v1/catalog/products/search', {
    params: { q, lang, limit },
  });
  return expectArray<ProductListItem>(data, '/api/v1/catalog/products/search');
}

/** GET /api/v1/catalog/products/{slug} */
export async function fetchProductBySlug(slug: string, lang: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`, {
    params: { lang },
  });
  return data;
}

/** Resolve the exact catalog product for a Request a Quote link (slug and/or reference). */
export async function fetchProductForQuote(options: {
  slug?: string;
  reference?: string;
  productId?: string;
  lang: string;
}): Promise<ProductDetail> {
  const slug = options.slug?.trim();
  const reference = options.reference?.trim();
  const productId = options.productId?.trim();

  if (slug) {
    try {
      const product = await fetchProductBySlug(slug, options.lang);
      const referenceMatches =
        !reference || product.reference.localeCompare(reference, undefined, { sensitivity: 'accent' }) === 0;
      const idMatches = !productId || product.id === productId;
      if (referenceMatches && idMatches) {
        return product;
      }
    } catch {
      // Fall through to reference search so a stale slug still resolves by CAT-P186, etc.
    }
  }

  if (reference) {
    const matches = await searchProducts(reference, options.lang, 20);
    const exact =
      matches.find((item) => item.reference.localeCompare(reference, undefined, { sensitivity: 'accent' }) === 0) ??
      matches.find((item) => productId && item.id === productId);
    if (exact) {
      return fetchProductBySlug(exact.slug, options.lang);
    }
  }

  throw new Error('Selected product was not found.');
}
