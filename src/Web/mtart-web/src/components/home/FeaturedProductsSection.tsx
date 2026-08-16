import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import { useFeaturedProducts } from '@/features/products/hooks';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function FeaturedProductsSection() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading, isError, error, refetch } = useFeaturedProducts(lang, 8);

  return (
    <Section tone="ivory">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <SectionHeading
          eyebrow={t('products.title')}
          title={t('home.featuredProducts.heading')}
          subtitle={t('home.featuredProducts.subheading')}
          className="mb-0"
        />
        <Link to={ROUTES.products(lang)} className="whitespace-nowrap text-sm font-medium text-charcoal hover:underline">
          {t('home.featuredProducts.viewAll')} →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={formatApiError(error, t('home.featuredProducts.unavailable'))} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState message={t('common.noResults')} />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Section>
  );
}
