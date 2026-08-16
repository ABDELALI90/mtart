import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { LazyFactoryVideo } from '@/components/media/LazyFactoryVideo';
import { Button } from '@/components/ui/Button';
import { CRAFT_STEPS } from '@/features/craft/videos';
import { ROUTES } from '@/utils/paths';

export function OurCraftPage() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <>
      <PageMeta
        title={t('ourCraftPage.title')}
        description={t('ourCraftPage.subtitle')}
        lang={lang}
        path="/our-craft"
      />

      <Box sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="text.secondary">
            {t('nav.ourCraft')}
          </Typography>
          <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: '2rem', md: '3.25rem' } }}>
            {t('ourCraftPage.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 640, fontSize: { md: '1.125rem' } }}>
            {t('ourCraftPage.subtitle')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 720, lineHeight: 1.7 }}>
            {t('ourCraftPage.intro')}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Stack spacing={{ xs: 6, md: 10 }}>
          {CRAFT_STEPS.map(({ step, video }, index) => {
            const reverse = index % 2 === 1;
            return (
              <Stack
                key={step}
                direction={{ xs: 'column', md: reverse ? 'row-reverse' : 'row' }}
                spacing={{ xs: 3, md: 6 }}
                sx={{ alignItems: { md: 'center' } }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <LazyFactoryVideo
                    video={video}
                    title={t(`ourCraftPage.steps.${step}.title`)}
                    variant="story"
                    controls
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">
                    {String(index + 1).padStart(2, '0')}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    {t(`ourCraftPage.steps.${step}.title`)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.75 }}>
                    {t(`ourCraftPage.steps.${step}.body`)}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Box sx={{ mt: { xs: 8, md: 10 }, textAlign: 'center' }}>
          <Button to={ROUTES.requestQuote(lang)} size="lg">
            {t('ourCraftPage.cta')}
          </Button>
        </Box>
      </Container>
    </>
  );
}

export default OurCraftPage;
