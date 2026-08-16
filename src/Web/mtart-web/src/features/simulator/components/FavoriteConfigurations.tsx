import { useTranslation } from 'react-i18next';
import type { Color } from '@/types/catalog';
import type { SimulatorFavorite } from '../store/useSimulatorStore';
import { ConfigurableTile } from './ConfigurableTile';

export function FavoriteConfigurations({
  favorites,
  colors,
  vectorBySlug,
  onRestore,
  onClear,
}: {
  favorites: SimulatorFavorite[];
  colors: Color[];
  vectorBySlug: Record<string, string>;
  onRestore: (favorite: SimulatorFavorite) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.favorites')}</p>
        <button type="button" className="text-[10px] uppercase tracking-wide text-charcoal-soft" onClick={onClear}>
          {t('simulator.clearFavorites')}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {favorites.map((favorite) => {
          const src = vectorBySlug[favorite.mouldSlug] ?? vectorBySlug[favorite.mouldReference];
          return (
            <button
              key={favorite.timestamp}
              type="button"
              onClick={() => onRestore(favorite)}
              className="w-16 shrink-0 border border-charcoal/10 p-1"
            >
              {src ? (
                <ConfigurableTile src={src} regionColors={favorite.colors} colors={colors} rotation={favorite.rotation} className="aspect-square [&_svg]:h-full [&_svg]:w-full" />
              ) : (
                <div className="aspect-square bg-ivory-dark" />
              )}
              <p className="truncate text-[9px] uppercase">{favorite.mouldReference}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
