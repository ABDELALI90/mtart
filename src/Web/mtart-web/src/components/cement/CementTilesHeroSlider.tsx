import { useCallback, useEffect, useState, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const SLIDES = [
  { src: '/images/home/cement.jpg', alt: 'MT ART cement tiles' },
  { src: '/images/catalog/p009-i1.jpeg', alt: 'Patterned cement tile CAT-P009' },
  { src: '/images/catalog/p021-i1.jpeg', alt: 'Patterned cement tile CAT-P021' },
  { src: '/images/catalog/p024-i1.jpeg', alt: 'Patterned cement tile CAT-P024' },
  { src: '/images/catalog/p033-i1.jpeg', alt: 'Patterned cement tile CAT-P033' },
  { src: '/images/catalog/p035-i1.jpeg', alt: 'Patterned cement tile CAT-P035' },
  { src: '/images/catalog/p060-i1.jpeg', alt: 'Patterned cement tile CAT-P060' },
  { src: '/images/catalog/p085-i1.jpeg', alt: 'Patterned cement tile CAT-P085' },
  { src: '/images/catalog/p156-i1.jpeg', alt: 'Patterned cement tile CAT-P156' },
  { src: '/images/catalog/p069-i1.jpeg', alt: 'Cement tile project CAT-P069' },
] as const;

export function CementTilesHeroSlider({ children }: { children?: ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', duration: 22 }, [
    Autoplay({ delay: 4500, stopOnMouseEnter: true, stopOnInteraction: false }),
  ]);
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

  return (
    <div className="w-full overflow-hidden">
      <div className="relative h-[48vh] max-h-[60vh] w-full overflow-hidden md:h-[55vh] lg:h-[60vh]">
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {SLIDES.map((slide, index) => (
              <div key={slide.src} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={slide.src}
                  alt={slide.alt}
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

        {children}

        <button
          type="button"
          aria-label="Previous image"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cinema/55 text-cinema-fg backdrop-blur-sm transition hover:bg-cinema/75 md:left-6 md:h-12 md:w-12"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cinema/55 text-cinema-fg backdrop-blur-sm transition hover:bg-cinema/75 md:right-6 md:h-12 md:w-12"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      <div className="flex justify-center gap-2 bg-ivory py-4">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={selected === index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={clsx(
              'h-2 rounded-full transition-all',
              selected === index ? 'w-6 bg-charcoal' : 'w-2 bg-charcoal/30 hover:bg-charcoal/55',
            )}
          />
        ))}
      </div>
    </div>
  );
}
