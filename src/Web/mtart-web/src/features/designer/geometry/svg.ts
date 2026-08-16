import { BACKGROUND_REGION_ID, TILE_UNITS, type CustomDesignDocument, type DesignElement } from '../types';
import { elementLocalPath } from './paths';
import { flattenElementCopies } from './symmetry';
import { resolveColorValue } from '@/features/color/hex';

function fillFor(document: CustomDesignDocument, regionId: string, hexByCode: Record<string, string>, fallback: string): string {
  const region = document.regions.find((item) => item.id === regionId);
  return resolveColorValue(region?.colorReference ?? undefined, hexByCode) || fallback;
}

function elementMarkup(element: DesignElement, fill: string, manufacturing: boolean): string {
  const { d, closed } = element.d
    ? { d: element.d, closed: /z/i.test(element.d) }
    : elementLocalPath(element);
  const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation}) scale(${element.scaleX} ${element.scaleY})`;
  const stroke = manufacturing || element.strokeOnly ? '#262320' : 'none';
  const strokeWidth = element.strokeOnly || manufacturing ? element.strokeWidth || 1.4 : 0;
  const fillValue = element.strokeOnly && !closed ? 'none' : fill;
  return `<path id="${element.id}" data-region="${element.regionId}" d="${d}" fill="${fillValue}" fill-rule="evenodd" stroke="${stroke}" stroke-width="${strokeWidth}" transform="${transform}" />`;
}

export function exportDesignSvg(
  document: CustomDesignDocument,
  hexByCode: Record<string, string>,
  options?: { manufacturing?: boolean; includeGuides?: boolean },
): string {
  const manufacturing = options?.manufacturing ?? false;
  const bg = fillFor(document, document.backgroundRegionId, hexByCode, '#f4eee4');
  const copies = document.elements
    .filter((element) => element.visible)
    .flatMap((element) => flattenElementCopies(element, document.symmetry));

  const paths = copies
    .map((element) => {
      const fill = manufacturing ? '#f6f2ea' : fillFor(document, element.regionId, hexByCode, '#d9d0c3');
      return elementMarkup(element, fill, manufacturing);
    })
    .join('\n  ');

  const labels = manufacturing
    ? document.regions
        .map((region, index) => {
          const owner = copies.find((element) => element.regionId === region.id);
          const x = owner?.x ?? 12;
          const y = owner?.y ?? 16 + index * 10;
          return `<text x="${x}" y="${y}" font-size="6" text-anchor="middle" fill="#262320">${region.id}</text>`;
        })
        .join('\n  ')
    : '';

  const dimensions = manufacturing
    ? `<line x1="0" y1="${TILE_UNITS + 8}" x2="${TILE_UNITS}" y2="${TILE_UNITS + 8}" stroke="#262320" stroke-width="0.8" />
  <text x="${TILE_UNITS / 2}" y="${TILE_UNITS + 16}" font-size="7" text-anchor="middle" fill="#262320">${document.widthCm} × ${document.heightCm} ${document.unit}</text>`
    : '';

  const height = manufacturing ? TILE_UNITS + 22 : TILE_UNITS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_UNITS} ${height}" width="${TILE_UNITS}" height="${height}">
  <rect id="${BACKGROUND_REGION_ID}" data-region="${BACKGROUND_REGION_ID}" x="0" y="0" width="${TILE_UNITS}" height="${TILE_UNITS}" fill="${manufacturing ? '#fff' : bg}" />
  ${paths}
  ${labels}
  ${dimensions}
</svg>`;
}

export function thumbnailSvg(document: CustomDesignDocument, hexByCode: Record<string, string>): string {
  return exportDesignSvg(document, hexByCode);
}

export function svgDataUri(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
