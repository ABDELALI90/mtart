import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';

export function CatalogsPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title={t('catalogsPage.title')} description={t('catalogsPage.subtitle')} lang={lang} path="/catalogs" />
      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('catalogsPage.title')}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t('catalogsPage.subtitle')}</p>
        </div>
      </div>
      <div className="container-mtart py-14 md:py-20">
        <article className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <ResponsiveImage src="/images/home/catalog.jpg" alt={t('catalogsPage.cement')} aspectRatio="4/5" />
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal-soft">207 {t('catalogsPage.pages')}</p>
            <h2 className="mt-3 font-display text-3xl">{t('catalogsPage.cement')}</h2>
            <p className="mt-4 text-charcoal-soft/80">{t('catalogsPage.cementBody')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/catalogs/mtart-cement-tiles.pdf" target="_blank" rel="noreferrer">{t('catalogsPage.preview')}</Button>
              <Button href="/catalogs/mtart-cement-tiles.pdf" download variant="secondary">{t('catalogsPage.download')}</Button>
              <Button to={`${ROUTES.products(lang)}?category=cement-tiles`} variant="ghost">{t('catalogsPage.browse')}</Button>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

export default CatalogsPage;
