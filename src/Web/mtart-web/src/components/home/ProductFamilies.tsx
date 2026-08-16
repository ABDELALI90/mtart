import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

const FAMILY_IMAGES: Record<string, string> = {
  zellige: '/images/home/zellige.jpg',
  bejmat: '/images/home/bejmat.jpg',
  'cement-tiles': '/images/home/cement.jpg',
  terracotta: '/images/home/terracotta.jpg',
};

const FAMILIES = [
  { slug: 'zellige', key: 'zellige' },
  { slug: 'bejmat', key: 'bejmat' },
  { slug: 'cement-tiles', key: 'cement' },
  { slug: 'terracotta', key: 'terracotta' },
] as const;

export function ProductFamilies() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <Section tone="ivory">
      <SectionHeading
        eyebrow="MT ART"
        title={t('home.families.heading')}
        subtitle={t('home.families.subheading')}
      />

      <div className="grid grid-cols-1 gap-px bg-charcoal/10 sm:grid-cols-2">
        {FAMILIES.map((family) => (
          <Link
            key={family.slug}
            to={family.slug === 'bejmat' ? ROUTES.bjmat(lang) : family.slug === 'cement-tiles' ? ROUTES.cementTiles(lang) : `${ROUTES.products(lang)}?category=${family.slug}`}
            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-ivory p-8 md:aspect-[16/11]"
          >
            <ResponsiveImage
              src={FAMILY_IMAGES[family.slug]}
              alt={t(`home.families.${family.key}`)}
              className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 mtart-photo-scrim" aria-hidden="true" />
            <div className="relative z-10 text-cinema-fg">
              <h3 className="font-display text-2xl md:text-3xl">{t(`home.families.${family.key}`)}</h3>
              <p className="mt-2 max-w-xs text-sm text-cinema-fg/80">{t(`home.families.${family.key}Description`)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-cinema-fg">
                {t('home.families.cta')}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
