import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Check, Copy, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  DEFAULT_REGION_HEX,
  hexToRgb,
  normalizeHex,
  rgbColorFromChannels,
  type RGBColor,
} from './hex';
import { useCustomerPalette } from './useCustomerPalette';

export interface RegionColorPopoverProps {
  open: boolean;
  x: number;
  y: number;
  value?: string;
  onChange: (hex: string) => void;
  onApply: () => void;
  onResetArea: () => void;
  onResetAll: () => void;
  onClose: () => void;
  onCancel?: () => void;
  applyError?: string | null;
  applyMatching: boolean;
  onApplyMatchingChange: (next: boolean) => void;
  showColorMode?: boolean;
  colorMode?: 'texture' | 'flat';
  onColorModeChange?: (mode: 'texture' | 'flat') => void;
  showCancel?: boolean;
}

export function RegionColorPopover({
  open,
  x,
  y,
  value,
  onChange,
  onApply,
  onResetArea,
  onResetAll,
  onClose,
  onCancel,
  applyError,
  applyMatching,
  onApplyMatchingChange,
  showColorMode = false,
  colorMode = 'texture',
  onColorModeChange,
  showCancel = false,
}: RegionColorPopoverProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const onApplyRef = useRef(onApply);
  const onCancelRef = useRef(onCancel);
  const onCloseRef = useRef(onClose);
  const interactingRef = useRef(false);
  const selectedHex = normalizeHex(value) ?? DEFAULT_REGION_HEX;
  const rgb = hexToRgb(selectedHex) ?? { r: 255, g: 255, b: 255 };
  const [hexInput, setHexInput] = useState(selectedHex);
  const [copied, setCopied] = useState<'hex' | 'rgb' | null>(null);
  const { recent, rememberRecent } = useCustomerPalette();
  onApplyRef.current = onApply;
  onCancelRef.current = onCancel;
  onCloseRef.current = onClose;

  useEffect(() => {
    setHexInput(selectedHex);
  }, [selectedHex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const isInsidePopup = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return false;
      }
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (panelRef.current && (path.includes(panelRef.current) || panelRef.current.contains(target))) {
        return true;
      }
      if (target instanceof Element && target.closest('.region-color-popover, .react-colorful')) {
        return true;
      }
      return false;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        (onCancelRef.current ?? onCloseRef.current)();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (interactingRef.current || isInsidePopup(event)) {
        return;
      }
      try {
        onApplyRef.current();
      } catch (error) {
        console.error('Color apply failed', error);
      }
    };
    const stopInteracting = () => {
      interactingRef.current = false;
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerup', stopInteracting);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerup', stopInteracting);
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  function emit(hex: string, remember = false) {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return;
    }
    onChange(normalized);
    if (remember) {
      rememberRecent(normalized);
    }
  }

  function applyRgb(partial: Partial<Pick<RGBColor, 'r' | 'g' | 'b'>>) {
    emit(rgbColorFromChannels(partial.r ?? rgb.r, partial.g ?? rgb.g, partial.b ?? rgb.b).hex, true);
  }

  async function copyText(text: string, which: 'hex' | 'rgb') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied((current) => (current === which ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  const width = Math.min(300, window.innerWidth - 24);
  const height = showColorMode ? 520 : 420;
  const left = Math.min(Math.max(8, x + 14), window.innerWidth - width - 8);
  const top = Math.min(Math.max(8, y + 14), window.innerHeight - Math.min(height, window.innerHeight - 16) - 8);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('simulator.colorThisArea')}
      className="region-color-popover advanced-color-picker fixed z-[80] w-[min(300px,calc(100vw-24px))] max-h-[min(70dvh,520px)] overflow-y-auto border border-charcoal/15 bg-ivory p-3 shadow-lg"
      style={{ left, top }}
      onPointerDown={(event) => {
        interactingRef.current = true;
        event.stopPropagation();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.colorThisArea')}</p>
        <button
          type="button"
          className="text-charcoal-soft"
          aria-label={t('simulator.closePopup')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            rememberRecent(selectedHex);
            onApply();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-8 w-8 shrink-0 border border-charcoal/15" style={{ backgroundColor: selectedHex }} aria-hidden />
        <span className="font-mono text-xs text-charcoal">{selectedHex}</span>
      </div>
      <HexColorPicker color={selectedHex} onChange={(hex) => emit(hex)} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {([
          ['r', 'R', rgb.r],
          ['g', 'G', rgb.g],
          ['b', 'B', rgb.b],
        ] as const).map(([channel, label, channelValue]) => (
          <label key={channel} className="flex items-center gap-1 text-sm text-charcoal">
            <span className="w-3 font-medium">{label}</span>
            <input
              type="number"
              min={0}
              max={255}
              value={channelValue}
              aria-label={label}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === '') {
                  return;
                }
                const next = Number(raw);
                if (!Number.isFinite(next)) {
                  return;
                }
                applyRgb({ [channel]: Math.max(0, Math.min(255, Math.round(next))) });
              }}
              className="w-full border border-charcoal/15 bg-white px-1.5 py-1 font-mono text-sm"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="mt-1 text-[10px] uppercase tracking-wide text-charcoal-soft"
        onClick={() => void copyText(`RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
      >
        {copied === 'rgb' ? t('simulator.copied') : t('simulator.copyRgb')}
      </button>
      <label className="mt-2 flex items-center gap-2 text-sm text-charcoal">
        <span className="text-[11px] uppercase tracking-wide text-charcoal-soft">{t('simulator.hex')}</span>
        <input
          value={hexInput}
          onChange={(event) => {
            setHexInput(event.target.value);
            const next = normalizeHex(event.target.value);
            if (next) {
              emit(next, true);
            }
          }}
          onBlur={() => setHexInput(selectedHex)}
          className="min-w-0 flex-1 border border-charcoal/15 bg-white px-2 py-1 font-mono text-sm uppercase text-charcoal"
          aria-label={t('simulator.hex')}
        />
        <button
          type="button"
          className="inline-flex items-center gap-1 border border-charcoal/20 px-2 py-1 text-[10px] uppercase tracking-wide"
          onClick={() => void copyText(selectedHex, 'hex')}
        >
          {copied === 'hex' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied === 'hex' ? t('simulator.copied') : t('simulator.copyHex')}
        </button>
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-charcoal">
        <input
          type="checkbox"
          checked={applyMatching}
          onChange={(event) => onApplyMatchingChange(event.target.checked)}
        />
        {t('simulator.applyToMatching')}
      </label>
      {showColorMode ? (
        <fieldset className="mt-3">
          <legend className="mb-1 text-[10px] uppercase tracking-wide text-charcoal-soft">{t('simulator.colorMode')}</legend>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="radio"
              name="image-color-mode"
              checked={colorMode === 'texture'}
              onChange={() => onColorModeChange?.('texture')}
            />
            {t('simulator.preserveTexture')}
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm text-charcoal">
            <input
              type="radio"
              name="image-color-mode"
              checked={colorMode === 'flat'}
              onChange={() => onColorModeChange?.('flat')}
            />
            {t('simulator.flatColor')}
          </label>
        </fieldset>
      ) : null}
      {recent.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-charcoal-soft">{t('simulator.recentColors')}</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.slice(0, 10).map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => emit(hex, true)}
                className={clsx(
                  'h-6 w-6 border',
                  selectedHex === hex ? 'border-charcoal ring-1 ring-charcoal' : 'border-charcoal/20',
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      ) : null}
      {applyError ? (
        <p className="mt-2 text-[11px] text-red-700">{applyError}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        {showCancel ? (
          <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" onClick={onCancel ?? onClose}>
            {t('simulator.cancel')}
          </button>
        ) : (
          <button type="button" className="border border-charcoal/20 px-3 py-1.5 text-xs uppercase" onClick={onResetArea}>
            {t('simulator.resetThisArea')}
          </button>
        )}
        <button
          type="button"
          className="bg-charcoal px-3 py-1.5 text-xs uppercase text-ivory"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            rememberRecent(selectedHex);
            try {
              onApply();
            } catch (error) {
              console.error('Color apply failed', error);
            }
          }}
        >
          {t('simulator.applyColor')}
        </button>
      </div>
      {showCancel ? (
        <button type="button" className="mt-2 text-[11px] uppercase tracking-wide text-charcoal-soft" onClick={onResetArea}>
          {t('simulator.resetThisArea')}
        </button>
      ) : null}
      <button type="button" className="mt-2 text-[11px] uppercase tracking-wide text-charcoal-soft" onClick={onResetAll}>
        {t('simulator.resetAllColors')}
      </button>
    </div>,
    document.body,
  );
}
