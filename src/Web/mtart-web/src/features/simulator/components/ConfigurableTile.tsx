import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import type { Color } from '@/types/catalog';
import { matchingRegionIds } from '../utils/regionDetect';
import { loadSvgMarkup, paintSvgDocument, prepareSvgMarkup } from '../utils/svgPaint';

export interface RegionClickInfo {
  clientX: number;
  clientY: number;
  matchGroup?: string;
  matchingIds: string[];
}

interface ConfigurableTileProps {
  src: string;
  regionColors: Record<string, string>;
  colors: Color[];
  rotation?: number;
  activeRegion?: string;
  onRegionClick?: (regionKey: string, info?: RegionClickInfo) => void;
  className?: string;
  mode?: 'color' | 'outline';
}

export function ConfigurableTile({
  src,
  regionColors,
  colors,
  rotation = 0,
  activeRegion,
  onRegionClick,
  className,
  mode = 'color',
}: ConfigurableTileProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const paintArgsRef = useRef({ regionColors, hexByCode: {} as Record<string, string>, activeRegion, mode });

  const hexByCode = useMemo(
    () => Object.fromEntries(colors.map((color) => [color.code, color.hexApproximation ?? '#ccc'])),
    [colors],
  );

  paintArgsRef.current = { regionColors, hexByCode, activeRegion, mode };

  useEffect(() => {
    let cancelled = false;
    loadSvgMarkup(src)
      .then((text) => {
        if (cancelled || !hostRef.current) {
          return;
        }
        const prepared = prepareSvgMarkup(text, src);
        hostRef.current.innerHTML = prepared;
        const svg = hostRef.current.querySelector('svg');
        if (import.meta.env.DEV && (!svg || svg.querySelectorAll('path, polygon, rect, circle, ellipse').length === 0)) {
          console.warn('Invalid mould:', src);
        }
        const args = paintArgsRef.current;
        paintSvgDocument(hostRef.current, args.regionColors, args.hexByCode, args.activeRegion, args.mode);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('SVG 404 or load error:', src, error);
        }
        if (hostRef.current) {
          hostRef.current.innerHTML = '';
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (hostRef.current) {
      paintSvgDocument(hostRef.current, regionColors, hexByCode, activeRegion, mode);
    }
  }, [regionColors, hexByCode, activeRegion, mode]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const region =
      target.getAttribute('data-region')
      ?? target.getAttribute('data-region-id')
      ?? target.closest('[data-region]')?.getAttribute('data-region')
      ?? target.closest('[data-region-id]')?.getAttribute('data-region-id');
    if (region) {
      const host = hostRef.current;
      const matchGroup = (target.closest('[data-match-group]') as HTMLElement | null)?.getAttribute('data-match-group')
        ?? undefined;
      onRegionClick?.(region, {
        clientX: event.clientX,
        clientY: event.clientY,
        matchGroup,
        matchingIds: host ? matchingRegionIds(host, region) : [region],
      });
    }
  }

  return (
    <div
      ref={hostRef}
      className={className ? `${className} mould-svg-host` : 'mould-svg-host'}
      dir="ltr"
      style={{ transform: `rotate(${rotation}deg)`, cursor: 'pointer', overflow: 'visible', background: '#ffffff' }}
      onClick={handleClick}
    />
  );
}

export { paintSvgMarkup, svgDataUrl } from '../utils/svgPaint';
