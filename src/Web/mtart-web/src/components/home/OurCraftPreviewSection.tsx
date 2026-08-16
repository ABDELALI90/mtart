import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { LazyFactoryVideo } from '@/components/media/LazyFactoryVideo';
import { CRAFT_PREVIEW_VIDEOS } from '@/features/craft/videos';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

export function OurCraftPreviewSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <section className="bg-ivory py-12 md:py-16">
      <div className="container-mtart">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-soft">
          {t('home.ourCraft.eyebrow')}
        </p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-charcoal md:text-3xl">
            {t('home.ourCraft.title')}
          </h2>
          <Button to={ROUTES.ourCraft(lang)} variant="secondary">
            {t('home.ourCraft.cta')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CRAFT_PREVIEW_VIDEOS.map((video, index) => (
            <LazyFactoryVideo
              key={video.id}
              video={video}
              title={t(`ourCraftPage.steps.${index === 0 ? '2' : index === 1 ? '3' : '7'}.title`)}
              variant="preview"
              controls={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
