import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function BjmatHomeSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <section className="grid min-h-[70vh] grid-cols-1 md:grid-cols-2">
      <ResponsiveImage src="/images/home/bjmat-hero.jpg" alt={t('bjmat.title')} className="h-full min-h-[50vh] w-full" />
      <div className="flex flex-col justify-center bg-ivory-dark px-8 py-16 md:px-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal-soft">MT ART</p>
        <h2 className="mt-3 font-display text-3xl text-charcoal md:text-5xl">{t('bjmat.title')}</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal-soft/80 md:text-base">{t('bjmat.homeBody')}</p>
        <p className="mt-4 text-sm text-charcoal-soft/70">15 × 5 · 20 × 5 · 20 × 10</p>
        <div className="mt-8">
          <Button to={ROUTES.bjmat(lang)} size="lg">{t('bjmat.explore')}</Button>
        </div>
        <Link to={ROUTES.bjmatFormats(lang)} className="mt-4 text-xs uppercase tracking-[0.14em] text-charcoal hover:underline">
          {t('megaMenu.formats')}
        </Link>
      </div>
    </section>
  );
}
