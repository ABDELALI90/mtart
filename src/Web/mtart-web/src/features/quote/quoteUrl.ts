import { ROUTES } from '@/utils/paths';

export function requestQuoteHref(
  lang: string,
  product: { id: string; slug: string; reference: string },
  extra?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  params.set('productId', product.id);
  params.set('slug', product.slug);
  params.set('reference', product.reference);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) {
        params.set(key, value);
      }
    }
  }
  return `${ROUTES.requestQuote(lang)}?${params.toString()}`;
}
