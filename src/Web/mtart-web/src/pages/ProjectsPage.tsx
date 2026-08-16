import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { MasonryGallery } from '@/components/gallery/MasonryGallery';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/utils/paths';

const CATEGORIES = ['kitchen', 'bathroom', 'hotel', 'restaurant', 'pool', 'residential', 'commercial'] as const;

const GALLERY_ITEMS = [
  { id: '1', ratio: '3/4' }, { id: '2', ratio: '1/1' }, { id: '3', ratio: '4/5' },
  { id: '4', ratio: '4/3' }, { id: '5', ratio: '1/1' }, { id: '6', ratio: '3/4' },
  { id: '7', ratio: '4/5' }, { id: '8', ratio: '1/1' }, { id: '9', ratio: '4/3' },
];

export function ProjectsPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title={t('projectsPage.title')} description={t('projectsPage.subtitle')} lang={lang} path="/projects" />

      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('projectsPage.title')}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t('projectsPage.subtitle')}</p>
        </div>
      </div>

      <div className="container-mtart py-14 md:py-20">
        <div className="mb-10 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <span key={category} className="border border-charcoal/15 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-charcoal-soft/80">
              {t(`home.projects.${category}`)}
            </span>
          ))}
        </div>

        <MasonryGallery
          items={GALLERY_ITEMS.map((item) => ({
            id: item.id,
            label: t('projectsPage.title'),
            aspectRatio: item.ratio,
            src: `/images/projects/project-${item.id.padStart(2, '0')}.jpg`,
          }))}
        />

        <div className="mt-14 border-t border-charcoal/10 pt-10 text-center">
          <p className="mx-auto max-w-md text-sm text-charcoal-soft/80">{t('projectsPage.comingSoon')}</p>
          <Button to={ROUTES.contact(lang)} variant="secondary" className="mt-6">
            {t('nav.contact')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default ProjectsPage;
