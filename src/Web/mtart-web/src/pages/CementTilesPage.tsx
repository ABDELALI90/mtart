import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useProducts } from '@/features/products/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { CementTilesHeroSlider } from '@/components/cement/CementTilesHeroSlider';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/utils/paths';
import { formatApiError } from '@/services/apiClient';

const LINKS = [
  { key: 'models', to: (lang: string) => `${ROUTES.products(lang)}?category=cement-tiles` },
  { key: 'simulator', to: ROUTES.cementSimulator },
  { key: 'colors', to: ROUTES.cementColors },
  { key: 'formats', to: ROUTES.cementFormats },
  { key: 'stock', to: (lang: string) => `${ROUTES.products(lang)}?category=cement-tiles&inStock=true` },
  { key: 'projects', to: ROUTES.projects },
  { key: 'guide', to: ROUTES.craftsmanship },
];

export function CementTilesPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isError, error, refetch } = useProducts({ lang, category: 'cement-tiles', pageSize: 8, sort: 'Featured' });

  return (
    <>
      <PageMeta title={t('cementTiles.title')} description={t('cementTiles.subtitle')} lang={lang} path="/cement-tiles" />
      <div className="pt-24 md:pt-28">
        <CementTilesHeroSlider>
          <div className="pointer-events-none absolute inset-0 z-10 mtart-photo-scrim" />
          <div className="container-mtart pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-10 text-cinema-fg md:pb-14">
            <p className="text-xs uppercase tracking-[0.24em] text-cinema-fg/70">MT ART</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl md:text-6xl">{t('cementTiles.title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-cinema-fg/85">{t('cementTiles.subtitle')}</p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Button to={ROUTES.cementSimulator(lang)} size="lg">{t('cementTiles.simulatorCta')}</Button>
              <Button to={`${ROUTES.products(lang)}?category=cement-tiles`} variant="on-photo" size="lg">{t('cementTiles.modelsCta')}</Button>
            </div>
          </div>
        </CementTilesHeroSlider>
        <nav className="border-b border-charcoal/10 bg-ivory">
          <div className="container-mtart flex gap-6 overflow-x-auto py-4 text-xs uppercase tracking-[0.14em]">
            {LINKS.map((link) => (
              <Link key={link.key} to={link.to(lang)} className="whitespace-nowrap text-charcoal-soft hover:text-charcoal">
                {t(`cementTiles.nav.${link.key}`)}
              </Link>
            ))}
          </div>
        </nav>
        <div className="container-mtart py-16">
          <h2 className="mb-8 font-display text-2xl">{t('cementTiles.featured')}</h2>
          {isError ? (
            <ErrorState message={formatApiError(error, t('products.unavailable'))} onRetry={() => refetch()} />
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CementTilesPage;
