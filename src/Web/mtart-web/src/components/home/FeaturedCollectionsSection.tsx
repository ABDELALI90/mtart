import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Section, SectionHeading } from '@/components/ui/Section';
import { CollectionCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { useCollections } from '@/features/collections/hooks';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function FeaturedCollectionsSection() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading, isError, error, refetch } = useCollections(lang);
  const collections = data?.slice(0, 4) ?? [];

  return (
    <Section tone="ivory">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <SectionHeading
          eyebrow={t('collections.title')}
          title={t('home.collections.heading')}
          subtitle={t('home.collections.subheading')}
          className="mb-0"
        />
        <Link to={ROUTES.collections(lang)} className="whitespace-nowrap text-sm font-medium text-charcoal hover:underline">
          {t('home.collections.viewAll')} →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={formatApiError(error, t('home.collections.unavailable'))} onRetry={() => refetch()} />
      ) : collections.length === 0 ? (
        <EmptyState message={t('common.noResults')} />
      ) : (
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {collections.map((collection, index) => (
            <CollectionCard key={collection.id} collection={collection} lang={lang} index={index} />
          ))}
        </div>
      )}
    </Section>
  );
}
