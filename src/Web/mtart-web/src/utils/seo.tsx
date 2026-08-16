import { Helmet } from 'react-helmet-async';
import { SUPPORTED_LANGUAGES, isRtl } from '@/i18n';

interface PageMetaProps {
  title: string;
  description?: string;
  lang: string;
  /** Path without language prefix, e.g. "/products" - used to build hreflang alternates. */
  path?: string;
}

const SITE_NAME = 'MT ART';
const SITE_ORIGIN = 'https://www.mtart.example';

/**
 * Per-route SEO metadata: title, description, html lang/dir, and hreflang alternates for every
 * supported language pointing at the same logical page. Canonical/OG tags prepare the ground for
 * a future prerendering step (see docs/seo.md) without blocking this Vite SPA phase.
 */
export function PageMeta({ title, description, lang, path = '' }: PageMetaProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
  const canonical = `${SITE_ORIGIN}/${lang}${path}`;

  return (
    <Helmet htmlAttributes={{ lang, dir: isRtl(lang) ? 'rtl' : 'ltr' }}>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <link rel="canonical" href={canonical} />
      {SUPPORTED_LANGUAGES.map((code) => (
        <link key={code} rel="alternate" hrefLang={code} href={`${SITE_ORIGIN}/${code}${path}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_ORIGIN}/en${path}`} />
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
