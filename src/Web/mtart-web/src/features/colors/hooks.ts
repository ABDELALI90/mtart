import { useQuery } from '@tanstack/react-query';
import { fetchColorBySlug, fetchColors } from './api';
import type { ColorFamily, MaterialType } from '@/types/catalog';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useColors(lang: string, family?: ColorFamily, materialType?: MaterialType, source?: string) {
  return useQuery({
    queryKey: ['colors', lang, family, materialType, source],
    queryFn: () => fetchColors(lang, family, true, materialType, source),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}

export function useColor(slug: string | undefined, lang: string) {
  return useQuery({
    queryKey: ['color', slug, lang],
    queryFn: () => fetchColorBySlug(slug!, lang),
    enabled: Boolean(slug),
    staleTime: FIVE_MINUTES,
    retry: 1,
  });
}
