import { CementColorPalette } from '@/features/simulator/components/CementColorPalette';
import type { Color } from '@/types/catalog';

export function ProductPaletteSelector({
  colors,
  selectedCode,
  onSelect,
}: {
  colors: Color[];
  selectedCode?: string;
  onSelect: (code: string) => void;
}) {
  return <CementColorPalette colors={colors} selectedCode={selectedCode} onSelect={onSelect} />;
}
