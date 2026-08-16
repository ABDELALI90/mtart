import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function CatalogCtaSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <section className="relative overflow-hidden bg-petrol">
      <div className="container-mtart grid grid-cols-1 items-center gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="text-ivory">
          <h2 className="font-display text-3xl leading-tight md:text-4xl">{t('home.catalogCta.heading')}</h2>
          <p className="mt-5 max-w-md text-base text-ivory/85">{t('home.catalogCta.body')}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to={ROUTES.catalogs(lang)} variant="outline-light" size="lg">
              {t('home.catalogCta.viewCatalog')}
            </Button>
            <Button to={ROUTES.catalogs(lang)} variant="primary" size="lg" className="gap-2 bg-ivory text-charcoal hover:opacity-90">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('home.catalogCta.downloadPdf')}
            </Button>
          </div>
        </div>
        <ResponsiveImage
          src="/images/home/catalog.jpg"
          alt={t('home.catalogCta.heading')}
          aspectRatio="4/3"
        />
      </div>
    </section>
  );
}
