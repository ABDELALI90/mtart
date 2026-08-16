import type { RepeatMode } from '../types';

export interface CellTransform {
  rotate: number;
  scaleX: number;
  scaleY: number;
}

export function cellTransform(mode: RepeatMode, column: number, row: number): CellTransform {
  const identity: CellTransform = { rotate: 0, scaleX: 1, scaleY: 1 };
  switch (mode) {
    case 'straight':
      return identity;
    case 'rotate90':
      return { rotate: ((column + row) * 90) % 360, scaleX: 1, scaleY: 1 };
    case 'rotate180':
      return { rotate: ((column + row) * 180) % 360, scaleX: 1, scaleY: 1 };
    case 'alt90':
      return { rotate: (column + row) % 2 === 0 ? 0 : 90, scaleX: 1, scaleY: 1 };
    case 'alt180':
      return { rotate: (column + row) % 2 === 0 ? 0 : 180, scaleX: 1, scaleY: 1 };
    case 'mirrorX':
      return { rotate: 0, scaleX: column % 2 === 0 ? 1 : -1, scaleY: 1 };
    case 'mirrorY':
      return { rotate: 0, scaleX: 1, scaleY: row % 2 === 0 ? 1 : -1 };
    case 'checker':
      return { rotate: (column + row) % 2 === 0 ? 0 : 180, scaleX: 1, scaleY: 1 };
    case 'compose2': {
      const localCol = column % 2;
      const localRow = row % 2;
      const rotate = localRow === 0 ? (localCol === 0 ? 0 : 90) : localCol === 0 ? 270 : 180;
      return { rotate, scaleX: 1, scaleY: 1 };
    }
    case 'compose4': {
      const localCol = column % 4;
      const localRow = row % 4;
      return cellTransform('compose2', localCol, localRow);
    }
    default:
      return identity;
  }
}

export function cellCss(transform: CellTransform): string {
  return `scale(${transform.scaleX}, ${transform.scaleY}) rotate(${transform.rotate}deg)`;
}
