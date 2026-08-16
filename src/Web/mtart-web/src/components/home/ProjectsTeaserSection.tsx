import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Section, SectionHeading } from '@/components/ui/Section';
import { MasonryGallery } from '@/components/gallery/MasonryGallery';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

const CATEGORIES = ['kitchen', 'bathroom', 'hotel', 'restaurant', 'pool', 'residential', 'commercial'] as const;

const GALLERY_ITEMS = [
  { id: '1', ratio: '3/4' },
  { id: '2', ratio: '4/5' },
  { id: '3', ratio: '1/1' },
  { id: '4', ratio: '3/4' },
  { id: '5', ratio: '4/3' },
  { id: '6', ratio: '1/1' },
];

export function ProjectsTeaserSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <Section tone="ivory">
      <SectionHeading eyebrow={t('nav.projects')} title={t('home.projects.heading')} subtitle={t('home.projects.subheading')} />

      <div className="mb-10 flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className="border border-charcoal/15 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-charcoal-soft/80"
          >
            {t(`home.projects.${category}`)}
          </span>
        ))}
      </div>

      <MasonryGallery
        items={GALLERY_ITEMS.map((item) => ({
          id: item.id,
          label: t('nav.projects'),
          aspectRatio: item.ratio,
          src: `/images/projects/project-${item.id.padStart(2, '0')}.jpg`,
        }))}
      />

      <div className="mt-10 text-center">
        <Link to={ROUTES.projects(lang)} className="text-sm font-medium text-charcoal hover:underline">
          {t('home.projects.viewAll')} →
        </Link>
      </div>
    </Section>
  );
}
