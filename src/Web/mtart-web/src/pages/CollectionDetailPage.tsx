import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useCollection } from '@/features/collections/hooks';
import { useProducts } from '@/features/products/hooks';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';
import { formatApiError } from '@/services/apiClient';

export function CollectionDetailPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { slug } = useParams<{ slug: string }>();
  const { data: collection, isLoading, isError, error, refetch } = useCollection(slug, lang);
  const products = useProducts({ lang, collection: slug, page: 1, pageSize: 12 });

  if (isLoading) {
    return (
      <div className="container-mtart pt-40">
        <Skeleton className="aspect-[21/9] w-full" />
      </div>
    );
  }

  if (isError || !collection) {
    return (
      <div className="pt-32">
        <ErrorState message={formatApiError(error, t('collections.notFound'))} onRetry={!slug ? undefined : () => refetch()} />
        <div className="mt-6 text-center">
          <Link to={ROUTES.collections(lang)} className="text-sm font-medium text-charcoal hover:underline">
            {t('collections.title')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={collection.seoTitle || collection.name}
        description={collection.seoDescription || collection.description || undefined}
        lang={lang}
        path={`/collections/${collection.slug}`}
      />

      <div className="pt-24 md:pt-28">
        <ResponsiveImage
          src={catalogImageUrl(collection.coverImageUrl)}
          alt={collection.name}
          aspectRatio="21/9"
          loading="eager"
          placeholderLabel={collection.name}
        />

        <div className="container-mtart py-10 md:py-14">
          <Link to={ROUTES.collections(lang)} className="inline-flex items-center gap-1.5 text-sm text-charcoal-soft hover:text-charcoal">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t('collections.title')}
          </Link>
          <h1 className="mt-4 font-display text-3xl text-charcoal md:text-4xl">{collection.name}</h1>
          {collection.story ? <p className="mt-4 max-w-2xl text-base text-charcoal-soft/85">{collection.story}</p> : null}
          {collection.description ? <p className="mt-3 max-w-2xl text-sm text-charcoal-soft/70">{collection.description}</p> : null}
        </div>

        <div className="container-mtart border-t border-charcoal/10 py-12 md:py-16">
          <h2 className="mb-8 font-display text-2xl text-charcoal">{t('collections.products')}</h2>

          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.isError ? (
            <ErrorState message={formatApiError(products.error, t('products.unavailable'))} onRetry={() => products.refetch()} />
          ) : !products.data || products.data.items.length === 0 ? (
            <EmptyState message={t('common.noResults')} />
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CollectionDetailPage;
