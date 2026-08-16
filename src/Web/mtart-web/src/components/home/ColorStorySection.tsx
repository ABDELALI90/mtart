import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ColorSwatch } from '@/components/product/ColorSwatch';
import { ColorSwatchSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import { useColors } from '@/features/colors/hooks';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function ColorStorySection() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading, isError, error, refetch } = useColors(lang);
  const colors = data?.slice(0, 10) ?? [];

  return (
    <Section tone="sand">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <SectionHeading
          eyebrow={t('colors.title')}
          title={t('home.colorStory.heading')}
          subtitle={t('home.colorStory.subheading')}
          className="mb-0"
        />
        <Link to={ROUTES.colors(lang)} className="whitespace-nowrap text-sm font-medium text-charcoal hover:underline">
          {t('home.colorStory.viewAll')} →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <ColorSwatchSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={formatApiError(error, t('home.colorStory.unavailable'))} onRetry={() => refetch()} />
      ) : colors.length === 0 ? (
        <EmptyState message={t('common.noResults')} />
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-10">
          {colors.map((color) => (
            <ColorSwatch key={color.id} color={color} />
          ))}
        </div>
      )}
    </Section>
  );
}
