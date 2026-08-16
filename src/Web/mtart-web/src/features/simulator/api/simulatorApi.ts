import { apiClient } from '@/services/apiClient';
import type { PagedResult, PatternCategory, PatternRegion, TilePatternDetail, TilePatternListItem } from '@/types/catalog';
import type { CementMouldRegionInput } from '../types/simulator';

export async function fetchMouldCategories(lang: string): Promise<PatternCategory[]> {
  const { data } = await apiClient.get<PatternCategory[]>('/api/v1/catalog/cement-moulds/categories', { params: { lang } });
  return data;
}

export async function fetchCementMoulds(options: {
  lang: string;
  family?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  simulatorReady?: boolean;
}): Promise<PagedResult<TilePatternListItem>> {
  const { data } = await apiClient.get<PagedResult<TilePatternListItem>>('/api/v1/catalog/cement-moulds', {
    params: {
      lang: options.lang,
      family: options.family,
      category: options.category,
      search: options.search,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 100,
      simulatorReady: options.simulatorReady ?? true,
    },
  });
  return data;
}

export async function fetchCementMould(referenceOrSlug: string, lang: string): Promise<TilePatternDetail> {
  const { data } = await apiClient.get<TilePatternDetail>(
    `/api/v1/catalog/cement-moulds/${encodeURIComponent(referenceOrSlug)}`,
    { params: { lang } },
  );
  return data;
}

export async function fetchCementMouldRegions(referenceOrSlug: string): Promise<PatternRegion[]> {
  const { data } = await apiClient.get<PatternRegion[]>(
    `/api/v1/catalog/cement-moulds/${encodeURIComponent(referenceOrSlug)}/regions`,
  );
  return data;
}

export async function createCementMould(body: {
  reference: string;
  slug: string;
  name: string;
  categoryId: string;
  formatId?: string | null;
  previewImageUrl?: string | null;
  vectorAssetUrl?: string | null;
  isSimulatorReady: boolean;
  displayOrder: number;
  regions: CementMouldRegionInput[];
}) {
  const { data } = await apiClient.post<{ id: string }>('/api/v1/catalog/cement-moulds', body);
  return data;
}

export async function updateCementMould(id: string, body: {
  reference: string;
  slug: string;
  name: string;
  categoryId: string;
  formatId?: string | null;
  previewImageUrl?: string | null;
  vectorAssetUrl?: string | null;
  isSimulatorReady: boolean;
  isActive: boolean;
  displayOrder: number;
  regions: CementMouldRegionInput[];
}) {
  await apiClient.put(`/api/v1/catalog/cement-moulds/${id}`, body);
}

export async function publishCementMould(id: string, isSimulatorReady: boolean, isActive: boolean) {
  await apiClient.post(`/api/v1/catalog/cement-moulds/${id}/publish`, { isSimulatorReady, isActive });
}
