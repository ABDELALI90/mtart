import { useCallback, useState } from 'react';
import type { PatternRegion, TilePatternDetail, TilePatternListItem } from '@/types/catalog';
import { isUploadedImageMould, type CustomMould } from '../api/customMouldApi';

const STORAGE = 'mtart.customMoulds';
const COUNTER = 'mtart.customMouldSeq';
const MAX_SAVED = 12;

function readMoulds(): CustomMould[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE) ?? '[]') as CustomMould[];
  } catch {
    return [];
  }
}

function writeMoulds(items: CustomMould[]) {
  sessionStorage.setItem(STORAGE, JSON.stringify(items));
}

export function nextCustomId(): string {
  const current = Number(sessionStorage.getItem(COUNTER) ?? '0') + 1;
  sessionStorage.setItem(COUNTER, String(current));
  return `CUSTOM-${String(current).padStart(3, '0')}`;
}

export function customToListItem(mould: CustomMould): TilePatternListItem {
  return {
    id: mould.id,
    reference: mould.id,
    slug: mould.id.toLowerCase(),
    name: mould.id,
    categorySlug: 'custom',
    categoryName: 'Custom',
    previewImageUrl: mould.sourceImage || mould.svgUrl,
    vectorAssetUrl: isUploadedImageMould(mould) ? null : mould.svgUrl,
    regionCount: mould.regions.length,
    isSimulatorReady: true,
    isCustomizable: true,
    displayOrder: -1000,
  };
}

export function customToDetail(mould: CustomMould): TilePatternDetail {
  const regions: PatternRegion[] = mould.regions.map((region, index) => ({
    id: `${mould.id}-${region.key}`,
    regionKey: region.key,
    displayName: region.name,
    defaultColorId: null,
    defaultColorCode: null,
    displayOrder: index,
  }));
  return {
    id: mould.id,
    reference: mould.id,
    slug: mould.id.toLowerCase(),
    name: mould.id,
    description: null,
    categoryId: 'custom',
    categorySlug: 'custom',
    categoryName: 'Custom',
    formatId: null,
    formatLabel: '20 × 20 cm',
    previewImageUrl: mould.sourceImage || mould.svgUrl,
    vectorAssetUrl: isUploadedImageMould(mould) ? null : mould.svgUrl,
    regionCount: regions.length,
    isCustomizable: true,
    isSimulatorReady: true,
    regions,
    widthCm: 20,
    heightCm: 20,
    unitsPerM2: 25,
    weightPerM2Kg: 18,
    pricePerM2: null,
    currency: 'MAD',
    priceVisibility: 'QuoteOnly',
  };
}

export function useCustomMoulds() {
  const [items, setItems] = useState<CustomMould[]>(() => readMoulds());

  const addMould = useCallback((input: Omit<CustomMould, 'id' | 'custom' | 'createdAt'> & { id?: string }) => {
    const mould: CustomMould = {
      id: input.id ?? nextCustomId(),
      jobId: input.jobId,
      sourceImage: input.sourceImage,
      svgUrl: input.svgUrl,
      kind: input.kind ?? (input.svgUrl ? 'svg' : 'uploaded-image'),
      regions: input.regions,
      custom: true,
      createdAt: Date.now(),
    };
    setItems((current) => {
      const next = [mould, ...current.filter((item) => item.id !== mould.id)].slice(0, MAX_SAVED);
      writeMoulds(next);
      return next;
    });
    return mould;
  }, []);

  return { items, addMould };
}
