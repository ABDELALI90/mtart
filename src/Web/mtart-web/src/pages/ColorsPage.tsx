import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useColors } from '@/features/colors/hooks';
import { catalogImageUrl } from '@/utils/media';
import { ColorSwatchSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import type { ColorFamily, MaterialType } from '@/types/catalog';

const FAMILIES: ColorFamily[] = [
  'White', 'Cream', 'Beige', 'Yellow', 'Orange', 'Pink', 'Red', 'Purple', 'Blue', 'Turquoise', 'Green', 'Brown', 'Grey', 'Black',
];

export function ColorsPage({
  material,
  source,
  titleKey = 'colors.title',
  subtitleKey = 'colors.subtitle',
  path = '/colors',
}: {
  material?: MaterialType;
  source?: string;
  titleKey?: string;
  subtitleKey?: string;
  path?: string;
} = {}) {
  const { t } = useTranslation();
  const lang = useLang();
  const [family, setFamily] = useState<ColorFamily | undefined>(undefined);
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, error, refetch } = useColors(lang, family, material, source);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return data ?? [];
    }
    return (data ?? []).filter(
      (color) =>
        color.code.toLowerCase().includes(term) ||
        color.name.toLowerCase().includes(term) ||
        color.slug.toLowerCase().includes(term),
    );
  }, [data, query]);

  return (
    <>
      <PageMeta title={t(titleKey)} description={t(subtitleKey)} lang={lang} path={path} />
      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart max-w-3xl">
          <h1 className="mtart-page-enter font-display text-3xl text-charcoal md:text-4xl">{t(titleKey)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-charcoal-soft/80 md:text-base">{t(subtitleKey)}</p>
        </div>
      </div>
      <div className="container-mtart py-12 md:py-16">
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label={t('colors.search')}
          placeholder={source === 'UNICOLOR' ? '101, 201, 508' : '1025, 1026, 1009'}
          fullWidth
          size="small"
          sx={{ maxWidth: 360, mb: 3 }}
        />
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip
            label={t('colors.allFamilies')}
            onClick={() => setFamily(undefined)}
            variant={family === undefined ? 'filled' : 'outlined'}
            color={family === undefined ? 'primary' : 'default'}
          />
          {FAMILIES.map((code) => (
            <Chip
              key={code}
              label={t(`colors.families.${code}`)}
              onClick={() => setFamily(code)}
              variant={family === code ? 'filled' : 'outlined'}
              color={family === code ? 'primary' : 'default'}
            />
          ))}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ColorSwatchSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={formatApiError(error, t('colors.unavailable'))} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState message={t('common.noResults')} />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.map((color) => {
              const image = catalogImageUrl(color.imageUrl ?? color.textureImageUrl);
              const webp = image?.replace(/\.png$/i, '.webp');
              return (
                <div key={color.id} className="mtart-card cursor-default">
                  <div className="overflow-hidden bg-ivory-dark" style={{ backgroundColor: image ? undefined : color.hexApproximation ?? '#d9cbae' }}>
                    {image ? (
                      <picture>
                        {webp && webp !== image ? <source type="image/webp" srcSet={webp} /> : null}
                        <img
                          src={image}
                          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                          alt={color.code}
                          className="h-auto w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                    ) : (
                      <div className="aspect-square w-full" style={{ backgroundColor: color.hexApproximation ?? '#d9cbae' }} />
                    )}
                  </div>
                  <p className="mt-3 text-center text-sm font-medium tracking-[0.08em] text-charcoal">{color.code}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default ColorsPage;
