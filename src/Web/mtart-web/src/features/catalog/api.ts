import { apiClient, expectArray } from '@/services/apiClient';
import type { Category, Finish, Format, Shape } from '@/types/catalog';

/** GET /api/v1/catalog/categories */
export async function fetchCategories(lang: string, activeOnly = true): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/v1/catalog/categories', {
    params: { lang, activeOnly },
  });
  return expectArray<Category>(data, '/api/v1/catalog/categories');
}

/** GET /api/v1/catalog/categories/{slug} */
export async function fetchCategoryBySlug(slug: string, lang: string): Promise<Category> {
  const { data } = await apiClient.get<Category>(`/api/v1/catalog/categories/${encodeURIComponent(slug)}`, {
    params: { lang },
  });
  return data;
}

/** GET /api/v1/catalog/shapes */
export async function fetchShapes(lang: string): Promise<Shape[]> {
  const { data } = await apiClient.get<Shape[]>('/api/v1/catalog/shapes', { params: { lang } });
  return expectArray<Shape>(data, '/api/v1/catalog/shapes');
}

/** GET /api/v1/catalog/finishes */
export async function fetchFinishes(lang: string): Promise<Finish[]> {
  const { data } = await apiClient.get<Finish[]>('/api/v1/catalog/finishes', { params: { lang } });
  return expectArray<Finish>(data, '/api/v1/catalog/finishes');
}

/** GET /api/v1/catalog/formats */
export async function fetchFormats(lang: string, shapeId?: string, materialType?: string): Promise<Format[]> {
  const { data } = await apiClient.get<Format[]>('/api/v1/catalog/formats', {
    params: {
      lang,
      ...(shapeId ? { shapeId } : {}),
      ...(materialType ? { materialType } : {}),
    },
  });
  return expectArray<Format>(data, '/api/v1/catalog/formats');
}
