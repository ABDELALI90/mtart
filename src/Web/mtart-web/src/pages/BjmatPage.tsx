import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useProducts } from '@/features/products/hooks';
import { useColors } from '@/features/colors/hooks';
import { useFormats } from '@/features/catalog/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { ErrorState } from '@/components/ui/ErrorState';
import { BjmatLayoutVisualizer } from '@/features/bjmat/BjmatLayoutVisualizer';
import { ROUTES } from '@/utils/paths';
import { formatApiError } from '@/services/apiClient';

const LINKS = [
  { key: 'colors', to: ROUTES.bjmatColors },
  { key: 'formats', to: ROUTES.bjmatFormats },
  { key: 'layouts', to: ROUTES.bjmatLayouts },
  { key: 'projects', to: ROUTES.projects },
  { key: 'products', to: (lang: string) => `${ROUTES.products(lang)}?category=bejmat` },
];

export function BjmatPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isError, error, refetch } = useProducts({ lang, category: 'bejmat', pageSize: 8, sort: 'Featured' });
  const colorsQuery = useColors(lang, undefined, 'Bejmat');
  const formatsQuery = useFormats(lang, undefined, 'Bejmat');
  const colors = colorsQuery.data ?? [];
  const formats = formatsQuery.data ?? [];

  return (
    <>
      <PageMeta title={t('bjmat.title')} description={t('bjmat.subtitle')} lang={lang} path="/bjmat" />
      <div className="pt-24 md:pt-28">
        <div className="relative min-h-[70vh]">
          <ResponsiveImage src="/images/home/bjmat-hero.jpg" alt={t('bjmat.title')} className="absolute inset-0 h-full w-full" loading="eager" />
          <div className="absolute inset-0 mtart-photo-scrim" />
          <div className="container-mtart relative z-10 flex min-h-[70vh] flex-col justify-end pb-16 text-cinema-fg">
            <p className="text-xs uppercase tracking-[0.24em] text-cinema-fg/70">MT ART</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl md:text-6xl">{t('bjmat.title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-cinema-fg/85">{t('bjmat.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={`${ROUTES.products(lang)}?category=bejmat`} size="lg">{t('bjmat.explore')}</Button>
              <Button to={ROUTES.requestQuote(lang)} variant="on-photo" size="lg">{t('common.requestQuote')}</Button>
            </div>
          </div>
        </div>
        <nav className="border-b border-charcoal/10 bg-ivory">
          <div className="container-mtart flex gap-6 overflow-x-auto py-4 text-xs uppercase tracking-[0.14em]">
            {LINKS.map((link) => (
              <Link key={link.key} to={link.to(lang)} className="whitespace-nowrap text-charcoal-soft hover:text-charcoal">
                {t(`bjmat.nav.${link.key}`)}
              </Link>
            ))}
          </div>
        </nav>
        <section className="container-mtart py-16">
          <h2 className="mb-3 font-display text-2xl">{t('bjmat.formatsHeading')}</h2>
          <p className="mb-8 max-w-2xl text-sm text-charcoal-soft/75">{t('bjmat.formatsBody')}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {formatsQuery.isError ? (
              <ErrorState compact message={formatApiError(formatsQuery.error, t('common.errorGeneric'))} onRetry={() => formatsQuery.refetch()} />
            ) : (
              formats.map((format) => (
                <span key={format.id} className="border border-charcoal/15 px-4 py-2">
                  {format.name || `${format.widthCm} × ${format.heightCm} cm`}
                </span>
              ))
            )}
          </div>
        </section>
        <section className="border-y border-charcoal/10 bg-ivory-dark py-16">
          <div className="container-mtart">
            <h2 className="mb-3 font-display text-2xl">{t('bjmat.layoutsHeading')}</h2>
            <p className="mb-8 max-w-2xl text-sm text-charcoal-soft/75">{t('bjmat.layoutsBody')}</p>
            {colorsQuery.isError ? (
              <ErrorState compact message={formatApiError(colorsQuery.error, t('colors.unavailable'))} onRetry={() => colorsQuery.refetch()} />
            ) : colors.length > 0 ? (
              <BjmatLayoutVisualizer colors={colors} />
            ) : null}
          </div>
        </section>
        <section className="container-mtart py-16">
          <h2 className="mb-3 font-display text-2xl">{t('bjmat.variationHeading')}</h2>
          <p className="mb-10 max-w-2xl text-sm text-charcoal-soft/75">{t('bjmat.variationBody')}</p>
          {isError ? (
            <ErrorState message={formatApiError(error, t('products.unavailable'))} onRetry={() => refetch()} />
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default BjmatPage;
