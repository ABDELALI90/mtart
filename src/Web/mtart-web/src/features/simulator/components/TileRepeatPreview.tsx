import { ConfigurableTile, type RegionClickInfo } from './ConfigurableTile';
import type { Color } from '@/types/catalog';

export function TileRepeatPreview({
  vectorUrl,
  regionColors,
  colors,
  rotation,
  repeat,
  activeRegion,
  onRegionClick,
}: {
  vectorUrl: string;
  regionColors: Record<string, string>;
  colors: Color[];
  rotation: number;
  repeat: number;
  activeRegion?: string;
  onRegionClick?: (key: string, info?: RegionClickInfo) => void;
}) {
  const cells = Array.from({ length: repeat * repeat });

  return (
    <div className="overflow-hidden border border-charcoal/10 bg-white" dir="ltr">
      <div className="grid aspect-square w-full" style={{ gridTemplateColumns: `repeat(${repeat}, minmax(0, 1fr))` }}>
        {cells.map((_, index) => (
          <ConfigurableTile
            key={`${repeat}-${index}`}
            src={vectorUrl}
            regionColors={regionColors}
            colors={colors}
            rotation={rotation}
            activeRegion={repeat === 1 ? activeRegion : undefined}
            onRegionClick={onRegionClick}
            className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
          />
        ))}
      </div>
    </div>
  );
}
