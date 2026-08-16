import { useTranslation } from 'react-i18next';
import type { PatternRegion } from '@/types/catalog';
import { normalizeHex, DEFAULT_REGION_HEX } from '@/features/color/hex';

export function SelectedColorsPanel({
  regions,
  regionColors,
}: {
  regions: PatternRegion[];
  regionColors: Record<string, string>;
}) {
  const { t } = useTranslation();

  if (regions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border border-charcoal/10 p-2">
      <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.yourTile')}</h2>
      <ul className="flex flex-col gap-1">
        {regions.map((region) => {
          const hex = normalizeHex(regionColors[region.regionKey]) ?? DEFAULT_REGION_HEX;
          return (
            <li key={region.regionKey} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-charcoal-soft">
                {t(`simulator.regions.${region.regionKey}`, { defaultValue: region.displayName })}
              </span>
              <span className="flex items-center gap-1.5 font-mono font-medium uppercase tracking-wide">
                <span className="block h-4 w-4 shrink-0 border border-charcoal/15" style={{ backgroundColor: hex }} />
                {hex}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
