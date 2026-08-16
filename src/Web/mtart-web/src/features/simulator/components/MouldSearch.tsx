import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

export function MouldSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t('simulator.searchReference')}
      slotProps={{ htmlInput: { 'aria-label': t('simulator.searchReference') } }}
    />
  );
}
