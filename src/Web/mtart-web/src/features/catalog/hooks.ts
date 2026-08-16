import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategoryBySlug, fetchFinishes, fetchFormats, fetchShapes } from './api';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useCategories(lang: string) {
  return useQuery({
    queryKey: ['categories', lang],
    queryFn: () => fetchCategories(lang),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useCategory(slug: string | undefined, lang: string) {
  return useQuery({
    queryKey: ['category', slug, lang],
    queryFn: () => fetchCategoryBySlug(slug!, lang),
    enabled: Boolean(slug),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useShapes(lang: string) {
  return useQuery({
    queryKey: ['shapes', lang],
    queryFn: () => fetchShapes(lang),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useFinishes(lang: string) {
  return useQuery({
    queryKey: ['finishes', lang],
    queryFn: () => fetchFinishes(lang),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useFormats(lang: string, shapeId?: string, materialType?: string) {
  return useQuery({
    queryKey: ['formats', 'v2', lang, shapeId ?? null, materialType ?? null],
    queryFn: () => fetchFormats(lang, shapeId, materialType),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}
