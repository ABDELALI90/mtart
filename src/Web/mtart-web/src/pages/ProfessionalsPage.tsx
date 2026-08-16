import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';

const AUDIENCES = ['architects', 'designers', 'developers', 'hotels', 'restaurants', 'distributors', 'importers', 'retailers', 'contractors'] as const;
const OFFER = ['technicalSheets', 'samples', 'catalogs', 'quotation', 'customProduction', 'exportLogistics', 'support'] as const;

export function ProfessionalsPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title={t('professionalsPage.title')} description={t('professionalsPage.subtitle')} lang={lang} path="/professionals" />

      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('professionalsPage.title')}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t('professionalsPage.subtitle')}</p>
        </div>
      </div>

      <div className="container-mtart py-14 md:py-20">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
          {AUDIENCES.map((audience) => (
            <div key={audience} className="border-t border-charcoal/10 pt-4 text-sm font-medium text-charcoal-soft">
              {t(`professionalsPage.audiences.${audience}`)}
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-charcoal/10 pt-14">
          <h2 className="mb-8 font-display text-2xl text-charcoal">{t('professionalsPage.offer.heading')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {OFFER.map((item) => (
              <div key={item} className="border border-charcoal/10 px-5 py-4 text-sm text-charcoal-soft">
                {t(`professionalsPage.offer.${item}`)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button to={ROUTES.requestQuote(lang)} size="lg">
            {t('professionalsPage.cta')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default ProfessionalsPage;
