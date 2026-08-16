import { apiClient, expectArray } from '@/services/apiClient';
import type { Color, ColorFamily, MaterialType } from '@/types/catalog';

export async function fetchColors(
  lang: string,
  family?: ColorFamily,
  activeOnly = true,
  materialType?: MaterialType,
  source?: string,
): Promise<Color[]> {
  const { data } = await apiClient.get<Color[]>('/api/v1/catalog/colors', {
    params: { lang, family, activeOnly, materialType, source },
  });
  return expectArray<Color>(data, '/api/v1/catalog/colors');
}

export async function fetchColorBySlug(slug: string, lang: string): Promise<Color> {
  const { data } = await apiClient.get<Color>(`/api/v1/catalog/colors/${encodeURIComponent(slug)}`, {
    params: { lang },
  });
  return data;
}
