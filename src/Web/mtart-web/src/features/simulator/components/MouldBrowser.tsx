import Chip from '@mui/material/Chip';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PatternCategory, TilePatternListItem } from '@/types/catalog';
import { MouldSearch } from './MouldSearch';
import { MouldCard } from './MouldCard';
import { UploadDesignCard } from './DesignUploadDialog';

const PRIMARY = new Set(['geometric', 'moroccan', 'floral', 'classic', 'borders']);

export function MouldBrowser({
  categories,
  moulds,
  catalogueMoulds,
  selectedReference,
  search,
  categorySlug,
  onSearch,
  onCategory,
  onSelect,
  onUpload,
}: {
  categories: PatternCategory[];
  moulds: TilePatternListItem[];
  catalogueMoulds?: TilePatternListItem[];
  selectedReference?: string;
  search: string;
  categorySlug?: string;
  onSearch: (value: string) => void;
  onCategory: (slug?: string) => void;
  onSelect: (key: string) => void;
  onUpload?: () => void;
}) {
  const { t } = useTranslation();
  const [more, setMore] = useState(false);
  const used = new Set((catalogueMoulds ?? moulds).map((mould) => mould.categorySlug));
  const visibleCategories = categories.filter((category) => used.has(category.slug));
  const primary = visibleCategories.filter((category) => PRIMARY.has(category.slug));
  const extra = visibleCategories.filter((category) => !PRIMARY.has(category.slug));
  const shown = more ? [...primary, ...extra] : primary.length > 0 ? primary : visibleCategories;

  return (
    <div className="@container flex h-full min-h-0 flex-col">
      <p className="mb-2 text-sm text-charcoal">{t('simulator.chooseDesign')}</p>
      <MouldSearch value={search} onChange={onSearch} />
      <div className="my-2 flex flex-wrap gap-1">
        <Chip
          size="small"
          label={t('simulator.all')}
          onClick={() => onCategory(undefined)}
          color={!categorySlug ? 'primary' : 'default'}
          variant={!categorySlug ? 'filled' : 'outlined'}
        />
        {shown.map((category) => (
          <Chip
            key={category.id}
            size="small"
            label={category.name}
            onClick={() => onCategory(category.slug)}
            color={categorySlug === category.slug ? 'primary' : 'default'}
            variant={categorySlug === category.slug ? 'filled' : 'outlined'}
          />
        ))}
        {extra.length > 0 ? (
          <Chip size="small" label={t('simulator.moreCategories')} onClick={() => setMore((value) => !value)} variant="outlined" />
        ) : null}
      </div>
      <div className="mould-library-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 max-h-[min(38rem,calc(100dvh-16rem))] md:max-h-[calc((100cqw-0.75rem)/3*2+3.75rem)] xl:max-h-[calc((100cqw-1rem)/5*2+3.75rem)]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {onUpload ? <UploadDesignCard onClick={onUpload} /> : null}
          {moulds.map((mould) => (
            <MouldCard
              key={mould.id}
              mould={mould}
              selected={selectedReference === mould.reference || selectedReference === mould.slug}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
