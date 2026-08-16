import { nanoidLike } from './ids';
import { elementLocalPath, khatemStar, pointsToPath, regularPolygon, starPolygon } from './paths';
import type { DesignElement, Point, ShapeType } from '../types';

function petalPath(rx: number, ry: number, count: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
    const cx = Math.cos(angle) * rx * 0.35;
    const cy = Math.sin(angle) * ry * 0.35;
    const px = Math.cos(angle) * rx;
    const py = Math.sin(angle) * ry;
    const left = angle - Math.PI / count;
    const right = angle + Math.PI / count;
    parts.push(
      `M${r(cx)} ${r(cy)} Q${r(Math.cos(left) * rx * 0.7)} ${r(Math.sin(left) * ry * 0.7)} ${r(px)} ${r(py)} Q${r(Math.cos(right) * rx * 0.7)} ${r(Math.sin(right) * ry * 0.7)} ${r(cx)} ${r(cy)} Z`,
    );
  }
  return parts.join(' ');
}

function diamondsRingPath(rx: number, ry: number, copies: number): string {
  const parts: string[] = [];
  for (let i = 0; i < copies; i += 1) {
    const angle = (i * 2 * Math.PI) / copies - Math.PI / 2;
    const cx = Math.cos(angle) * rx * 0.72;
    const cy = Math.sin(angle) * ry * 0.72;
    const dx = rx * 0.16;
    const dy = ry * 0.22;
    const diamond: Point[] = [
      { x: cx, y: cy - dy },
      { x: cx + dx, y: cy },
      { x: cx, y: cy + dy },
      { x: cx - dx, y: cy },
    ];
    parts.push(pointsToPath(diamond));
  }
  return parts.join(' ');
}

function interlacePath(rx: number, ry: number): string {
  const a = pointsToPath(regularPolygon(8, rx, ry, 0));
  const b = pointsToPath(regularPolygon(8, rx * 0.78, ry * 0.78, 22.5));
  return `${a} ${b}`;
}

function starAndCrossPath(rx: number, ry: number): string {
  const oct = pointsToPath(regularPolygon(8, rx * 0.42, ry * 0.42, 22.5));
  const star = pointsToPath(starPolygon(8, rx * 0.38, ry * 0.38, 0.45));
  const arms = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const cx = Math.cos(rad) * rx * 0.72;
    const cy = Math.sin(rad) * ry * 0.72;
    return pointsToPath([
      { x: cx, y: cy - ry * 0.16 },
      { x: cx + rx * 0.16, y: cy },
      { x: cx, y: cy + ry * 0.16 },
      { x: cx - rx * 0.16, y: cy },
    ]);
  });
  return [oct, star, ...arms].join(' ');
}

function moorishRadialPath(rx: number, ry: number, rays: number, rings: number): string {
  const parts: string[] = [];
  for (let ring = 1; ring <= rings; ring += 1) {
    const scale = ring / rings;
    parts.push(pointsToPath(regularPolygon(rays, rx * scale, ry * scale, -90)));
  }
  for (let i = 0; i < rays; i += 1) {
    const angle = (i * 2 * Math.PI) / rays - Math.PI / 2;
    parts.push(`M0 0 L${r(Math.cos(angle) * rx)} ${r(Math.sin(angle) * ry)}`);
  }
  parts.push(pointsToPath(starPolygon(rays >= 10 ? 10 : 8, rx * 0.28, ry * 0.28, 0.4)));
  return parts.join(' ');
}

function r(value: number): number {
  return Math.round(value * 100) / 100;
}

export function motifPath(type: ShapeType, width: number, height: number, params: DesignElement['params']): string {
  const rx = width / 2;
  const ry = height / 2;
  switch (type) {
    case 'rosette':
      return petalPath(rx, ry, params.petals ?? 8);
    case 'diamondsRing':
      return diamondsRingPath(rx, ry, params.copies ?? 8);
    case 'interlace':
      return interlacePath(rx, ry);
    case 'starAndCross':
      return starAndCrossPath(rx, ry);
    case 'moorishRadial':
      return moorishRadialPath(rx, ry, params.rays ?? 8, params.rings ?? 3);
    case 'khatem':
      return pointsToPath(khatemStar(rx, ry));
    default:
      return elementLocalPath({
        id: 'tmp',
        type,
        name: type,
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        regionId: 'tmp',
        strokeOnly: false,
        strokeWidth: 1.5,
        params,
        visible: true,
        locked: false,
      }).d;
  }
}

export function createMotifElements(
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  regionId: string,
  name: string,
): DesignElement[] {
  const width = size;
  const height = size;
  const params =
    type === 'rosette'
      ? { petals: 8 }
      : type === 'moorishRadial'
        ? { rays: 8, rings: 3 }
        : type === 'diamondsRing'
          ? { copies: 8 }
          : type === 'polygon'
            ? { sides: 5 }
            : type === 'arc'
              ? { startAngle: -40, sweep: 140 }
              : {};

  const compound = type === 'rosette' || type === 'diamondsRing' || type === 'interlace' || type === 'starAndCross' || type === 'moorishRadial';
  return [
    {
      id: nanoidLike('el'),
      type,
      name,
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      regionId,
      strokeOnly: type === 'line' || type === 'arc' || type === 'interlace' || type === 'moorishRadial',
      strokeWidth: compound ? 1.8 : type === 'line' || type === 'arc' ? 2.4 : 0,
      params,
      d: compound ? motifPath(type, width, height, params) : undefined,
      visible: true,
      locked: false,
    },
  ];
}
