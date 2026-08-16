import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/i18n';

/** Builds an internal, language-prefixed path, e.g. localizedPath('fr', '/products') -> '/fr/products'. */
export function localizedPath(lang: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${normalized === '/' ? '' : normalized}`;
}

/** Swaps the language segment of the current path, preserving the rest of the route + query string. */
export function replaceLanguageInPath(currentPath: string, nextLang: SupportedLanguage): string {
  const segments = currentPath.split('/').filter(Boolean);
  segments[0] = nextLang;
  return `/${segments.join('/')}`;
}

export const ROUTES = {
  home: (lang: string) => localizedPath(lang, '/'),
  products: (lang: string) => localizedPath(lang, '/products'),
  product: (lang: string, slug: string) => localizedPath(lang, `/products/${slug}`),
  collections: (lang: string) => localizedPath(lang, '/collections'),
  collection: (lang: string, slug: string) => localizedPath(lang, `/collections/${slug}`),
  colors: (lang: string) => localizedPath(lang, '/colors'),
  color: (lang: string, slug: string) => localizedPath(lang, `/colors/${slug}`),
  projects: (lang: string) => localizedPath(lang, '/projects'),
  craftsmanship: (lang: string) => localizedPath(lang, '/craftsmanship'),
  ourCraft: (lang: string) => localizedPath(lang, '/our-craft'),
  professionals: (lang: string) => localizedPath(lang, '/professionals'),
  about: (lang: string) => localizedPath(lang, '/about'),
  catalogs: (lang: string) => localizedPath(lang, '/catalogs'),
  contact: (lang: string) => localizedPath(lang, '/contact'),
  requestQuote: (lang: string) => localizedPath(lang, '/request-quote'),
  simulator: (lang: string) => localizedPath(lang, '/simulator'),
  cementTiles: (lang: string) => localizedPath(lang, '/cement-tiles'),
  cementPatterns: (lang: string) => localizedPath(lang, '/cement-tiles/patterns'),
  cementColors: (lang: string) => localizedPath(lang, '/cement-tiles/colors'),
  cementFormats: (lang: string) => localizedPath(lang, '/cement-tiles/formats'),
  cementSimulator: (lang: string) => localizedPath(lang, '/cement-tiles/simulator'),
  formats: (lang: string) => localizedPath(lang, '/formats'),
  zellige: (lang: string) => localizedPath(lang, '/zellige'),
  zelligeColors: (lang: string) => localizedPath(lang, '/zellige/colors'),
  zelligeFormats: (lang: string) => localizedPath(lang, '/zellige/formats'),
  bjmat: (lang: string) => localizedPath(lang, '/bjmat'),
  bjmatColors: (lang: string) => localizedPath(lang, '/bjmat/colors'),
  bjmatFormats: (lang: string) => localizedPath(lang, '/bjmat/formats'),
  bjmatLayouts: (lang: string) => localizedPath(lang, '/bjmat/layouts'),
  adminImport: () => '/admin/import/catalog',
  adminColors: () => '/admin/catalog/colors',
  adminPatterns: () => '/admin/patterns',
  adminMoulds: () => '/admin/cement-moulds',
  adminMouldReview: () => '/admin/mould-review',
} as const;

export const FALLBACK_LANG: SupportedLanguage = DEFAULT_LANGUAGE;
