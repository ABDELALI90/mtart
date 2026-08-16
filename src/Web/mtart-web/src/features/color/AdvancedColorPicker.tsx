import { useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Sun } from 'lucide-react';
import { clsx } from 'clsx';
import {
  DEFAULT_REGION_HEX,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbColorFromChannels,
  rgbToHex,
  type RGBColor,
} from './hex';
import { useCustomerPalette } from './useCustomerPalette';

export interface AdvancedColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export function AdvancedColorPicker({
  value,
  onChange,
  sourceImageUrl,
}: {
  value?: string;
  onChange: (next: AdvancedColorValue) => void;
  sourceImageUrl?: string;
}) {
  const { t } = useTranslation();
  const selectedHex = normalizeHex(value) ?? DEFAULT_REGION_HEX;
  const rgb = hexToRgb(selectedHex) ?? { r: 255, g: 255, b: 255 };
  const hsv = hexToHsv(selectedHex) ?? { h: 0, s: 0, v: 100 };
  const [hexInput, setHexInput] = useState(selectedHex);
  const [mode, setMode] = useState<'HEX' | 'RGB'>('HEX');
  const { recent, rememberRecent } = useCustomerPalette();
  const recentTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setHexInput(selectedHex);
  }, [selectedHex]);

  function emit(hex: string, remember = false) {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return;
    }
    const nextRgb = hexToRgb(normalized) ?? rgb;
    onChange({ hex: normalized, rgb: nextRgb });
    window.clearTimeout(recentTimer.current);
    if (remember) {
      rememberRecent(normalized);
      return;
    }
    recentTimer.current = window.setTimeout(() => rememberRecent(normalized), 450);
  }

  function applyRgb(partial: Partial<Pick<RGBColor, 'r' | 'g' | 'b'>>) {
    emit(rgbColorFromChannels(partial.r ?? rgb.r, partial.g ?? rgb.g, partial.b ?? rgb.b).hex, true);
  }

  const brightHex = useMemo(() => hsvToHex(hsv.h, hsv.s, 100), [hsv.h, hsv.s]);

  return (
    <div className="advanced-color-picker flex min-h-0 flex-col gap-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.chooseColor')}</p>
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 shrink-0 rounded-full border border-charcoal/15" style={{ backgroundColor: selectedHex }} aria-hidden />
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
          className="min-w-0 flex-1 border border-charcoal/15 bg-white px-2 py-1.5 font-mono text-sm uppercase text-charcoal"
          aria-label={t('simulator.hex')}
        />
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as 'HEX' | 'RGB')}
          className="border border-charcoal/15 bg-white px-2 py-1.5 text-[11px] uppercase tracking-wide text-charcoal"
          aria-label={t('simulator.hex')}
        >
          <option value="HEX">{t('simulator.hex')}</option>
          <option value="RGB">{t('simulator.rgb')}</option>
        </select>
      </div>
      <HexColorPicker color={selectedHex} onChange={(hex) => emit(hex)} />
      <label className="flex items-center gap-2">
        <Sun className="h-4 w-4 shrink-0 text-charcoal-soft" aria-hidden />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(hsv.v)}
          aria-label={t('simulator.brightness')}
          onChange={(event) => emit(hsvToHex(hsv.h, hsv.s, Number(event.target.value)))}
          className="advanced-color-picker__brightness h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, #000000, ${brightHex})` }}
        />
      </label>
      <div className={clsx(mode === 'RGB' ? 'rounded-sm border border-charcoal/15 bg-white p-2' : '')}>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-charcoal-soft">{t('simulator.rgb')}</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['r', 'R', rgb.r],
            ['g', 'G', rgb.g],
            ['b', 'B', rgb.b],
          ] as const).map(([channel, label, channelValue]) => (
            <label key={channel} className="flex items-center gap-1.5 text-sm text-charcoal">
              <span className="w-4 font-medium">{label}</span>
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
                className="w-full border border-charcoal/15 bg-white px-2 py-1.5 font-mono text-sm"
              />
            </label>
          ))}
        </div>
      </div>
      {sourceImageUrl ? (
        <button
          type="button"
          className="block w-full overflow-hidden border border-charcoal/15 bg-white"
          onClick={(event) => {
            const image = event.currentTarget.querySelector('img');
            if (!image) {
              return;
            }
            const hex = pickHexFromImage(image, event.clientX, event.clientY);
            if (hex) {
              emit(hex, true);
            }
          }}
        >
          <img src={sourceImageUrl} alt="" className="h-16 w-full object-contain" />
        </button>
      ) : null}
      {recent.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-charcoal-soft">{t('simulator.recentColors')}</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.slice(0, 12).map((hex) => (
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
    </div>
  );
}

function pickHexFromImage(image: HTMLImageElement, clientX: number, clientY: number): string | null {
  const rect = image.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx || !image.naturalWidth) {
    return null;
  }
  ctx.drawImage(image, 0, 0);
  const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * canvas.width)));
  const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * canvas.height)));
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  return rgbToHex(r, g, b);
}
