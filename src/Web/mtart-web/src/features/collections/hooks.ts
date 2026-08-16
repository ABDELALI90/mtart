import { useQuery } from '@tanstack/react-query';
import { fetchCollectionBySlug, fetchCollections } from './api';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useCollections(lang: string) {
  return useQuery({
    queryKey: ['collections', lang],
    queryFn: () => fetchCollections(lang),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useCollection(slug: string | undefined, lang: string) {
  return useQuery({
    queryKey: ['collection', slug, lang],
    queryFn: () => fetchCollectionBySlug(slug!, lang),
    enabled: Boolean(slug),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}
