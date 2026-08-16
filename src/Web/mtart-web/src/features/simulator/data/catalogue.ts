import type { PatternCategory, PatternRegion, TilePatternDetail, TilePatternListItem } from '@/types/catalog';

export const EXCLUDED_MOULD_REFS = new Set(['1010']);

export interface CatalogueRegion {
  key: string;
  name: string;
}

export interface CatalogueEntry {
  id: string;
  reference: string;
  slug: string;
  name: string;
  category: string;
  family: 'cement' | 'zellige' | string;
  sourceImage?: string | null;
  thumbnail?: string | null;
  svgUrl?: string | null;
  editable: boolean;
  status: string;
  regions: CatalogueRegion[];
  displayOrder: number;
  tags?: string[];
}

export interface CatalogueDiagnostics {
  totalSourceAssets: number;
  tilePatternCandidates: number;
  editableSvgMoulds: number;
  rasterOnlyPatterns: number;
  rejectedRoomPhotos: number;
  rejectedOther?: number;
  catalogueSize?: number;
  extractedFolderExists?: boolean;
  importedReferences?: number;
  originalMoulds?: number;
}

export interface MouldCatalogue {
  diagnostics: CatalogueDiagnostics;
  items: CatalogueEntry[];
}

export function isExcludedMould(item: { reference?: string; slug?: string; vectorAssetUrl?: string | null; previewImageUrl?: string | null }) {
  const reference = (item.reference ?? '').toUpperCase();
  const slug = (item.slug ?? '').toLowerCase();
  const vector = item.vectorAssetUrl ?? '';
  if (EXCLUDED_MOULD_REFS.has(reference) || slug === 'uni' || /\/uni\.svg$/i.test(vector)) {
    return true;
  }
  return !item.vectorAssetUrl && !item.previewImageUrl;
}

export function toListItem(entry: CatalogueEntry): TilePatternListItem {
  return {
    id: entry.id,
    reference: entry.reference,
    slug: entry.slug,
    name: entry.name,
    categorySlug: entry.category,
    categoryName: entry.category,
    previewImageUrl: entry.editable ? (entry.svgUrl ?? entry.thumbnail ?? null) : (entry.thumbnail ?? entry.sourceImage ?? null),
    vectorAssetUrl: entry.editable ? entry.svgUrl ?? null : null,
    regionCount: entry.regions?.length ?? 0,
    isSimulatorReady: true,
    isCustomizable: entry.editable,
    displayOrder: entry.displayOrder,
  };
}

export function toDetail(entry: CatalogueEntry): TilePatternDetail {
  const regions: PatternRegion[] = (entry.regions ?? []).map((region, index) => ({
    id: `${entry.reference}-${region.key}`,
    regionKey: region.key,
    displayName: region.name,
    defaultColorId: null,
    defaultColorCode: null,
    displayOrder: index,
  }));
  return {
    id: entry.id,
    reference: entry.reference,
    slug: entry.slug,
    name: entry.name,
    description: null,
    categoryId: entry.category,
    categorySlug: entry.category,
    categoryName: entry.category,
    formatId: null,
    formatLabel: '20 × 20 cm',
    previewImageUrl: entry.editable ? (entry.svgUrl ?? entry.thumbnail ?? null) : (entry.thumbnail ?? entry.sourceImage ?? null),
    vectorAssetUrl: entry.editable ? entry.svgUrl ?? null : null,
    regionCount: regions.length,
    isCustomizable: entry.editable,
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

export function mergeCatalogues(
  staticItems: TilePatternListItem[],
  apiItems: TilePatternListItem[],
): TilePatternListItem[] {
  const byRef = new Map<string, TilePatternListItem>();
  for (const item of staticItems) {
    if (isExcludedMould(item)) {
      continue;
    }
    byRef.set(item.reference.toUpperCase(), item);
  }
  for (const item of apiItems) {
    if (isExcludedMould(item)) {
      continue;
    }
    const key = item.reference.toUpperCase();
    const existing = byRef.get(key);
    if (!existing) {
      byRef.set(key, item);
      continue;
    }
    byRef.set(key, {
      ...existing,
      id: item.id || existing.id,
      name: item.name || existing.name,
      categoryName: item.categoryName || existing.categoryName,
      previewImageUrl: existing.previewImageUrl || item.previewImageUrl,
      vectorAssetUrl: existing.vectorAssetUrl || item.vectorAssetUrl,
      isCustomizable: existing.isCustomizable || item.isCustomizable,
      regionCount: Math.max(existing.regionCount, item.regionCount),
    });
  }
  return [...byRef.values()].sort((a, b) => {
    if (a.isCustomizable !== b.isCustomizable) {
      return a.isCustomizable ? -1 : 1;
    }
    return a.displayOrder - b.displayOrder || a.reference.localeCompare(b.reference, undefined, { numeric: true });
  });
}

export function categoriesFromCatalogue(
  items: TilePatternListItem[],
  apiCategories: PatternCategory[],
): PatternCategory[] {
  const bySlug = new Map(apiCategories.map((category) => [category.slug, category]));
  items.forEach((item, index) => {
    if (!bySlug.has(item.categorySlug)) {
      bySlug.set(item.categorySlug, {
        id: item.categorySlug,
        code: item.categorySlug,
        slug: item.categorySlug,
        name: item.categoryName || item.categorySlug,
        displayOrder: 80 + index,
      });
    }
  });
  return [...bySlug.values()];
}

export function matchesMouldSearch(item: TilePatternListItem, query: string) {
  if (!query.trim()) {
    return true;
  }
  const hay = `${item.reference} ${item.slug} ${item.name} ${item.categorySlug} ${item.categoryName}`.toLowerCase();
  return hay.includes(query.trim().toLowerCase());
}

export function preferCatalogueDetail(
  api: TilePatternDetail | undefined,
  entry: CatalogueEntry | undefined,
): TilePatternDetail | undefined {
  if (entry?.editable && entry.svgUrl) {
    const local = toDetail(entry);
    if (!api) {
      return local;
    }
    return {
      ...api,
      vectorAssetUrl: local.vectorAssetUrl,
      previewImageUrl: local.vectorAssetUrl ?? local.previewImageUrl,
      regions: local.regions.length > 0 ? local.regions : api.regions,
      regionCount: Math.max(local.regionCount, api.regionCount),
      isCustomizable: true,
    };
  }
  return api;
}

export function lookupEntry(items: CatalogueEntry[], referenceOrSlug?: string) {
  if (!referenceOrSlug) {
    return undefined;
  }
  const key = referenceOrSlug.toLowerCase();
  return items.find((item) => item.reference.toLowerCase() === key || item.slug.toLowerCase() === key || item.id.toLowerCase() === key);
}

export function logCatalogueDiagnostics(diagnostics: CatalogueDiagnostics) {
  console.info('[mould-catalogue] Total source assets found:', diagnostics.totalSourceAssets);
  console.info('[mould-catalogue] Tile-pattern candidates:', diagnostics.tilePatternCandidates);
  console.info('[mould-catalogue] Editable SVG moulds:', diagnostics.editableSvgMoulds);
  console.info('[mould-catalogue] Raster-only patterns:', diagnostics.rasterOnlyPatterns);
  console.info('[mould-catalogue] Rejected room/photos:', diagnostics.rejectedRoomPhotos);
}
