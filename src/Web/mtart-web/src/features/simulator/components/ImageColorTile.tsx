import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useImageColorSession } from '../hooks/useImageColorSession';
import {
  drawImageSession,
  drawSelectionOverlay,
  selectImageSurface,
  subscribeImageSession,
} from '../utils/imageColorSession';

export interface ImageSurfaceClick {
  clientX: number;
  clientY: number;
  seedHex: string;
}

export function ImageColorTile({
  mouldId,
  sourceUrl,
  rotation = 0,
  className,
  interactive = true,
  applyMatching,
  tolerance,
  onBeforeSelect,
  onSelect,
}: {
  mouldId: string;
  sourceUrl: string;
  rotation?: number;
  className?: string;
  interactive?: boolean;
  applyMatching: boolean;
  tolerance: number;
  onBeforeSelect?: () => void;
  onSelect?: (info: ImageSurfaceClick) => void;
}) {
  const editRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const { ready } = useImageColorSession(mouldId, sourceUrl);

  useEffect(() => {
    const paint = () => {
      try {
        const edit = editRef.current?.getContext('2d');
        const overlay = overlayRef.current?.getContext('2d');
        if (edit) {
          drawImageSession(edit, mouldId, false);
        }
        if (overlay) {
          if (interactive) {
            drawSelectionOverlay(overlay, mouldId);
          } else {
            overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
          }
        }
      } catch (error) {
        console.error('Color apply failed', error);
      }
    };
    const unsubscribe = subscribeImageSession(mouldId, paint);
    if (ready) {
      paint();
    }
    return unsubscribe;
  }, [mouldId, ready, interactive]);

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (!interactive) {
      return;
    }
    try {
      onBeforeSelect?.();
      const canvas = editRef.current;
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || !canvas.width || !canvas.height) {
        return;
      }
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);
      const selected = selectImageSurface(mouldId, x, y, tolerance, applyMatching);
      if (!selected || selected.count === 0) {
        console.error('Color apply failed', { reason: 'empty-selection', mouldId, x, y });
        return;
      }
      onSelect?.({
        clientX: event.clientX,
        clientY: event.clientY,
        seedHex: selected.seedHex,
      });
    } catch (error) {
      console.error('Color apply failed', error);
    }
  }

  return (
    <div
      className={className ? `${className} image-color-tile relative` : 'image-color-tile relative'}
      style={{ background: '#ffffff', transform: `rotate(${rotation}deg)` }}
    >
      <canvas
        ref={editRef}
        className="image-color-tile block h-full w-full"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={handleClick}
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}
