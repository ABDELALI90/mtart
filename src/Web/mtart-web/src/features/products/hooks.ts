import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchFeaturedProducts, fetchProductBySlug, fetchProductForQuote, fetchProducts, searchProducts } from './api';
import type { ProductListParams } from '@/types/catalog';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: FIVE_MINUTES,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useFeaturedProducts(lang: string, count = 8) {
  return useQuery({
    queryKey: ['products', 'featured', lang, count],
    queryFn: () => fetchFeaturedProducts(lang, count),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useProductSearch(q: string, lang: string, enabled: boolean) {
  return useQuery({
    queryKey: ['products', 'search', q, lang],
    queryFn: () => searchProducts(q, lang),
    enabled: enabled && q.trim().length > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useProduct(slug: string | undefined, lang: string) {
  return useQuery({
    queryKey: ['product', slug, lang],
    queryFn: () => fetchProductBySlug(slug!, lang),
    enabled: Boolean(slug),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useQuoteProduct(
  params: { slug?: string; reference?: string; productId?: string; lang: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['quote-product', params.slug, params.reference, params.productId, params.lang],
    queryFn: () => fetchProductForQuote(params),
    enabled,
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}
