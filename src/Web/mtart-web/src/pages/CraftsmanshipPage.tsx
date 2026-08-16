import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';

const STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function CraftsmanshipPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title={t('craftsmanshipPage.title')} description={t('craftsmanshipPage.subtitle')} lang={lang} path="/craftsmanship" />

      <div className="relative flex min-h-[420px] items-end overflow-hidden bg-cinema pt-24">
        <ResponsiveImage src="/images/home/craftsmanship.jpg" alt="" className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 mtart-photo-scrim" aria-hidden="true" />
        <div className="container-mtart relative z-10 pb-14 text-cinema-fg">
          <h1 className="font-display text-3xl md:text-5xl">{t('craftsmanshipPage.title')}</h1>
          <p className="mt-3 max-w-xl text-base text-cinema-fg/85">{t('craftsmanshipPage.subtitle')}</p>
        </div>
      </div>

      <div className="container-mtart py-14 md:py-20">
        <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step} className="border-t border-charcoal/10 pt-6">
              <span className="font-display text-3xl text-charcoal-soft">{step.padStart(2, '0')}</span>
              <h2 className="mt-3 font-display text-xl text-charcoal">{t(`craftsmanshipPage.steps.${step}.title`)}</h2>
              <p className="mt-2 text-sm text-charcoal-soft/80">{t(`craftsmanshipPage.steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 text-center">
          <Button to={ROUTES.requestQuote(lang)} size="lg">
            {t('craftsmanshipPage.cta')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default CraftsmanshipPage;
