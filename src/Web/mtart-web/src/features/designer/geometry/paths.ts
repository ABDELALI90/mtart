import type { DesignElement, Point, ShapeType } from '../types';

export function regularPolygon(sides: number, rx: number, ry: number, rotationDeg = -90): Point[] {
  const start = (rotationDeg * Math.PI) / 180;
  return Array.from({ length: sides }, (_, index) => {
    const angle = start + (index * 2 * Math.PI) / sides;
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  });
}

export function starPolygon(
  points: number,
  rx: number,
  ry: number,
  innerRatio = 0.42,
  rotationDeg = -90,
): Point[] {
  const start = (rotationDeg * Math.PI) / 180;
  const vertices: Point[] = [];
  for (let i = 0; i < points; i += 1) {
    const outer = start + (i * 2 * Math.PI) / points;
    vertices.push({ x: Math.cos(outer) * rx, y: Math.sin(outer) * ry });
    const inner = outer + Math.PI / points;
    vertices.push({ x: Math.cos(inner) * rx * innerRatio, y: Math.sin(inner) * ry * innerRatio });
  }
  return vertices;
}

/** Outline of two overlapping squares — original khatem / 8-point star construction. */
export function khatemStar(rx: number, ry: number): Point[] {
  const a = Math.min(rx, ry) / Math.SQRT2;
  const b = Math.min(rx, ry);
  return [
    { x: b, y: 0 },
    { x: a, y: a },
    { x: 0, y: b },
    { x: -a, y: a },
    { x: -b, y: 0 },
    { x: -a, y: -a },
    { x: 0, y: -b },
    { x: a, y: -a },
  ];
}

export function crossPolygon(rx: number, ry: number, arm = 0.28): Point[] {
  const tx = Math.max(4, rx * arm);
  const ty = Math.max(4, ry * arm);
  return [
    { x: -tx, y: -ry },
    { x: tx, y: -ry },
    { x: tx, y: -ty },
    { x: rx, y: -ty },
    { x: rx, y: ty },
    { x: tx, y: ty },
    { x: tx, y: ry },
    { x: -tx, y: ry },
    { x: -tx, y: ty },
    { x: -rx, y: ty },
    { x: -rx, y: -ty },
    { x: -tx, y: -ty },
  ];
}

export function diamondPolygon(rx: number, ry: number): Point[] {
  return [
    { x: 0, y: -ry },
    { x: rx, y: 0 },
    { x: 0, y: ry },
    { x: -rx, y: 0 },
  ];
}

export function pointsToPath(points: Point[], closed = true): string {
  if (points.length === 0) {
    return '';
  }
  const [first, ...rest] = points;
  const body = rest.map((point) => `L${round(point.x)} ${round(point.y)}`).join(' ');
  return `M${round(first.x)} ${round(first.y)} ${body}${closed ? ' Z' : ''}`;
}

export function ellipsePath(rx: number, ry: number): string {
  return `M${round(-rx)} 0 A${round(rx)} ${round(ry)} 0 1 0 ${round(rx)} 0 A${round(rx)} ${round(ry)} 0 1 0 ${round(-rx)} 0 Z`;
}

export function semiCirclePath(rx: number, ry: number): string {
  return `M${round(-rx)} 0 A${round(rx)} ${round(ry)} 0 0 1 ${round(rx)} 0 Z`;
}

export function quarterCirclePath(rx: number, ry: number): string {
  return `M0 0 L${round(rx)} 0 A${round(rx)} ${round(ry)} 0 0 1 0 ${round(ry)} Z`;
}

export function arcPath(rx: number, ry: number, startDeg: number, sweepDeg: number): string {
  const start = (startDeg * Math.PI) / 180;
  const end = ((startDeg + sweepDeg) * Math.PI) / 180;
  const large = Math.abs(sweepDeg) > 180 ? 1 : 0;
  const sweep = sweepDeg >= 0 ? 1 : 0;
  const x1 = Math.cos(start) * rx;
  const y1 = Math.sin(start) * ry;
  const x2 = Math.cos(end) * rx;
  const y2 = Math.sin(end) * ry;
  return `M${round(x1)} ${round(y1)} A${round(rx)} ${round(ry)} 0 ${large} ${sweep} ${round(x2)} ${round(y2)}`;
}

