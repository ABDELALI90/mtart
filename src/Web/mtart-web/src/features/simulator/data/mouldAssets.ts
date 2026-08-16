import type { TilePatternDetail, TilePatternListItem } from '@/types/catalog';
import { isUntrustedTraceUrl } from '../utils/mouldQuality';

const CLEAN_MOROCCAN = new Set(['MOR-017']);
const CLEAN_MOROCCAN_SVG = '/moulds/moroccan/MOR-017.svg';

function withCleanMor<T extends { reference: string; vectorAssetUrl?: string | null; previewImageUrl?: string | null; isCustomizable?: boolean }>(item: T): T {
  if (!CLEAN_MOROCCAN.has(item.reference.toUpperCase())) {
    return item;
  }
  return {
    ...item,
    vectorAssetUrl: CLEAN_MOROCCAN_SVG,
    previewImageUrl: CLEAN_MOROCCAN_SVG,
    isCustomizable: true,
  };
}

function hideFromSimulator(item: { reference?: string; vectorAssetUrl?: string | null; isCustomizable?: boolean }) {
  const ref = (item.reference ?? '').toUpperCase();
  if (CLEAN_MOROCCAN.has(ref)) {
    return false;
  }
  if (isUntrustedTraceUrl(item.vectorAssetUrl)) {
    return true;
  }
  return ref.startsWith('MOR-');
}

export function resolveExistingMouldSvg(reference: string, current?: string | null): string | null {
  const ref = reference.toUpperCase();
  if (CLEAN_MOROCCAN.has(ref)) {
    return CLEAN_MOROCCAN_SVG;
  }
  if (ref.startsWith('MOR-') || isUntrustedTraceUrl(current)) {
    return null;
  }
  return current ?? null;
}

export function mouldSvgCandidates(src: string, reference?: string): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    if (url && !isUntrustedTraceUrl(url) && !urls.includes(url)) {
      urls.push(url);
    }
  };
  add(src);
  const fromSrc = src.match(/(MOR-\d+)\.svg$/i)?.[1]?.toUpperCase();
  add(resolveExistingMouldSvg(reference || fromSrc || '', src));
  return urls;
}

export function hydrateMouldListItem(item: TilePatternListItem): TilePatternListItem {
  const next = withCleanMor(item);
  if (hideFromSimulator(next)) {
    return { ...next, vectorAssetUrl: null, isCustomizable: false };
  }
  return next;
}

export function hydrateMouldDetail(detail: TilePatternDetail): TilePatternDetail {
  const next = withCleanMor(detail);
  if (hideFromSimulator(next)) {
    return { ...next, vectorAssetUrl: null, isCustomizable: false };
  }
  return next;
}

export function isRenderableMould(item: Pick<TilePatternListItem, 'reference' | 'vectorAssetUrl' | 'isCustomizable'>) {
  const next = withCleanMor(item as TilePatternListItem);
  return !hideFromSimulator(next) && Boolean(next.vectorAssetUrl) && next.isCustomizable !== false;
}
