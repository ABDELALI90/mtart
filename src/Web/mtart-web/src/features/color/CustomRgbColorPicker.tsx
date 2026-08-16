import { AdvancedColorPicker } from './AdvancedColorPicker';

export { AdvancedColorPicker } from './AdvancedColorPicker';
export type { AdvancedColorValue } from './AdvancedColorPicker';

/** @deprecated Use AdvancedColorPicker. Kept so existing imports keep working. */
export function CustomRgbColorPicker({
  value,
  onChange,
  sourceImageUrl,
}: {
  value?: string;
  onChange: (hex: string) => void;
  sourceImageUrl?: string;
}) {
  return <AdvancedColorPicker value={value} onChange={(next) => onChange(next.hex)} sourceImageUrl={sourceImageUrl} />;
}

export { CustomRgbColorPicker as CustomColorPicker };
