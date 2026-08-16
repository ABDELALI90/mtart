import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { useQuoteProduct } from '@/features/products/hooks';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { catalogImageUrl } from '@/utils/media';
import { ROUTES } from '@/utils/paths';
import type { PriceVisibility } from '@/types/catalog';
import type { QuoteFormValues } from '@/features/quote/schema';

export function RequestQuotePage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [searchParams] = useSearchParams();

  const slug = searchParams.get('slug') ?? undefined;
  const productId = searchParams.get('productId') ?? undefined;
  const reference = searchParams.get('reference') ?? undefined;
  const quantityM2 = searchParams.get('quantityM2') ?? undefined;
  const isSimulatorQuote = Boolean(
    searchParams.get('mould') || searchParams.get('shareUrl') || searchParams.get('custom') === '1',
  );
  const expectsCatalogProduct = Boolean(slug || productId || (reference && !isSimulatorQuote));

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuoteProduct({ slug, reference, productId, lang }, expectsCatalogProduct);

  const simulatorPreview =
    isSimulatorQuote && typeof window !== 'undefined' ? sessionStorage.getItem('mtart.quotePreview') : null;

  if (expectsCatalogProduct && isLoading) {
    return (
      <>
        <PageMeta title={t('quote.title')} description={t('quote.subtitle')} lang={lang} path="/request-quote" />
        <QuotePageHeader title={t('quote.title')} subtitle={t('quote.subtitle')} />
        <div className="container-mtart max-w-3xl py-14 md:py-20">
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-[160px_1fr]">
            <Skeleton className="aspect-square w-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (expectsCatalogProduct && (isError || !product)) {
    return (
      <>
        <PageMeta title={t('quote.title')} description={t('quote.subtitle')} lang={lang} path="/request-quote" />
        <QuotePageHeader title={t('quote.title')} subtitle={t('quote.subtitle')} />
        <div className="container-mtart max-w-3xl py-14 md:py-20">
          <ErrorState message={t('quote.selectedProduct.loadError')} onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const productUrl = product ? `${origin}${ROUTES.product(lang, product.slug)}` : undefined;
  const priceLabel =
    product?.pricePerM2 != null ? `${product.pricePerM2} ${product.currency} / m²` : undefined;

  const defaultValues: Partial<QuoteFormValues> = {
    quantityM2,
    language: lang,
    productName: product?.name,
    reference: product?.reference ?? reference,
    productId: product?.id ?? productId,
    slug: product?.slug ?? slug,
    productUrl,
    price: priceLabel,
    category: product?.categoryName,
    mould: searchParams.get('mould') ?? undefined,
    shareUrl: searchParams.get('shareUrl') ?? undefined,
  };

  return (
    <>
      <PageMeta title={t('quote.title')} description={t('quote.subtitle')} lang={lang} path="/request-quote" />
      <QuotePageHeader title={t('quote.title')} subtitle={t('quote.subtitle')} />

      <div className="container-mtart max-w-3xl py-14 md:py-20">
        {product ? (
          <SelectedCatalogProduct
            name={product.name}
            reference={product.reference}
            category={product.categoryName}
            imageUrl={catalogImageUrl(product.images[0]?.imageUrl)}
            pricePerM2={product.pricePerM2}
            currency={product.currency}
            visibility={product.priceVisibility}
          />
        ) : simulatorPreview ? (
          <img src={simulatorPreview} alt="" className="mb-8 max-w-xs border border-charcoal/10 bg-white" />
        ) : null}

        <QuoteForm defaultValues={defaultValues} />
      </div>
    </>
  );
}

function QuotePageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
      <div className="container-mtart max-w-2xl">
        <h1 className="font-display text-3xl text-charcoal md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-charcoal-soft/75 md:text-base">{subtitle}</p>
      </div>
    </div>
  );
}

function SelectedCatalogProduct({
  name,
  reference,
  category,
  imageUrl,
  pricePerM2,
  currency,
  visibility,
}: {
  name: string;
  reference: string;
  category: string;
  imageUrl: string | null;
  pricePerM2: number | null;
  currency: string;
  visibility: PriceVisibility;
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-10 grid grid-cols-1 gap-6 border border-charcoal/10 bg-ivory p-4 sm:grid-cols-[160px_1fr] sm:p-5">
      <ResponsiveImage src={imageUrl} alt={name} aspectRatio="1/1" loading="eager" placeholderLabel={name} />
      <div>
        <p className="text-xs uppercase tracking-wide text-charcoal-soft/70">
          {t('quote.fields.reference')}: {reference}
        </p>
        <h2 className="mt-2 font-display text-2xl text-charcoal">{name}</h2>
        <p className="mt-1 text-sm text-charcoal-soft/80">{category}</p>
        <div className="mt-3">
          <PriceDisplay amount={pricePerM2} currency={currency} visibility={visibility} size="lg" />
        </div>
      </div>
    </div>
  );
}

export default RequestQuotePage;
