import {
  DEFAULT_MANUFACTURING,
  TILE_UNITS,
  type CustomDesignDocument,
  type ManufacturabilityWarning,
  type ManufacturingSettings,
} from '../types';
import { boundingBox, isClosedShape, polygonArea, worldPoints } from './paths';
import { flattenElementCopies } from './symmetry';

const MM_PER_UNIT = 1;

function boxesOverlap(
  a: ReturnType<typeof boundingBox>,
  b: ReturnType<typeof boundingBox>,
): { overlapW: number; overlapH: number; overlapArea: number } | null {
  const overlapW = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapH = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  if (overlapW <= 0 || overlapH <= 0) {
    return null;
  }
  return { overlapW, overlapH, overlapArea: overlapW * overlapH };
}

export function validateDesign(
  document: CustomDesignDocument,
  settings: ManufacturingSettings = DEFAULT_MANUFACTURING,
): ManufacturabilityWarning[] {
  const warnings: ManufacturabilityWarning[] = [];
  const copies = document.elements.filter((el) => el.visible).flatMap((el) => flattenElementCopies(el, document.symmetry));
  const boxes = copies.map((element) => ({ element, points: worldPoints(element), box: boundingBox(worldPoints(element)) }));

  for (const item of boxes) {
    if (!isClosedShape(item.element.type) || item.element.strokeOnly) {
      if (item.element.type === 'line' || item.element.type === 'arc') {
        warnings.push({
          code: 'open-path',
          messageKey: 'designer.warnings.openPath',
          elementId: item.element.id,
        });
      }
      continue;
    }

    const areaMm2 = polygonArea(item.points) * MM_PER_UNIT * MM_PER_UNIT;
    const minSide = Math.min(item.box.width, item.box.height) * MM_PER_UNIT;
    if (areaMm2 < settings.minRegionAreaMm2) {
      warnings.push({
        code: 'tiny-area',
        messageKey: 'designer.warnings.tinyArea',
        elementId: item.element.id,
        regionId: item.element.regionId,
      });
    }
    if (minSide < settings.minRegionWidthMm) {
      warnings.push({
        code: 'thin-region',
        messageKey: 'designer.warnings.thinRegion',
        elementId: item.element.id,
        regionId: item.element.regionId,
      });
    }
    if (item.box.minX < -1 || item.box.minY < -1 || item.box.maxX > TILE_UNITS + 1 || item.box.maxY > TILE_UNITS + 1) {
      warnings.push({
        code: 'out-of-bounds',
        messageKey: 'designer.warnings.outOfBounds',
        elementId: item.element.id,
      });
    }
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const left = boxes[i];
      const right = boxes[j];
      if (left.element.id.split('-sym-')[0] === right.element.id.split('-sym-')[0]) {
        continue;
      }
      const overlap = boxesOverlap(left.box, right.box);
      if (!overlap) {
        const gapX = Math.max(0, Math.max(left.box.minX, right.box.minX) - Math.min(left.box.maxX, right.box.maxX));
        const gapY = Math.max(0, Math.max(left.box.minY, right.box.minY) - Math.min(left.box.maxY, right.box.maxY));
        const gap = Math.hypot(gapX, gapY) * MM_PER_UNIT;
        if (gap > 0 && gap < settings.minGapMm) {
          warnings.push({
            code: 'tiny-gap',
            messageKey: 'designer.warnings.tinyGap',
            elementId: left.element.id,
          });
        }
        continue;
      }
      const smaller = Math.min(left.box.width * left.box.height, right.box.width * right.box.height) || 1;
      if (overlap.overlapArea / smaller > settings.maxOverlapRatio) {
        warnings.push({
          code: 'overlap',
          messageKey: 'designer.warnings.overlap',
          elementId: left.element.id,
        });
      }
      const same =
        Math.abs(left.box.width - right.box.width) < 0.5
        && Math.abs(left.box.height - right.box.height) < 0.5
        && Math.abs(left.box.minX - right.box.minX) < 0.5
        && Math.abs(left.box.minY - right.box.minY) < 0.5;
      if (same) {
        warnings.push({
          code: 'duplicate',
          messageKey: 'designer.warnings.duplicate',
          elementId: left.element.id,
        });
      }
    }
  }

  return uniqueWarnings(warnings);
}

function uniqueWarnings(warnings: ManufacturabilityWarning[]): ManufacturabilityWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.elementId ?? ''}:${warning.regionId ?? ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
