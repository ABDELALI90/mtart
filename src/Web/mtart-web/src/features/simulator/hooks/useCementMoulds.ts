import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchCementMould, fetchCementMoulds, fetchMouldCategories } from '../api/simulatorApi';
import {
  categoriesFromCatalogue,
  logCatalogueDiagnostics,
  lookupEntry,
  mergeCatalogues,
  preferCatalogueDetail,
  toDetail,
  toListItem,
  type MouldCatalogue,
} from '../data/catalogue';
import { hydrateMouldDetail, hydrateMouldListItem } from '../data/mouldAssets';
import type { TilePatternDetail } from '@/types/catalog';

const FIVE_MINUTES = 5 * 60 * 1000;

export type MouldFamily = 'cement' | 'zellige';

async function fetchStaticCatalogue(): Promise<MouldCatalogue> {
  const response = await fetch('/moulds/catalogue.json');
  if (!response.ok) {
    throw new Error(`catalogue.json ${response.status}`);
  }
  return response.json();
}

export function useMouldCatalogue() {
  const query = useQuery({
    queryKey: ['mould-catalogue'],
    queryFn: fetchStaticCatalogue,
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (import.meta.env.DEV && query.data?.diagnostics) {
      logCatalogueDiagnostics(query.data.diagnostics);
    }
  }, [query.data]);

  return query;
}

export function useMouldCategories(lang: string) {
  const catalogue = useMouldCatalogue();
  const api = useQuery({
    queryKey: ['cement-mould-categories', lang],
    queryFn: () => fetchMouldCategories(lang),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
  const items = (catalogue.data?.items ?? []).map(toListItem);
  return {
    ...api,
    data: categoriesFromCatalogue(items, api.data ?? []),
  };
}

export function useCementMoulds(
  lang: string,
  family?: MouldFamily,
  _category?: string,
  _search?: string,
  enabled = true,
) {
  const catalogue = useMouldCatalogue();
  const query = useInfiniteQuery({
    queryKey: ['cement-moulds', lang, family ?? null],
    queryFn: ({ pageParam }) =>
      fetchCementMoulds({
        lang,
        family,
        page: pageParam,
        pageSize: 200,
        simulatorReady: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.pageNumber + 1 : undefined),
    staleTime: FIVE_MINUTES,
    retry: 1,
    enabled,
  });

  useEffect(() => {
    if (enabled && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [enabled, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const staticItems = (catalogue.data?.items ?? [])
    .filter((item) => {
      if (!family) {
        return true;
      }
      return family === 'zellige' ? item.family === 'zellige' : item.family !== 'zellige';
    })
    .map(toListItem);
  const apiItems = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = mergeCatalogues(staticItems, apiItems).map(hydrateMouldListItem);

  return {
    ...query,
    items,
    diagnostics: catalogue.data?.diagnostics,
    isCatalogueLoading: catalogue.isLoading,
  };
}

export function useCementMould(referenceOrSlug: string | undefined, lang: string) {
  const catalogue = useMouldCatalogue();
  return useQuery({
    queryKey: ['cement-mould', referenceOrSlug, lang],
    queryFn: async (): Promise<TilePatternDetail> => {
      const data = catalogue.data ?? await fetchStaticCatalogue().catch(() => null);
      const fallback = lookupEntry(data?.items ?? [], referenceOrSlug);
      try {
        const api = await fetchCementMould(referenceOrSlug!, lang);
        const preferred = preferCatalogueDetail(api, fallback);
        if (preferred) {
          return hydrateMouldDetail(preferred);
        }
        return hydrateMouldDetail(api);
      } catch (error) {
        if (fallback) {
          return hydrateMouldDetail(toDetail(fallback));
        }
        throw error;
      }
    },
    enabled: Boolean(referenceOrSlug && !referenceOrSlug.toUpperCase().startsWith('CUSTOM-')),
    staleTime: FIVE_MINUTES,
    retry: 1,
    placeholderData: () => {
      const fallback = lookupEntry(catalogue.data?.items ?? [], referenceOrSlug);
      return fallback ? hydrateMouldDetail(toDetail(fallback)) : undefined;
    },
  });
}
