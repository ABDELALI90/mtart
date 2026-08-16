import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { Color } from '@/types/catalog';
import { ConfigurableTile } from './ConfigurableTile';
import { useSimulatorStore } from '../store/useSimulatorStore';

export function VirtualFloor({
  vectorUrl,
  regionColors,
  colors,
}: {
  vectorUrl: string;
  regionColors: Record<string, string>;
  colors: Color[];
}) {
  const { t } = useTranslation();
  const floorCells = useSimulatorStore((state) => state.floorCells);
  const selectedCell = useSimulatorStore((state) => state.selectedCell);
  const toggleCell = useSimulatorStore((state) => state.toggleCell);
  const rotateCell = useSimulatorStore((state) => state.rotateCell);
  const fillFloor = useSimulatorStore((state) => state.fillFloor);
  const clearFloor = useSimulatorStore((state) => state.clearFloor);
  const deleteSelected = useSimulatorStore((state) => state.deleteSelected);
  const suggestLayout = useSimulatorStore((state) => state.suggestLayout);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid flex-1 grid-cols-6 grid-rows-6 border border-charcoal/20 bg-ivory" dir="ltr">
        {floorCells.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => toggleCell(index)}
            onContextMenu={(event) => {
              event.preventDefault();
              rotateCell(index);
            }}
            className={clsx('overflow-hidden border border-charcoal/5', selectedCell === index && 'ring-2 ring-petrol')}
          >
            {cell.filled ? (
              <ConfigurableTile
                src={vectorUrl}
                regionColors={regionColors}
                colors={colors}
                rotation={cell.rotation}
                className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
              />
            ) : (
              <span className="block h-full w-full bg-[#eee6d6]" />
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
        <button type="button" onClick={fillFloor} className="border border-charcoal/20 px-2 py-1">{t('simulator.fillAll')}</button>
        <button type="button" onClick={deleteSelected} className="border border-charcoal/20 px-2 py-1">{t('simulator.deleteOne')}</button>
        <button type="button" onClick={clearFloor} className="border border-charcoal/20 px-2 py-1">{t('simulator.clearAll')}</button>
        <button type="button" onClick={suggestLayout} className="border border-charcoal/20 px-2 py-1">{t('simulator.suggestLayout')}</button>
      </div>
    </div>
  );
}
