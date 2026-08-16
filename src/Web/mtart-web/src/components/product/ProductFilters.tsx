import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories, useFinishes, useFormats } from '@/features/catalog/hooks';
import { useCollections } from '@/features/collections/hooks';
import { useColors } from '@/features/colors/hooks';
import { useLang } from '@/hooks/useLang';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatApiError } from '@/services/apiClient';

export interface ProductFilterValues {
  category?: string;
  collection?: string;
  color?: string;
  format?: string;
  finish?: string;
  inStock?: boolean;
  customizable?: boolean;
}

interface ProductFiltersProps {
  values: ProductFilterValues;
  onChange: (key: keyof ProductFilterValues, value: string | boolean | undefined) => void;
  onClear: () => void;
}

export function ProductFilters({ values, onChange, onClear }: ProductFiltersProps) {
  const { t } = useTranslation();
  const lang = useLang();
  const categories = useCategories(lang);
  const collections = useCollections(lang);
  const colors = useColors(lang);
  const formats = useFormats(lang);
  const finishes = useFinishes(lang);

  const hasActiveFilters = Object.values(values).some((v) => v !== undefined && v !== false);
  const taxonomyQueries = [categories, collections, colors, formats, finishes];
  const failedQuery = taxonomyQueries.find((query) => query.isError);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-charcoal">{t('products.filters.title')}</h2>
        {hasActiveFilters ? (
          <button type="button" onClick={onClear} className="text-xs font-medium uppercase tracking-wide text-charcoal-soft hover:underline">
            {t('products.filters.clear')}
          </button>
        ) : null}
      </div>

      {failedQuery ? (
        <ErrorState
          compact
          message={formatApiError(failedQuery.error, t('common.errorGeneric'))}
          onRetry={() => taxonomyQueries.forEach((query) => query.refetch())}
        />
      ) : null}

      <FilterGroup label={t('products.filters.category')}>
        {(failedQuery ? [] : (categories.data ?? [])).map((category) => (
          <FilterOption
            key={category.id}
            label={category.name}
            checked={values.category === category.slug}
            onChange={() => onChange('category', values.category === category.slug ? undefined : category.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('products.filters.collection')}>
        {(collections.data ?? []).map((collection) => (
          <FilterOption
            key={collection.id}
            label={collection.name}
            checked={values.collection === collection.slug}
            onChange={() => onChange('collection', values.collection === collection.slug ? undefined : collection.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('products.filters.color')}>
        {(colors.data ?? []).map((color) => (
          <FilterOption
            key={color.id}
            label={color.name}
            swatch={color.hexApproximation}
            checked={values.color === color.id}
            onChange={() => onChange('color', values.color === color.id ? undefined : color.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('products.filters.format')}>
        {(formats.data ?? []).map((format) => (
          <FilterOption
            key={format.id}
            label={format.name || `${format.widthCm}×${format.heightCm} cm`}
            checked={values.format === format.id}
            onChange={() => onChange('format', values.format === format.id ? undefined : format.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('products.filters.finish')}>
        {(finishes.data ?? []).map((finish) => (
          <FilterOption
            key={finish.id}
            label={finish.name}
            checked={values.finish === finish.id}
            onChange={() => onChange('finish', values.finish === finish.id ? undefined : finish.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t('products.filters.stock')}>
        <FilterOption
          label={t('products.filters.inStockOnly')}
          checked={Boolean(values.inStock)}
          onChange={() => onChange('inStock', values.inStock ? undefined : true)}
        />
        <FilterOption
          label={t('products.filters.customizable')}
          checked={Boolean(values.customizable)}
          onChange={() => onChange('customizable', values.customizable ? undefined : true)}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-charcoal/10 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-soft/70">{label}</h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FilterOption({
  label,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  swatch?: string | null;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-charcoal/30 text-charcoal focus:ring-charcoal"
      />
      {swatch ? (
        <span className="h-3.5 w-3.5 flex-shrink-0 border border-charcoal/15" style={{ backgroundColor: swatch }} aria-hidden="true" />
      ) : null}
      <span className={checked ? 'text-charcoal' : ''}>{label}</span>
    </label>
  );
}
