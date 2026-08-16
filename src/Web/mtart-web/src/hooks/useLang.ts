import { useParams } from 'react-router-dom';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '@/i18n';

/** Reads the `:lang` route param, always returning a valid supported language. */
export function useLang(): SupportedLanguage {
  const { lang } = useParams<{ lang: string }>();
  return isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
}
