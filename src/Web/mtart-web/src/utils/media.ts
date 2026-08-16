/**
 * Turns Catalog API image paths into URLs the Vite app can actually load.
 * Database values look like `/images/catalog/p009.png` or `/images/bjmat/bjmat-001.jpg`.
 * Full-page catalog photos are stored as optimized WebP; `{ cropped: true }` selects the card thumb.
 * Do not rewrite to `/images/catalog/web/` — that generated folder is not used.
 */
export function catalogImageUrl(url?: string | null, options?: { cropped?: boolean }): string | null {
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

  let resolved = trimmed.startsWith('/images/catalog/web/')
    ? trimmed.replace('/images/catalog/web/', '/images/catalog/')
    : trimmed;

  // Full catalog pages (p001.png) — not motif crops like p001-i1.jpeg.
  resolved = resolved.replace(/\/images\/catalog\/(p\d+)\.(png|jpe?g)$/i, '/images/catalog/$1.webp');

  if (options?.cropped) {
    resolved = resolved.replace(/\/images\/catalog\/(p\d+)\.(webp|png|jpe?g)$/i, '/images/catalog/$1-thumb.webp');
  }

  return resolved;
}

export function looksLikeAssetPath(label?: string | null): boolean {
  if (!label) {
    return false;
  }

  return /public[/\\]|images[/\\]|\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(label);
}
