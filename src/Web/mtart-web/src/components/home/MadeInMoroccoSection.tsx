import { useTranslation } from 'react-i18next';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export function MadeInMoroccoSection() {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden bg-cinema">
      <ResponsiveImage
        src="/images/home/morocco.jpg"
        alt={t('home.madeInMorocco.heading')}
        className="absolute inset-0 h-full w-full opacity-60"
      />
      <div className="absolute inset-0 mtart-photo-scrim" aria-hidden="true" />
      <div className="container-mtart relative z-10 max-w-xl py-24 text-cinema-fg">
        <h2 className="font-display text-3xl leading-tight md:text-4xl">{t('home.madeInMorocco.heading')}</h2>
        <p className="mt-5 text-base text-cinema-fg/85 md:text-lg">{t('home.madeInMorocco.body')}</p>
      </div>
    </section>
  );
}
