import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Chip from '@mui/material/Chip';
import type { Color } from '@/types/catalog';
import { catalogImageUrl } from '@/utils/media';
import { clsx } from 'clsx';

const LAYOUTS = ['straight', 'brick', 'herringbone', 'vertical', 'diagonal', 'basketweave'] as const;
type Layout = (typeof LAYOUTS)[number];

export function BjmatLayoutVisualizer({ colors }: { colors: Color[] }) {
  const { t } = useTranslation();
  const [layout, setLayout] = useState<Layout>('straight');
  const [selected, setSelected] = useState<string | undefined>(colors[0]?.id);
  const color = colors.find((item) => item.id === selected) ?? colors[0];
  const image = catalogImageUrl(color?.imageUrl);

  const tiles = useMemo(() => Array.from({ length: 48 }), []);

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('bjmat.layouts.chooseColor')}</p>
        <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pe-1">
          {colors.slice(0, 36).map((item) => {
            const src = catalogImageUrl(item.imageUrl);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={clsx('aspect-square overflow-hidden border', selected === item.id ? 'border-petrol ring-1 ring-petrol' : 'border-charcoal/10')}
                title={item.code}
              >
                {src ? <img src={src} alt={item.name} className="h-full w-full object-cover" /> : <span className="block h-full w-full" style={{ background: item.hexApproximation ?? '#ccc' }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {LAYOUTS.map((item) => (
            <Chip
              key={item}
              label={t(`bjmat.layouts.${item}`)}
              onClick={() => setLayout(item)}
              color={layout === item ? 'primary' : 'default'}
              variant={layout === item ? 'filled' : 'outlined'}
            />
          ))}
        </div>
        <div
          dir="ltr"
          className={clsx(
            'grid aspect-[16/10] overflow-hidden border border-charcoal/10 bg-ivory-dark',
            layout === 'vertical' ? 'grid-cols-12' : 'grid-cols-8',
          )}
        >
          {tiles.map((_, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const brickOffset = layout === 'brick' && row % 2 === 1;
            const herring = layout === 'herringbone' && col % 2 === 1;
            const diagonal = layout === 'diagonal';
            const basket = layout === 'basketweave' && (Math.floor(col / 2) + Math.floor(row / 2)) % 2 === 1;
            const rotation =
              layout === 'vertical' ? 90
                : herring ? (row % 2 === 0 ? 45 : -45)
                : diagonal ? 45
                : basket ? 90
                : 0;
            return (
              <div
                key={index}
                className="overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg) ${brickOffset ? 'translateX(50%)' : ''}`,
                }}
              >
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full" style={{ background: color?.hexApproximation ?? '#c4a574' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
