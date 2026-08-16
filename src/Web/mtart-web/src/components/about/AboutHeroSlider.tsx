import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const SLIDES = [
  { src: '/images/home/about-hero.jpg', altKey: 'aboutPage.title' },
  { src: '/images/home/about-factory.jpg', altKey: 'aboutPage.factory.heading' },
  { src: '/images/home/about-heritage.jpg', altKey: 'aboutPage.heritage.heading' },
  { src: '/images/home/craftsmanship.jpg', altKey: 'aboutPage.factory.heading' },
  { src: '/images/home/morocco.jpg', altKey: 'aboutPage.title' },
  { src: '/images/home/hero.jpg', altKey: 'aboutPage.title' },
] as const;

export function AboutHeroSlider() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', duration: 22, direction: rtl ? 'rtl' : 'ltr' },
    [Autoplay({ delay: 4500, stopOnMouseEnter: true, stopOnInteraction: false })],
  );
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, rtl]);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative h-[250px] w-full overflow-hidden sm:h-[340px] md:h-[420px] lg:h-[440px]">
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {SLIDES.map((slide, index) => (
              <div key={slide.src} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={slide.src}
                  alt={t(slide.altKey)}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label={t('aboutPage.slider.previous')}
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cinema/55 text-cinema-fg backdrop-blur-sm transition hover:bg-cinema/75 md:left-5 md:h-11 md:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={t('aboutPage.slider.next')}
          onClick={() => emblaApi?.scrollNext()}
          className="absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cinema/55 text-cinema-fg backdrop-blur-sm transition hover:bg-cinema/75 md:right-5 md:h-11 md:w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={t('aboutPage.slider.goTo', { index: index + 1 })}
              aria-current={selected === index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={clsx(
                'h-2 rounded-full transition-all',
                selected === index ? 'w-6 bg-ivory' : 'w-2 bg-ivory/50 hover:bg-ivory/80',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
