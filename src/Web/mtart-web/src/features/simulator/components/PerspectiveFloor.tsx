import { useEffect, useRef } from 'react';
import { drawFallbackTileGrid, drawPerspectiveFloor } from '../utils/tileTexture';

export function PerspectiveFloor({
  textureUrl,
  across,
  rows,
  className,
  heightPercent,
  onError,
}: {
  textureUrl?: string;
  across: number;
  rows: number;
  className?: string;
  heightPercent: number;
  onError?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !textureUrl) {
      return;
    }
    const image = new Image();
    let cancelled = false;
    let frame = 0;

    const paint = () => {
      if (cancelled || !image.naturalWidth) {
        return;
      }
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      try {
        drawPerspectiveFloor(ctx, image, width, height, across, rows);
      } catch (error) {
        console.error('Preview render failed', error);
        drawFallbackTileGrid(ctx, image, width, height, 4);
      }
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(paint);
    };

    image.onload = schedule;
    image.onerror = (error) => {
      console.error('Preview SVG failed', error);
      onError?.();
    };
    image.src = textureUrl;
    if (image.complete && image.naturalWidth) {
      schedule();
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [textureUrl, across, rows, onError]);

  return (
    <div ref={hostRef} className={className} style={{ height: `${heightPercent}%` }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
