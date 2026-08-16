import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useTranslation } from 'react-i18next';

export function SurfaceCalculator({
  surfaceM2,
  wastePercent,
  requiredM2,
  tiles,
  weightKg,
  total,
  currency,
  onSurface,
  onWaste,
}: {
  surfaceM2: number;
  wastePercent: 5 | 10 | 15;
  requiredM2: number;
  tiles: number;
  weightKg: number;
  total: number;
  currency: string;
  onSurface: (value: number) => void;
  onWaste: (value: 5 | 10 | 15) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid items-end gap-4 md:grid-cols-3">
      <TextField type="number" label={t('simulator.surface')} value={surfaceM2} onChange={(event) => onSurface(Number(event.target.value) || 0)} size="small" />
      <TextField select label={t('simulator.waste')} value={wastePercent} onChange={(event) => onWaste(Number(event.target.value) as 5 | 10 | 15)} size="small">
        <MenuItem value={5}>5%</MenuItem>
        <MenuItem value={10}>10%</MenuItem>
        <MenuItem value={15}>15%</MenuItem>
      </TextField>
      <p className="text-sm text-charcoal-soft">
        {requiredM2.toFixed(1)} m² · {tiles} {t('simulator.tiles')} · {weightKg} kg
        {total > 0 ? ` · ${total.toLocaleString()} ${currency}` : ''}
        <span className="mt-1 block text-xs">{t('simulator.estimate')}</span>
      </p>
    </div>
  );
}
