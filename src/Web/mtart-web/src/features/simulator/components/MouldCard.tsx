import { clsx } from 'clsx';
import type { TilePatternListItem } from '@/types/catalog';
import { catalogImageUrl } from '@/utils/media';
import { ConfigurableTile } from './ConfigurableTile';

const EMPTY_REGION_COLORS: Record<string, string> = {};

export function MouldCard({
  mould,
  selected,
  onSelect,
}: {
  mould: TilePatternListItem;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      title={mould.reference}
      onClick={() => onSelect(mould.reference)}
      className={clsx(
        'border bg-white p-1 text-left transition',
        selected ? 'border-petrol ring-1 ring-petrol' : 'border-charcoal/15 hover:border-charcoal/50',
      )}
    >
      {mould.vectorAssetUrl ? (
        <ConfigurableTile
          src={mould.vectorAssetUrl}
          regionColors={EMPTY_REGION_COLORS}
          colors={[]}
          mode="outline"
          className="aspect-square w-full bg-white [&_svg]:h-full [&_svg]:w-full"
        />
      ) : mould.previewImageUrl ? (
        <img src={catalogImageUrl(mould.previewImageUrl, { cropped: true }) ?? undefined} alt="" className="aspect-square w-full bg-white object-contain" />
      ) : (
        <div className="aspect-square bg-white" />
      )}
      <p className="truncate px-0.5 pt-1 text-center text-[10px] uppercase tracking-wide text-charcoal-soft">
        {mould.reference}
      </p>
    </button>
  );
}
