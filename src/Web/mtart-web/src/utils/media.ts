/**
 * Turns Catalog API image paths into URLs the Vite app can actually load.
 * Database values look like `/images/catalog/p009.png` or `/images/bjmat/bjmat-001.jpg`.
 * Those files live under `public/images/` (and import folders served by the Vite plugin).
 * Do not rewrite to `/images/catalog/web/` — that folder is not populated in this repo.
 */
export function catalogImageUrl(url?: string | null, _options?: { cropped?: boolean }): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null') {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/images/catalog/web/')) {
    return trimmed.replace('/images/catalog/web/', '/images/catalog/');
  }

  return trimmed;
}

export function looksLikeAssetPath(label?: string | null): boolean {
  if (!label) {
    return false;
  }

  return /public[/\\]|images[/\\]|\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(label);
}
