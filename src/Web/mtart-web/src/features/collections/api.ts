import { apiClient, expectArray } from '@/services/apiClient';
import type { Collection } from '@/types/catalog';

/** GET /api/v1/catalog/collections */
export async function fetchCollections(lang: string, activeOnly = true): Promise<Collection[]> {
  const { data } = await apiClient.get<Collection[]>('/api/v1/catalog/collections', {
    params: { lang, activeOnly },
  });
  return expectArray<Collection>(data, '/api/v1/catalog/collections');
}

/** GET /api/v1/catalog/collections/{slug} */
export async function fetchCollectionBySlug(slug: string, lang: string): Promise<Collection> {
  const { data } = await apiClient.get<Collection>(`/api/v1/catalog/collections/${encodeURIComponent(slug)}`, {
    params: { lang },
  });
  return data;
}
