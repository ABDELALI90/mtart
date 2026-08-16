import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { Hero } from '@/components/home/Hero';
import { ProductFamilies } from '@/components/home/ProductFamilies';
import { CraftsmanshipSection } from '@/components/home/CraftsmanshipSection';
import { FeaturedCollectionsSection } from '@/components/home/FeaturedCollectionsSection';
import { ColorStorySection } from '@/components/home/ColorStorySection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { ProjectsTeaserSection } from '@/components/home/ProjectsTeaserSection';
import { MadeInMoroccoSection } from '@/components/home/MadeInMoroccoSection';
import { ProfessionalsSection } from '@/components/home/ProfessionalsSection';
import { CatalogCtaSection } from '@/components/home/CatalogCtaSection';
import { OurCraftPreviewSection } from '@/components/home/OurCraftPreviewSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { BjmatHomeSection } from '@/components/home/BjmatHomeSection';

export function HomePage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta title="MT ART" description={t('home.hero.subtitle')} lang={lang} path="/" />
      <Hero />
      <ProductFamilies />
      <BjmatHomeSection />
      <CraftsmanshipSection />
      <FeaturedCollectionsSection />
      <ColorStorySection />
      <FeaturedProductsSection />
      <ProjectsTeaserSection />
      <MadeInMoroccoSection />
      <OurCraftPreviewSection />
      <ProfessionalsSection />
      <CatalogCtaSection />
      <FinalCtaSection />
    </>
  );
}

export default HomePage;
