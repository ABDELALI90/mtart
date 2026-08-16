import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  clampCrop,
  containRect,
  cropToBox,
  defaultQuad,
  type PixelCrop,
  type QuadPoint,
} from '../utils/cropGeometry';

export function SquareCropper({
  src,
  naturalWidth,
  naturalHeight,
  crop,
  onCrop,
  angled,
  quad,
  onQuad,
}: {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  crop: PixelCrop;
  onCrop: (crop: PixelCrop) => void;
  angled: boolean;
  quad: QuadPoint[];
  onQuad: (quad: QuadPoint[]) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1, h: 1 });
  const drag = useRef<{
    mode: 'move' | 'resize' | 'quad';
    index: number;
    startX: number;
    startY: number;
    origin: PixelCrop;
    originQuad?: QuadPoint[];
  } | null>(null);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) {
      return;
    }
    const update = () => setBox({ w: node.clientWidth, h: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  const contained = containRect(naturalWidth, naturalHeight, box.w, box.h);
  const display = cropToBox(crop, contained);

  function pointerToNatural(event: PointerEvent) {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return {
      x: (event.clientX - rect.left - contained.x) / contained.scale,
      y: (event.clientY - rect.top - contained.y) / contained.scale,
    };
  }

  function onPointerDown(event: PointerEvent<HTMLElement>, mode: 'move' | 'resize', index = 0) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { mode, index, startX: event.clientX, startY: event.clientY, origin: crop };
  }

  function onQuadDown(event: PointerEvent<HTMLElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = {
      mode: 'quad',
      index,
      startX: event.clientX,
      startY: event.clientY,
      origin: crop,
      originQuad: quad.map((point) => ({ ...point })),
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active) {
      return;
    }
    if (active.mode === 'quad' && active.originQuad) {
      const natural = pointerToNatural(event);
      const next = [...(active.originQuad)];
      next[active.index] = {
        x: Math.min(1, Math.max(0, (natural.x - crop.x) / crop.size)),
        y: Math.min(1, Math.max(0, (natural.y - crop.y) / crop.size)),
      };
      onQuad(next);
      return;
    }
    const dx = (event.clientX - active.startX) / contained.scale;
    const dy = (event.clientY - active.startY) / contained.scale;
    if (active.mode === 'move') {
      onCrop(clampCrop({ ...active.origin, x: active.origin.x + dx, y: active.origin.y + dy }, naturalWidth, naturalHeight));
      return;
    }
    const fromSe = active.index === 2;
    const size = fromSe ? active.origin.size + dx : active.origin.size - dx;
    const next = clampCrop(
      {
        x: fromSe ? active.origin.x : active.origin.x + (active.origin.size - size),
        y: fromSe ? active.origin.y : active.origin.y + (active.origin.size - size),
        size,
      },
      naturalWidth,
      naturalHeight,
    );
    onCrop(next);
  }

  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div
      ref={boxRef}
      className="relative mx-auto aspect-square w-full max-h-[min(50vh,500px)] max-w-[min(100%,500px)] touch-none overflow-hidden bg-charcoal/10"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={src} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      <div
        className="absolute border-2 border-cinema-fg shadow-[0_0_0_9999px_rgba(20,16,12,0.45)]"
        style={{ left: display.x, top: display.y, width: display.size, height: display.size }}
        onPointerDown={(event) => onPointerDown(event, 'move')}
      >
        <button type="button" aria-label="Resize" className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-cinema-fg" onPointerDown={(event) => onPointerDown(event, 'resize', 0)} />
        <button type="button" aria-label="Resize" className="absolute -right-1.5 -bottom-1.5 h-3 w-3 bg-cinema-fg" onPointerDown={(event) => onPointerDown(event, 'resize', 2)} />
        {angled
          ? (quad.length ? quad : defaultQuad()).map((point, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Corner ${index + 1}`}
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cinema-fg bg-cinema"
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                onPointerDown={(event) => onQuadDown(event, index)}
              />
            ))
          : null}
      </div>
    </div>
  );
}
