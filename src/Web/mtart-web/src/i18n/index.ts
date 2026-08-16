import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const RTL_LANGUAGES: readonly SupportedLanguage[] = ['ar'];

export function isSupportedLanguage(value: string | undefined): value is SupportedLanguage {
  return Boolean(value) && (SUPPORTED_LANGUAGES as readonly string[]).includes(value as string);
}

export function isRtl(language: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(language);
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
};

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    ar: { translation: ar },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
  // The URL (/:lang/...) is the single source of truth for the active language -
  // see LangLayout, which calls i18next.changeLanguage() on route match. No browser
  // language detector/cache is used, so navigating between /en, /fr, /es, /ar always
  // reflects exactly what's in the URL.
  detection: undefined,
});

export default i18next;
