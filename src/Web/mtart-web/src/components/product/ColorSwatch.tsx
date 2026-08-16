import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Color } from '@/types/catalog';
import { catalogImageUrl } from '@/utils/media';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';
import { clsx } from 'clsx';

export function ColorSwatch({ color, size = 'md' }: { color: Color; size?: 'md' | 'lg' }) {
  const { t } = useTranslation();
  const lang = useLang();
  const image = catalogImageUrl(color.imageUrl ?? color.textureImageUrl);

  return (
    <Link to={ROUTES.color(lang, color.slug)} className="group flex flex-col gap-2">
      <div
        className={clsx('relative overflow-hidden', size === 'lg' ? 'aspect-square w-full' : 'aspect-square w-full')}
        style={{ backgroundColor: color.hexApproximation ?? '#d9cbae' }}
      >
        {image ? (
          <img
            src={image}
            alt={color.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(circle at 70% 75%, rgba(0,0,0,0.12), transparent 55%)',
            }}
            role="img"
            aria-label={color.name}
          />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-between bg-cinema/40 p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-[0.14em] text-cinema-fg">{t('common.view')}</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-charcoal-soft/70">{color.code}</p>
        <p className="text-sm font-medium text-charcoal">{color.name}</p>
        <p className="text-xs text-charcoal-soft/60">
          {t(`colors.families.${color.family}`)} · {t(`colors.materials.${color.materialType}`)}
        </p>
      </div>
    </Link>
  );
}
