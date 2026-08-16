import { useTranslation } from 'react-i18next';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function CraftsmanshipSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <ResponsiveImage
        src="/images/home/craftsmanship.jpg"
        alt={t('home.craftsmanship.heading')}
        className="h-[420px] md:h-full"
      />
      <div className="flex flex-col items-start justify-center bg-ivory-dark px-8 py-16 md:px-16 md:py-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-soft">
          {t('craftsmanshipPage.title')}
        </p>
        <h2 className="font-display text-3xl leading-tight text-charcoal md:text-4xl">
          {t('home.craftsmanship.heading')}
        </h2>
        <p className="mt-5 max-w-md text-base text-charcoal-soft/85">{t('home.craftsmanship.body')}</p>
        <Button to={ROUTES.craftsmanship(lang)} variant="secondary" className="mt-8">
          {t('home.craftsmanship.cta')}
        </Button>
      </div>
    </section>
  );
}
