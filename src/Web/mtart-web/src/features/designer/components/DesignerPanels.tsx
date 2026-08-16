import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { BASIC_SHAPES, MOROCCAN_MOTIFS, REPEAT_MODES, type SymmetryMode } from '../types';
import { useDesignerStore } from '../store/useDesignerStore';
import { cellCss, cellTransform } from '../geometry/layout';
import { exportDesignSvg, svgDataUri } from '../geometry/svg';
import { validateDesign } from '../geometry/validate';
import type { ManufacturingSettings } from '../types';

const SYMMETRY: SymmetryMode[] = ['none', '2', '4', '6', '8', 'radial'];
const ANGLES: Array<0 | 15 | 30 | 45 | 60 | 90> = [0, 15, 30, 45, 60, 90];

export function ToolPalette() {
  const { t } = useTranslation();
  const tool = useDesignerStore((state) => state.tool);
  const setTool = useDesignerStore((state) => state.setTool);
  const symmetry = useDesignerStore((state) => state.document.symmetry);
  const setSymmetry = useDesignerStore((state) => state.setSymmetry);
  const grid = useDesignerStore((state) => state.document.grid);
  const setGrid = useDesignerStore((state) => state.setGrid);

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.shapes')}</h2>
        <div className="grid grid-cols-2 gap-1">
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} label={t('designer.select')} />
          {BASIC_SHAPES.map((shape) => (
            <ToolButton key={shape} active={tool === shape} onClick={() => setTool(shape)} label={t(`designer.shape.${shape}`)} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.moroccan')}</h2>
        <div className="grid grid-cols-1 gap-1">
          {MOROCCAN_MOTIFS.map((shape) => (
            <ToolButton key={shape} active={tool === shape} onClick={() => setTool(shape)} label={t(`designer.shape.${shape}`)} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.symmetry')}</h2>
        <div className="flex flex-wrap gap-1">
          {SYMMETRY.map((mode) => (
            <Chip
              key={mode}
              size="small"
              label={t(`designer.symmetryMode.${mode}`)}
              onClick={() => setSymmetry(mode)}
              color={symmetry === mode ? 'primary' : 'default'}
              variant={symmetry === mode ? 'filled' : 'outlined'}
            />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.grid')}</h2>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={grid.visible} onChange={(event) => setGrid({ visible: event.target.checked })} />
          {t('designer.gridOn')}
        </label>
        <label className="mt-1 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={grid.snap} onChange={(event) => setGrid({ snap: event.target.checked })} />
          {t('designer.snapOn')}
        </label>
        <label className="mt-2 block text-xs">
          {t('designer.gridSize')}
          <input
            type="range"
            min={5}
            max={25}
            step={5}
            value={grid.size}
            onChange={(event) => setGrid({ size: Number(event.target.value) })}
            className="w-full"
          />
        </label>
        <div className="mt-2 flex flex-col gap-1 text-xs">
          <label><input type="checkbox" checked={grid.centerGuides} onChange={(e) => setGrid({ centerGuides: e.target.checked })} /> {t('designer.centerGuides')}</label>
          <label><input type="checkbox" checked={grid.diagonalGuides} onChange={(e) => setGrid({ diagonalGuides: e.target.checked })} /> {t('designer.diagonalGuides')}</label>
          <label><input type="checkbox" checked={grid.horizontalGuide} onChange={(e) => setGrid({ horizontalGuide: e.target.checked })} /> {t('designer.horizontalGuide')}</label>
          <label><input type="checkbox" checked={grid.verticalGuide} onChange={(e) => setGrid({ verticalGuide: e.target.checked })} /> {t('designer.verticalGuide')}</label>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-charcoal-soft">{t('designer.angleSnap')}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {ANGLES.map((angle) => (
            <Chip
              key={angle}
              size="small"
              label={angle === 0 ? t('designer.off') : `${angle}°`}
              onClick={() => setGrid({ angleSnap: angle })}
              color={grid.angleSnap === angle ? 'primary' : 'default'}
              variant={grid.angleSnap === angle ? 'filled' : 'outlined'}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'border px-2 py-1.5 text-left text-[11px] uppercase tracking-wide',
        active ? 'border-petrol bg-petrol text-ivory' : 'border-charcoal/10 hover:border-charcoal/40',
      )}
    >
      {label}
    </button>
  );
}

export function LayersPanel() {
  const { t } = useTranslation();
  const document = useDesignerStore((state) => state.document);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const select = useDesignerStore((state) => state.select);
  const toggleVisible = useDesignerStore((state) => state.toggleVisible);
  const toggleLocked = useDesignerStore((state) => state.toggleLocked);
  const renameElement = useDesignerStore((state) => state.renameElement);
  const deleteSelected = useDesignerStore((state) => state.deleteSelected);
  const reorder = useDesignerStore((state) => state.reorder);

  const layers = [...document.elements].reverse();

  return (
    <div>
      <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.layers')}</h2>
      <div className="max-h-48 overflow-y-auto border border-charcoal/10">
        {layers.length === 0 ? <p className="p-2 text-xs text-charcoal-soft/70">{t('designer.emptyTile')}</p> : null}
        {layers.map((element, visualIndex) => {
          const index = document.elements.length - 1 - visualIndex;
          return (
            <div
              key={element.id}
              className={clsx('flex items-center gap-1 border-b border-charcoal/5 px-1 py-1 text-xs', selectedIds.includes(element.id) && 'bg-petrol/10')}
            >
              <button type="button" className="cursor-grab px-1 text-charcoal-soft" onClick={() => reorder(index, Math.max(0, index - 1))}>☰</button>
              <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => select([element.id], element.regionId)}>
                {element.name}
              </button>
              <Tooltip title={t('designer.rename')}>
                <button
                  type="button"
                  className="text-[10px] uppercase text-charcoal-soft"
                  onClick={() => {
                    const name = window.prompt(t('designer.rename'), element.name);
                    if (name) {
                      renameElement(element.id, name);
                    }
                  }}
                >
                  ✎
                </button>
              </Tooltip>
              <IconButton size="small" onClick={() => toggleVisible(element.id)}>
                {element.visible ? <Visibility fontSize="inherit" /> : <VisibilityOff fontSize="inherit" />}
              </IconButton>
              <IconButton size="small" onClick={() => toggleLocked(element.id)}>
                {element.locked ? <Lock fontSize="inherit" /> : <LockOpen fontSize="inherit" />}
              </IconButton>
              <IconButton size="small" onClick={() => { select([element.id]); deleteSelected(); }}>
                <DeleteOutlined fontSize="inherit" />
              </IconButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LiveRepeatPreview({ hexByCode }: { hexByCode: Record<string, string> }) {
  const { t } = useTranslation();
  const document = useDesignerStore((state) => state.document);
  const setRepeatMode = useDesignerStore((state) => state.setRepeatMode);
  const setTessellation = useDesignerStore((state) => state.setTessellation);
  const markup = exportDesignSvg(document, hexByCode);
  const uri = svgDataUri(markup);
  const size = document.tessellation;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.layout')}</h2>
        <div className="flex flex-wrap gap-1">
          {REPEAT_MODES.map((mode) => (
            <Chip
              key={mode}
              size="small"
              label={t(`designer.repeat.${mode}`)}
              onClick={() => setRepeatMode(mode)}
              color={document.repeatMode === mode ? 'primary' : 'default'}
              variant={document.repeatMode === mode ? 'filled' : 'outlined'}
            />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.repeatPreview')}</h2>
        <div className="grid grid-cols-4 gap-px overflow-hidden border border-charcoal/10" dir="ltr">
          {Array.from({ length: 16 }).map((_, index) => {
            const column = index % 4;
            const row = Math.floor(index / 4);
            return (
              <div key={index} className="aspect-square overflow-hidden bg-ivory">
                <img alt="" src={uri} className="h-full w-full" style={{ transform: cellCss(cellTransform(document.repeatMode, column, row)) }} />
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.seamless')}</h2>
          <div className="flex gap-1">
            <Chip size="small" label="4×4" onClick={() => setTessellation(4)} color={size === 4 ? 'primary' : 'default'} variant={size === 4 ? 'filled' : 'outlined'} />
            <Chip size="small" label="8×8" onClick={() => setTessellation(8)} color={size === 8 ? 'primary' : 'default'} variant={size === 8 ? 'filled' : 'outlined'} />
          </div>
        </div>
        <div
          className="overflow-hidden border border-charcoal/10"
          dir="ltr"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size * size }).map((_, index) => {
            const column = index % size;
            const row = Math.floor(index / size);
            return (
              <div key={index} className="aspect-square overflow-hidden">
                <img alt="" src={uri} className="h-full w-full" style={{ transform: cellCss(cellTransform(document.repeatMode, column, row)) }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ManufacturingPanel({
  hexByCode,
  settings,
}: {
  hexByCode: Record<string, string>;
  settings: ManufacturingSettings;
}) {
  const { t } = useTranslation();
  const document = useDesignerStore((state) => state.document);
  const warnings = validateDesign(document, settings);
  const markup = exportDesignSvg(document, hexByCode, { manufacturing: true });

  function downloadSvg() {
    const blob = new Blob([exportDesignSvg(document, hexByCode, { manufacturing: true })], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.name || 'mtart-design'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 border-t border-charcoal/10 pt-3">
      <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('designer.manufacturing')}</h2>
      <div className="border border-charcoal/10 bg-white [&_svg]:h-auto [&_svg]:w-full" dir="ltr" dangerouslySetInnerHTML={{ __html: markup }} />
      <button type="button" className="mt-2 w-full border border-charcoal/20 py-2 text-xs uppercase tracking-wide" onClick={downloadSvg}>
        {t('designer.exportSvg')}
      </button>
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-charcoal-soft">
          {warnings.slice(0, 8).map((warning, index) => (
            <li key={`${warning.code}-${index}`}>⚠ {t(warning.messageKey)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-charcoal-soft/70">{t('designer.warnings.ok')}</p>
      )}
    </div>
  );
}
