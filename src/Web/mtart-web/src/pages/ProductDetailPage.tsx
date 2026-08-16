import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useProduct } from '@/features/products/hooks';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';
import { requestQuoteHref } from '@/features/quote/quoteUrl';
import type { ProductListItem } from '@/types/catalog';

export function ProductDetailPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(slug, lang);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="container-mtart grid grid-cols-1 gap-10 py-32 pt-40 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="pt-32">
        <ErrorState message={t('productDetail.notFound')} onRetry={!slug ? undefined : () => refetch()} />
        <div className="mt-6 text-center">
          <Link to={ROUTES.products(lang)} className="text-sm font-medium text-charcoal hover:underline">
            {t('productDetail.backToProducts')}
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [{ id: 'placeholder', mediaId: '', imageUrl: null, role: 'Primary' as const, displayOrder: 0 }];
  const uniqueColors = Array.from(new Map(product.variants.map((v) => [v.colorId, v])).values());
  const uniqueFormats = Array.from(new Map(product.variants.map((v) => [v.formatId, v])).values());

  return (
    <>
      <PageMeta
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.shortDescription || undefined}
        lang={lang}
        path={`/products/${product.slug}`}
      />

      <div className="pt-24 md:pt-28">
        <div className="container-mtart pt-6">
          <Link to={ROUTES.products(lang)} className="inline-flex items-center gap-1.5 text-sm text-charcoal-soft hover:text-charcoal">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t('productDetail.backToProducts')}
          </Link>
        </div>

        <div className="container-mtart grid grid-cols-1 gap-10 py-8 md:grid-cols-2 md:gap-16 md:py-12">
          <div>
            <ResponsiveImage
              src={catalogImageUrl(images[activeImage]?.imageUrl)}
              alt={product.name}
              aspectRatio="1/1"
              loading="eager"
              placeholderLabel={product.name}
            />
            {images.length > 1 ? (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-current={activeImage === index}
                    className={activeImage === index ? 'ring-2 ring-petrol' : ''}
                  >
                    <ResponsiveImage src={catalogImageUrl(image.imageUrl, { cropped: true })} alt="" aspectRatio="1/1" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal-soft/70">{product.reference}</p>
            <h1 className="mt-2 font-display text-3xl text-charcoal md:text-4xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.isNew ? <Badge tone="terracotta">{t('common.new')}</Badge> : null}
              {product.isFeatured ? <Badge tone="petrol">{t('common.featured')}</Badge> : null}
              {product.isCustomizable ? <Badge>{t('common.customizable')}</Badge> : null}
            </div>

            {product.shortDescription ? (
              <p className="mt-5 text-base text-charcoal-soft/85">{product.shortDescription}</p>
            ) : null}

            <div className="mt-6">
              <PriceDisplay amount={product.pricePerM2} currency={product.currency} visibility={product.priceVisibility} size="xl" />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-charcoal/10 py-6 text-sm">
              {product.collectionName ? (
                <Field label={t('productDetail.collection')} value={product.collectionName} />
              ) : null}
              <Field label={t('productDetail.category')} value={product.categoryName} />
              {product.finishName ? <Field label={t('productDetail.finish')} value={product.finishName} /> : null}
              {product.thicknessCm ? (
                <Field label={t('productDetail.thickness')} value={`${product.thicknessCm} cm`} />
              ) : null}
              {product.unitsPerSquareMeter ? (
                <Field label={t('productDetail.unitsPerM2')} value={String(product.unitsPerSquareMeter)} />
              ) : null}
              {product.weightPerSquareMeterKg ? (
                <Field label={t('productDetail.weightPerM2')} value={`${product.weightPerSquareMeterKg} kg`} />
              ) : null}
              <Field label={t('productDetail.stock')} value={product.isInStock ? t('common.inStock') : t('common.madeToOrder')} />
            </dl>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button to={requestQuoteHref(lang, product)} size="lg">
                {t('common.requestQuote')}
              </Button>
              {product.isSimulatorReady ? (
                <Button to={`${ROUTES.simulator(lang)}?pattern=${product.patternSlug ?? product.slug}`} variant="secondary" size="lg">
                  {t('common.customize')}
                </Button>
              ) : null}
              <Button to={requestQuoteHref(lang, product, { sample: '1' })} variant="secondary" size="lg">
                {t('common.requestSample')}
              </Button>
            </div>
          </div>
        </div>

        <div className="container-mtart grid grid-cols-1 gap-12 py-12 md:grid-cols-3 md:py-16">
          <div className="md:col-span-2">
            {product.description ? (
              <ProductDetailBlock title={t('productDetail.description')} body={product.description} />
            ) : null}
            {product.craftsmanship ? (
              <ProductDetailBlock title={t('productDetail.craftsmanship')} body={product.craftsmanship} />
            ) : null}
            {product.installationAdvice ? (
              <ProductDetailBlock title={t('productDetail.installation')} body={product.installationAdvice} />
            ) : null}
            {product.maintenanceAdvice ? (
              <ProductDetailBlock title={t('productDetail.maintenance')} body={product.maintenanceAdvice} />
            ) : null}

            <ProductDetailBlock title={t('productDetail.naturalVariation')} body={t('productDetail.naturalVariationBody')} />
          </div>

          <div className="flex flex-col gap-10">
            {uniqueColors.length > 0 ? (
              <div>
                <h3 className="mb-4 font-display text-lg text-charcoal">{t('productDetail.availableColors')}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {uniqueColors.map((variant) => (
                    <div key={variant.colorId} className="flex flex-col items-center gap-1.5">
                      <span
                        className="h-9 w-9 border border-charcoal/15"
                        style={{ backgroundColor: variant.colorHexApproximation ?? '#d9cbae' }}
                        title={variant.colorName}
                      />
                      <span className="text-center text-[11px] text-charcoal-soft/70">{variant.colorName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {uniqueFormats.length > 0 ? (
              <div>
                <h3 className="mb-4 font-display text-lg text-charcoal">{t('productDetail.availableFormats')}</h3>
                <ul className="flex flex-col gap-2 text-sm text-charcoal-soft">
                  {uniqueFormats.map((variant) => (
                    <li key={variant.formatId} className="border-b border-charcoal/10 pb-2">
                      {variant.formatLabel}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h3 className="mb-4 font-display text-lg text-charcoal">{t('productDetail.technicalInformation')}</h3>
              <dl className="flex flex-col gap-2 text-sm">
                {product.material ? <Field label={t('aboutPage.heritage.heading')} value={product.material} stacked /> : null}
                {product.countryOfOrigin ? <Field label="Origin" value={product.countryOfOrigin} stacked /> : null}
                {product.productionLeadTime ? <Field label="Lead time" value={product.productionLeadTime} stacked /> : null}
              </dl>
            </div>
          </div>
        </div>

        {product.relatedProducts.length > 0 ? (
          <div className="container-mtart border-t border-charcoal/10 py-12 md:py-16">
            <h2 className="mb-8 font-display text-2xl text-charcoal">{t('productDetail.relatedProducts')}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {product.relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={
                    {
                      id: related.id,
                      slug: related.slug,
                      name: related.name,
                      reference: '',
                      shortDescription: null,
                      categoryId: '',
                      categorySlug: '',
                      categoryName: product.categoryName,
                      collectionId: null,
                      collectionSlug: null,
                      primaryImageId: related.primaryImageId,
                      hoverImageId: null,
                      primaryImageUrl: null,
                      hoverImageUrl: null,
                      isFeatured: false,
                      isNew: false,
                      isCustomizable: false,
                      isSimulatorReady: false,
                      isInStock: true,
                      status: 'Published',
                      catalogKind: 'Unknown',
                      pricePerM2: null,
                      currency: 'MAD',
                      priceVisibility: 'QuoteOnly',
                      patternSlug: null,
                      representativeColorNames: [],
                      representativeFormatLabels: [],
                    } satisfies ProductListItem
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Field({ label, value, stacked }: { label: string; value: string; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex justify-between border-b border-charcoal/10 pb-2">
        <dt className="text-charcoal-soft/70">{label}</dt>
        <dd className="font-medium text-charcoal">{value}</dd>
      </div>
    );
  }
  return (
    <div>
      <dt className="text-charcoal-soft/60">{label}</dt>
      <dd className="mt-0.5 font-medium text-charcoal">{value}</dd>
    </div>
  );
}

function ProductDetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-10">
      <h2 className="mb-3 font-display text-xl text-charcoal">{title}</h2>
      <p className="whitespace-pre-line text-base leading-relaxed text-charcoal-soft/85">{body}</p>
    </div>
  );
}

export default ProductDetailPage;
