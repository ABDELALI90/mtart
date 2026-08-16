import { clsx } from 'clsx';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import type { Color } from '@/types/catalog';
import { catalogImageUrl } from '@/utils/media';

export function CementColorPalette({
  colors,
  selectedCode,
  onSelect,
}: {
  colors: Color[];
  selectedCode?: string;
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.chooseColor')}</h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
        {colors.map((color) => {
          const image = catalogImageUrl(color.imageUrl ?? color.textureImageUrl);
          const selected = selectedCode === color.code;
          return (
            <Tooltip key={color.id} title={`${color.code} ${color.name}`} arrow>
              <button
                type="button"
                onClick={() => onSelect(color.code)}
                className={clsx(
                  'flex flex-col items-center gap-1 border p-1 transition duration-200',
                  selected ? 'scale-110 border-charcoal shadow-sm' : 'border-transparent hover:border-charcoal/20',
                )}
              >
                <span className="block aspect-square w-full overflow-hidden" style={{ backgroundColor: color.hexApproximation ?? '#ccc' }}>
                  {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-charcoal-soft">{color.code}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
      </div>
    </div>
  );
}
