import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';

export function NotFoundPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title={t('notFound.title')} lang={lang} />

      <div className="container-mtart flex flex-col items-center gap-6 py-32 pt-40 text-center">
        <span className="font-display text-6xl text-charcoal/15">404</span>
        <h1 className="max-w-lg font-display text-2xl text-charcoal md:text-3xl">{t('notFound.title')}</h1>
        <p className="max-w-md text-sm text-charcoal-soft/75">{t('notFound.body')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <Button to={`${ROUTES.products(lang)}?category=zellige`} variant="secondary">
            {t('notFound.exploreZellige')}
          </Button>
          <Button to={`${ROUTES.products(lang)}?category=cement-tiles`} variant="secondary">
            {t('notFound.exploreCement')}
          </Button>
          <Button to={ROUTES.home(lang)}>{t('notFound.backHome')}</Button>
        </div>
      </div>
    </>
  );
}

export default NotFoundPage;
