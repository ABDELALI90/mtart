import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RotateRight from '@mui/icons-material/RotateRight';
import RestartAlt from '@mui/icons-material/RestartAlt';
import StarBorder from '@mui/icons-material/StarBorder';
import Download from '@mui/icons-material/Download';
import Fullscreen from '@mui/icons-material/Fullscreen';
import { useTranslation } from 'react-i18next';
import type { RepeatCount } from '../store/useSimulatorStore';

const REPEATS: RepeatCount[] = [1, 2, 3, 4];

export function SimulatorToolbar({
  repeat,
  onRepeat,
  onRotate,
  onReset,
  onFavorite,
  onDownload,
  onFullscreen,
}: {
  repeat: RepeatCount;
  onRepeat: (value: RepeatCount) => void;
  onRotate: () => void;
  onReset: () => void;
  onFavorite: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1">
      {REPEATS.map((value) => (
        <Chip
          key={value}
          label={`${value}×${value}`}
          size="small"
          onClick={() => onRepeat(value)}
          color={repeat === value ? 'primary' : 'default'}
          variant={repeat === value ? 'filled' : 'outlined'}
        />
      ))}
      <Tooltip title={t('simulator.rotate')}><IconButton size="small" onClick={onRotate}><RotateRight fontSize="small" /></IconButton></Tooltip>
      <Tooltip title={t('simulator.reset')}><IconButton size="small" onClick={onReset}><RestartAlt fontSize="small" /></IconButton></Tooltip>
      <Tooltip title={t('simulator.favorite')}><IconButton size="small" onClick={onFavorite}><StarBorder fontSize="small" /></IconButton></Tooltip>
      <Tooltip title={t('simulator.download')}><IconButton size="small" onClick={onDownload}><Download fontSize="small" /></IconButton></Tooltip>
      <Tooltip title={t('simulator.fullscreen')}><IconButton size="small" onClick={onFullscreen}><Fullscreen fontSize="small" /></IconButton></Tooltip>
    </div>
  );
}
