import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { factoryVideoSrc, HERO_POSTER_FALLBACK, HERO_VIDEO } from '@/features/craft/videos';
import { ROUTES } from '@/utils/paths';

export function Hero() {
  const { t } = useTranslation();
  const lang = useLang();
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [usePosterOnly, setUsePosterOnly] = useState(false);
  const poster = HERO_VIDEO.poster || HERO_POSTER_FALLBACK;

  useEffect(() => {
    if (reducedMotion) {
      setUsePosterOnly(true);
      return;
    }

    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const attempt = el.play();
    if (attempt) {
      void attempt.catch(() => setUsePosterOnly(true));
    }
  }, [reducedMotion]);

  return (
    <section className="relative flex h-[48vh] max-h-[65vh] w-full items-center overflow-hidden bg-cinema md:h-[60vh]">
      <div className="absolute inset-0">
        {usePosterOnly ? (
          <img src={poster} alt="" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            controls={false}
            disablePictureInPicture
            aria-hidden="true"
            onError={() => setUsePosterOnly(true)}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={factoryVideoSrc(HERO_VIDEO.file)} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 mtart-photo-scrim" aria-hidden="true" />
      </div>

      <div className="container-mtart relative z-10 text-cinema-fg">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cinema-fg/70">{t('home.hero.eyebrow')}</p>
        <h1 className="max-w-3xl font-display text-4xl leading-[1.1] text-balance md:text-6xl lg:text-7xl">
          {t('home.hero.title')}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-cinema-fg/85 md:text-xl">{t('home.hero.subtitle')}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button to={ROUTES.collections(lang)} variant="on-photo" size="lg">
            {t('home.hero.ctaPrimary')}
          </Button>
          <Button to={ROUTES.requestQuote(lang)} variant="primary" size="lg" className="bg-cinema-fg text-cinema hover:opacity-90">
            {t('home.hero.ctaSecondary')}
          </Button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-cinema-fg/70">
        <span className="text-[11px] uppercase tracking-[0.2em]">{t('home.hero.scrollHint')}</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </section>
  );
}
