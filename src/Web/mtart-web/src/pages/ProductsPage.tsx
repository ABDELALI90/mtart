import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useProducts } from '@/features/products/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductFilters, type ProductFilterValues } from '@/components/product/ProductFilters';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import type { ProductSortOrder } from '@/types/catalog';

const SORT_OPTIONS: { value: ProductSortOrder; labelKey: string }[] = [
  { value: 'Featured', labelKey: 'products.filters.sortFeatured' },
  { value: 'Newest', labelKey: 'products.filters.sortNewest' },
  { value: 'ReferenceAsc', labelKey: 'products.filters.sortReference' },
];

export function ProductsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isCementPatterns = location.pathname.includes('/cement-tiles/patterns');

  const filters: ProductFilterValues = {
    category: searchParams.get('category') ?? (isCementPatterns ? 'cement-tiles' : undefined),
    collection: searchParams.get('collection') ?? undefined,
    color: searchParams.get('color') ?? undefined,
    format: searchParams.get('format') ?? undefined,
    finish: searchParams.get('finish') ?? undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
    customizable: searchParams.get('customizable') === 'true' || undefined,
  };
  const q = searchParams.get('q') ?? (isCementPatterns ? 'patterned' : undefined);
  const sort = (searchParams.get('sort') as ProductSortOrder) || 'Featured';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const { data, isLoading, isError, error, refetch } = useProducts({
    lang,
    ...filters,
    q,
    sort,
    page,
    pageSize: 24,
  });

  function updateFilter(key: keyof ProductFilterValues, value: string | boolean | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === false) next.delete(key);
    else next.set(key, String(value));
    next.delete('page');
    setSearchParams(next);
  }

  function updateSort(value: ProductSortOrder) {
    const next = new URLSearchParams(searchParams);
    next.set('sort', value);
    next.delete('page');
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    setSearchParams(next);
  }

  return (
    <>
      <PageMeta title={t('products.title')} lang={lang} path="/products" />

      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('products.title')}</h1>
          {data ? (
            <p className="mt-2 text-sm text-charcoal-soft/70">{t('products.resultsCount', { count: data.totalCount })}</p>
          ) : null}
        </div>
      </div>

      <div className="container-mtart py-10 md:py-14">
        <div className="flex items-center justify-between gap-4 md:hidden">
          <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setMobileFiltersOpen(true)}>
            {t('products.filters.title')}
          </Button>
          <SortSelect value={sort} onChange={updateSort} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 md:mt-0 md:grid-cols-[260px_1fr] md:gap-12">
          <aside className="hidden md:block">
            <ProductFilters values={filters} onChange={updateFilter} onClear={clearAll} />
          </aside>

          <div>
            <div className="mb-6 hidden justify-end md:flex">
              <SortSelect value={sort} onChange={updateSort} />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <ErrorState message={formatApiError(error, t('products.unavailable'))} onRetry={() => refetch()} />
            ) : !data || data.items.length === 0 ? (
              <EmptyState
                message={t('products.noResults')}
                action={
                  <button type="button" onClick={clearAll} className="text-sm font-medium text-charcoal hover:underline">
                    {t('products.clearFilters')}
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
                  {data.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {data.totalPages > 1 ? (
                  <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
                    {Array.from({ length: data.totalPages }).map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => goToPage(pageNumber)}
                          aria-current={pageNumber === page ? 'page' : undefined}
                          className={
                            pageNumber === page
                              ? 'h-9 w-9 border border-charcoal bg-charcoal text-sm text-ivory'
                              : 'h-9 w-9 border border-charcoal/20 text-sm text-charcoal hover:border-charcoal'
                          }
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <Drawer
        anchor="right"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        sx={{ display: { md: 'none' } }}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 360 }, maxWidth: '100vw', p: 3 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: 'ui-serif, Georgia, serif' }}>
            {t('products.filters.title')}
          </Typography>
          <IconButton onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        </Box>
        <ProductFilters values={filters} onChange={updateFilter} onClear={clearAll} />
        <Button fullWidth variant="contained" onClick={() => setMobileFiltersOpen(false)} sx={{ mt: 4 }}>
          {t('products.filters.apply')}
        </Button>
      </Drawer>
    </>
  );
}

function SortSelect({ value, onChange }: { value: ProductSortOrder; onChange: (value: ProductSortOrder) => void }) {
  const { t } = useTranslation();
  return (
    <TextField
      select
      size="small"
      label={t('products.filters.sortBy')}
      value={value}
      onChange={(event) => onChange(event.target.value as ProductSortOrder)}
      sx={{ minWidth: 160 }}
    >
      {SORT_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {t(option.labelKey)}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default ProductsPage;
