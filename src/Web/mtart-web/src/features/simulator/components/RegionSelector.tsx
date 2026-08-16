import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { PatternRegion } from '@/types/catalog';
import { normalizeHex, DEFAULT_REGION_HEX } from '@/features/color/hex';

export function RegionSelector({
  regions,
  activeRegion,
  regionColors,
  onSelect,
}: {
  regions: PatternRegion[];
  activeRegion?: string;
  regionColors: Record<string, string>;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <h2 className="mb-1 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.chooseRegion')}</h2>
      {regions.map((region, index) => {
        const hex = normalizeHex(regionColors[region.regionKey]) ?? DEFAULT_REGION_HEX;
        return (
          <button
            key={region.regionKey}
            type="button"
            onClick={() => onSelect(region.regionKey)}
            className={clsx(
              'flex items-center justify-between gap-2 border px-2 py-1.5 text-xs transition duration-200',
              activeRegion === region.regionKey
                ? 'border-charcoal bg-charcoal text-ivory'
                : 'border-charcoal/10 hover:border-charcoal/40',
            )}
          >
            <span>
              {index + 1}. {t(`simulator.regions.${region.regionKey}`, { defaultValue: region.displayName })}
            </span>
            <span className="flex items-center gap-1.5 font-mono uppercase tracking-wide">
              <span className="block h-4 w-4 shrink-0 border border-charcoal/20" style={{ backgroundColor: hex }} />
              {hex}
            </span>
          </button>
        );
      })}
    </div>
  );
}
