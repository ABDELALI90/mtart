import { TILE_UNITS, type DesignElement, type Point, type SymmetryMode } from '../types';

export interface SymmetryCopy {
  rotate: number;
  scaleX: number;
  scaleY: number;
}

export function symmetryCopies(mode: SymmetryMode): SymmetryCopy[] {
  switch (mode) {
    case '2':
      return [
        { rotate: 0, scaleX: 1, scaleY: 1 },
        { rotate: 180, scaleX: 1, scaleY: 1 },
      ];
    case '4':
      return [0, 90, 180, 270].map((rotate) => ({ rotate, scaleX: 1, scaleY: 1 }));
    case '6':
      return [0, 60, 120, 180, 240, 300].map((rotate) => ({ rotate, scaleX: 1, scaleY: 1 }));
    case '8':
      return [0, 45, 90, 135, 180, 225, 270, 315].map((rotate) => ({ rotate, scaleX: 1, scaleY: 1 }));
    case 'radial':
      return Array.from({ length: 12 }, (_, index) => ({ rotate: index * 30, scaleX: 1, scaleY: 1 }));
    default:
      return [{ rotate: 0, scaleX: 1, scaleY: 1 }];
  }
}

export function aroundCenter(point: Point, copy: SymmetryCopy, cx = TILE_UNITS / 2, cy = TILE_UNITS / 2): Point {
  const dx = point.x - cx;
  const dy = point.y - cy;
  const sx = dx * copy.scaleX;
  const sy = dy * copy.scaleY;
  const radians = (copy.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: cx + sx * cos - sy * sin,
    y: cy + sx * sin + sy * cos,
  };
}

export function symmetryGroupTransform(copy: SymmetryCopy, cx = TILE_UNITS / 2, cy = TILE_UNITS / 2): string {
  return `translate(${cx} ${cy}) rotate(${copy.rotate}) scale(${copy.scaleX} ${copy.scaleY}) translate(${-cx} ${-cy})`;
}

export function flattenElementCopies(element: DesignElement, mode: SymmetryMode): DesignElement[] {
  return symmetryCopies(mode).map((copy, index) => {
    if (index === 0) {
      return element;
    }
    const center: Point = { x: element.x, y: element.y };
    const mapped = aroundCenter(center, copy);
    return {
      ...element,
      id: `${element.id}-sym-${index}`,
      x: mapped.x,
      y: mapped.y,
      rotation: element.rotation + copy.rotate,
      scaleX: element.scaleX * copy.scaleX,
      scaleY: element.scaleY * copy.scaleY,
    };
  });
}
