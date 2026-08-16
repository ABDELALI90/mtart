import { apiClient } from '@/services/apiClient';
import type { PagedResult } from '@/types/catalog';

export interface CustomDesignDto {
  id: string;
  reference: string;
  name: string;
  widthCm: number;
  heightCm: number;
  unit: string;
  geometryJson: string;
  svgMarkup: string;
  thumbnailSvg?: string | null;
  repeatMode: string;
  colorSummaryJson?: string | null;
  sourceMouldId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CustomDesignListItem {
  id: string;
  reference: string;
  name: string;
  widthCm: number;
  heightCm: number;
  repeatMode: string;
  thumbnailSvg?: string | null;
  colorSummaryJson?: string | null;
  createdAt: string;
}

export interface ManufacturingSettingsDto {
  minRegionAreaMm2: number;
  minRegionWidthMm: number;
  maxOverlapRatio: number;
  minGapMm: number;
}

export async function fetchManufacturingSettings(): Promise<ManufacturingSettingsDto> {
  const { data } = await apiClient.get<ManufacturingSettingsDto>('/api/v1/catalog/custom-designs/manufacturing-settings');
  return data;
}

export async function fetchCustomDesigns(page = 1): Promise<PagedResult<CustomDesignListItem>> {
  const { data } = await apiClient.get<PagedResult<CustomDesignListItem>>('/api/v1/catalog/custom-designs', {
    params: { page, pageSize: 24 },
  });
  return data;
}

export async function fetchCustomDesign(referenceOrId: string): Promise<CustomDesignDto> {
  const { data } = await apiClient.get<CustomDesignDto>(`/api/v1/catalog/custom-designs/${encodeURIComponent(referenceOrId)}`);
  return data;
}

export async function saveCustomDesign(body: {
  name?: string;
  widthCm: number;
  heightCm: number;
  geometryJson: string;
  svgMarkup: string;
  thumbnailSvg?: string;
  repeatMode: string;
  colorSummaryJson?: string;
  sourceMouldId?: string | null;
}): Promise<CustomDesignDto> {
  const { data } = await apiClient.post<CustomDesignDto>('/api/v1/catalog/custom-designs', body);
  return data;
}

export async function updateCustomDesign(id: string, body: {
  name: string;
  widthCm: number;
  heightCm: number;
  geometryJson: string;
  svgMarkup: string;
  thumbnailSvg?: string;
  repeatMode: string;
  colorSummaryJson?: string;
}): Promise<CustomDesignDto> {
  const { data } = await apiClient.put<CustomDesignDto>(`/api/v1/catalog/custom-designs/${id}`, body);
  return data;
}
