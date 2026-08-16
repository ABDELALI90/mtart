import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useColor, useColors } from '@/features/colors/hooks';
import { useProducts } from '@/features/products/hooks';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { ColorSwatch } from '@/components/product/ColorSwatch';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';

export function ColorDetailPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { slug } = useParams<{ slug: string }>();
  const { data: color, isError, refetch } = useColor(slug, lang);
  const { data: related = [] } = useColors(lang, color?.family, color?.materialType, color?.source ?? undefined);
  const { data: products } = useProducts({ lang, pageSize: 8 });

  if (isError || !color) {
    return <div className="pt-32"><ErrorState message={t('colors.unavailable')} onRetry={() => refetch()} /></div>;
  }

  return (
    <>
      <PageMeta title={`${color.code} ${color.name}`} description={color.description ?? undefined} lang={lang} path={`/colors/${color.slug}`} />
      <div className="pt-24 md:pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <ResponsiveImage src={catalogImageUrl(color.imageUrl)} alt={color.name} className="min-h-[70vh]" loading="eager" placeholderLabel={color.name} />
          <div className="flex flex-col justify-center px-8 py-16 md:px-16">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal-soft">{color.code}</p>
            <h1 className="mt-3 font-display text-4xl text-charcoal">{color.name}</h1>
            <p className="mt-4 text-sm text-charcoal-soft/80">{t(`colors.families.${color.family}`)} · {t(`colors.materials.${color.materialType}`)}</p>
            <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal-soft/85">{color.description}</p>
            <p className="mt-6 max-w-md text-sm text-charcoal-soft/70">{t('colors.naturalVariation')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={`${ROUTES.requestQuote(lang)}?color=${color.code}&product=${encodeURIComponent(color.name)}`}>{t('common.requestQuote')}</Button>
              <Button to={ROUTES.products(lang)} variant="secondary">{t('colors.viewProducts')}</Button>
            </div>
          </div>
        </div>
        <div className="container-mtart py-16">
          <h2 className="mb-8 font-display text-2xl">{t('colors.related')}</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
            {related.filter((item) => item.id !== color.id).slice(0, 6).map((item) => (
              <ColorSwatch key={item.id} color={item} />
            ))}
          </div>
          {products?.items.length ? (
            <>
              <h2 className="mb-8 mt-16 font-display text-2xl">{t('colors.matchingProducts')}</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {products.items.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : null}
          <div className="mt-10">
            <Link to={ROUTES.colors(lang)} className="text-sm text-charcoal hover:underline">{t('colors.title')} →</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default ColorDetailPage;
