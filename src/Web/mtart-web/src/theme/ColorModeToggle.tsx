import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/theme/ColorModeProvider';

export function ColorModeToggle({ light }: { light?: boolean }) {
  const { t } = useTranslation();
  const { mode, toggleMode } = useColorMode();
  const label = mode === 'dark' ? t('theme.light') : t('theme.dark');

  return (
    <Tooltip title={t('theme.toggle')}>
      <IconButton
        onClick={toggleMode}
        aria-label={t('theme.toggle')}
        size="medium"
        sx={light ? { color: '#FFFFFF' } : undefined}
      >
        {mode === 'dark' ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
        <span className="sr-only">{label}</span>
      </IconButton>
    </Tooltip>
  );
}
