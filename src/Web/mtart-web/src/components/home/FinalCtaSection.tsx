import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function FinalCtaSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <section className="bg-ivory-dark py-20 text-center md:py-28">
      <div className="container-mtart max-w-2xl">
        <h2 className="font-display text-3xl leading-tight text-charcoal md:text-4xl">{t('home.finalCta.heading')}</h2>
        <p className="mt-5 text-base text-charcoal-soft/85 md:text-lg">{t('home.finalCta.body')}</p>
        <Button to={ROUTES.requestQuote(lang)} size="lg" className="mt-8">
          {t('home.finalCta.cta')}
        </Button>
      </div>
    </section>
  );
}
