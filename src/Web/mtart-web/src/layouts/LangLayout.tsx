import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import i18next, { DEFAULT_LANGUAGE, isRtl, isSupportedLanguage } from '@/i18n';
import { SiteLayout } from '@/components/layout/SiteLayout';

/**
 * Validates the `:lang` URL segment (redirecting to the default language if unsupported),
 * keeps i18next and <html lang/dir> in sync with the URL, then renders the shared site shell.
 * The URL is always the single source of truth for the active language - see src/i18n/index.ts.
 */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const supported = isSupportedLanguage(lang);

  useEffect(() => {
    if (!supported || !lang) return;
    void i18next.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang, supported]);

  if (!supported) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  return <SiteLayout />;
}
