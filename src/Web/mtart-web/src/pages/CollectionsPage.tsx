import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useCollections } from '@/features/collections/hooks';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { CollectionCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';

export function CollectionsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading, isError, error, refetch } = useCollections(lang);

  return (
    <>
      <PageMeta title={t('collections.title')} lang={lang} path="/collections" />

      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="mtart-page-enter font-display text-3xl text-charcoal md:text-4xl">{t('collections.title')}</h1>
        </div>
      </div>

      <div className="container-mtart py-14 md:py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={formatApiError(error, t('collections.unavailable'))} onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState message={t('common.noResults')} />
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((collection, index) => (
              <CollectionCard key={collection.id} collection={collection} lang={lang} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CollectionsPage;
