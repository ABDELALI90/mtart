import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';
import { requestQuoteHref } from '@/features/quote/quoteUrl';
import type { ProductListItem } from '@/types/catalog';

export function ProductCard({ product }: { product: ProductListItem }) {
  const { t } = useTranslation();
  const lang = useLang();
  const image = catalogImageUrl(product.primaryImageUrl, { cropped: true });
  const formatLabel = product.representativeFormatLabels[0];

  return (
    <article className="mtart-card mtart-media-card group">
      <Link to={ROUTES.product(lang, product.slug)} className="block">
        <div className="relative overflow-hidden">
          <ResponsiveImage
            src={image}
            alt={product.name}
            aspectRatio="1/1"
            placeholderLabel={product.name}
            className="mtart-card-media"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 rtl:left-auto rtl:right-3">
            {product.isNew ? <Badge tone="terracotta">{t('common.new')}</Badge> : null}
            {product.isSimulatorReady ? <Badge tone="charcoal">{t('common.customize')}</Badge> : null}
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal-soft/70">{product.reference}</p>
          <h3 className="font-display text-lg text-charcoal">{product.name}</h3>
          <p className="text-sm text-charcoal-soft/80">{product.categoryName}</p>
          {formatLabel ? <p className="text-sm text-charcoal-soft/75">{formatLabel}</p> : null}
          <PriceDisplay
            amount={product.pricePerM2}
            currency={product.currency}
            visibility={product.priceVisibility}
            size="lg"
            className="pt-1"
          />
        </div>
      </Link>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link to={ROUTES.product(lang, product.slug)} className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal hover:underline">
          {t('common.view')}
        </Link>
        {product.isSimulatorReady ? (
          <Link to={`${ROUTES.cementSimulator(lang)}?mould=${product.patternSlug ?? product.slug}`} className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal-soft hover:underline">
            {t('common.customize')}
          </Link>
        ) : null}
        <Link
          to={requestQuoteHref(lang, product)}
          className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal-soft hover:underline"
        >
          {t('common.requestQuote')}
        </Link>
      </div>
    </article>
  );
}
