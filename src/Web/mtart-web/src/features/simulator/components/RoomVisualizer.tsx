import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { Color } from '@/types/catalog';
import { VirtualFloor } from './VirtualFloor';
import { useSimulatorStore, type SimulatorScene } from '../store/useSimulatorStore';

const SCENES: SimulatorScene[] = ['floor', 'kitchen', 'bathroom', 'living', 'commercial'];

export function RoomVisualizer({
  vectorUrl,
  regionColors,
  colors,
}: {
  vectorUrl: string;
  regionColors: Record<string, string>;
  colors: Color[];
}) {
  const { t } = useTranslation();
  const scene = useSimulatorStore((state) => state.scene);
  const setScene = useSimulatorStore((state) => state.setScene);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h2 className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.room')}</h2>
      <div className="flex flex-wrap gap-1">
        {SCENES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setScene(item)}
            className={clsx(
              'px-2 py-1 text-[10px] uppercase tracking-wide',
              scene === item ? 'bg-charcoal text-ivory' : 'border border-charcoal/15',
            )}
          >
            {t(`simulator.scenes.${item}`)}
          </button>
        ))}
      </div>
      <div className="relative min-h-[220px] flex-1 overflow-hidden bg-[#d9cbb8]">
        <div
          className="absolute inset-x-[8%] bottom-[8%] top-[22%]"
          dir="ltr"
          style={{
            transform: scene === 'floor' ? 'perspective(700px) rotateX(58deg)' : 'perspective(800px) rotateX(12deg)',
            transformOrigin: 'center bottom',
          }}
        >
          <VirtualFloor vectorUrl={vectorUrl} regionColors={regionColors} colors={colors} />
        </div>
      </div>
    </div>
  );
}