export function rhombusPolygon(rx: number, ry: number): Point[] {
  return [
    { x: 0, y: -ry },
    { x: rx * 0.72, y: 0 },
    { x: 0, y: ry },
    { x: -rx * 0.72, y: 0 },
  ];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const STAR_POINTS: Partial<Record<ShapeType, number>> = {
  star4: 4,
  star6: 6,
  star8: 8,
  star10: 10,
  star12: 12,
  moroccanStar: 8,
};

export function isClosedShape(type: ShapeType): boolean {
  return type !== 'line' && type !== 'arc';
}

export function elementLocalPath(element: DesignElement): { d: string; closed: boolean } {
  const rx = Math.max(2, element.width / 2);
  const ry = Math.max(2, element.height / 2);
  const closed = isClosedShape(element.type) && !element.strokeOnly;

  if (element.type === 'path' && element.d) {
    return { d: element.d, closed: /z\s*$/i.test(element.d.trim()) };
  }

  switch (element.type) {
    case 'line':
      return { d: `M${round(-rx)} 0 L${round(rx)} 0`, closed: false };
    case 'arc':
      return {
        d: arcPath(rx, ry, element.params.startAngle ?? -30, element.params.sweep ?? 120),
        closed: false,
      };
    case 'circle':
      return { d: ellipsePath(rx, ry), closed: true };
    case 'semiCircle':
      return { d: semiCirclePath(rx, ry), closed: true };
    case 'quarterCircle':
      return { d: quarterCirclePath(rx, ry), closed: true };
    case 'triangle':
      return { d: pointsToPath(regularPolygon(3, rx, ry)), closed: true };
    case 'square':
    case 'rectangle':
      return {
        d: pointsToPath([
          { x: -rx, y: -ry },
          { x: rx, y: -ry },
          { x: rx, y: ry },
          { x: -rx, y: ry },
        ]),
        closed: true,
      };
    case 'diamond':
      return { d: pointsToPath(diamondPolygon(rx, ry)), closed: true };
    case 'rhombus':
      return { d: pointsToPath(rhombusPolygon(rx, ry)), closed: true };
    case 'hexagon':
      return { d: pointsToPath(regularPolygon(6, rx, ry, 0)), closed: true };
    case 'octagon':
      return { d: pointsToPath(regularPolygon(8, rx, ry, 22.5)), closed: true };
    case 'cross':
      return { d: pointsToPath(crossPolygon(rx, ry)), closed: true };
    case 'polygon':
      return { d: pointsToPath(regularPolygon(element.params.sides ?? 5, rx, ry)), closed: true };
    case 'khatem':
      return { d: pointsToPath(khatemStar(rx, ry)), closed: true };
    case 'moroccanStar':
      return { d: pointsToPath(starPolygon(8, rx, ry, 0.38)), closed: true };
    default: {
      const points = STAR_POINTS[element.type];
      if (points) {
        return {
          d: pointsToPath(starPolygon(points, rx, ry, element.params.innerRatio ?? 0.42)),
          closed: true,
        };
      }
      return { d: ellipsePath(rx, ry), closed };
    }
  }
}

export function elementLocalPoints(element: DesignElement): Point[] {
  const rx = Math.max(2, element.width / 2);
  const ry = Math.max(2, element.height / 2);
  switch (element.type) {
    case 'triangle':
      return regularPolygon(3, rx, ry);
    case 'square':
    case 'rectangle':
      return [
        { x: -rx, y: -ry },
        { x: rx, y: -ry },
        { x: rx, y: ry },
        { x: -rx, y: ry },
      ];
    case 'diamond':
      return diamondPolygon(rx, ry);
    case 'rhombus':
      return rhombusPolygon(rx, ry);
    case 'hexagon':
      return regularPolygon(6, rx, ry, 0);
    case 'octagon':
      return regularPolygon(8, rx, ry, 22.5);
    case 'cross':
      return crossPolygon(rx, ry);
    case 'polygon':
      return regularPolygon(element.params.sides ?? 5, rx, ry);
    case 'khatem':
      return khatemStar(rx, ry);
    case 'circle':
    case 'semiCircle':
    case 'quarterCircle':
      return regularPolygon(24, rx, ry);
    default: {
      const points = STAR_POINTS[element.type];
      if (points) {
        return starPolygon(points, rx, ry, element.params.innerRatio ?? (element.type === 'moroccanStar' ? 0.38 : 0.42));
      }
      return regularPolygon(12, rx, ry);
    }
  }
}

export function transformPoint(point: Point, element: DesignElement): Point {
  const radians = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const sx = point.x * element.scaleX;
  const sy = point.y * element.scaleY;
  return {
    x: element.x + sx * cos - sy * sin,
    y: element.y + sx * sin + sy * cos,
  };
}

export function worldPoints(element: DesignElement): Point[] {
  return elementLocalPoints(element).map((point) => transformPoint(point, element));
}

export function polygonArea(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

export function boundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
