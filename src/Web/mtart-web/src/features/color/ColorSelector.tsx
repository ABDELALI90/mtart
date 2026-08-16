import type { Color } from '@/types/catalog';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { ProductPaletteSelector } from './ProductPaletteSelector';

export type ColorMode = 'product-palette' | 'custom-rgb';

export function ColorSelector({
  mode,
  value,
  onHexChange,
  colors,
  selectedCode,
  onProductSelect,
  sourceImageUrl,
}: {
  mode: ColorMode;
  value?: string;
  onHexChange: (hex: string) => void;
  colors?: Color[];
  selectedCode?: string;
  onProductSelect?: (code: string) => void;
  sourceImageUrl?: string;
}) {
  if (mode === 'product-palette') {
    return (
      <ProductPaletteSelector
        colors={colors ?? []}
        selectedCode={selectedCode}
        onSelect={(code) => onProductSelect?.(code)}
      />
    );
  }
  return <AdvancedColorPicker value={value} onChange={(next) => onHexChange(next.hex)} sourceImageUrl={sourceImageUrl} />;
}
