import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Button } from '@/components/ui/Button';
import { AboutHeroSlider } from '@/components/about/AboutHeroSlider';

const CATALOGS = [
  {
    id: 'cement',
    href: '/catalogs/mtart-cement-tiles.pdf',
    fileName: 'mtart-cement-tiles.pdf',
    nameKey: 'aboutPage.catalog.cementName',
  },
] as const;

export function AboutPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [previewHref, setPreviewHref] = useState<string | null>(null);
  const previewCatalog = CATALOGS.find((item) => item.href === previewHref);

  return (
    <>
      <PageMeta title={t('aboutPage.title')} description={t('aboutPage.subtitle')} lang={lang} path="/about" />

      <Box sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 5, md: 7 } }}>
        <AboutHeroSlider />

        <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 5 } }}>
          <Stack spacing={{ xs: 5, md: 6 }}>
            <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                  {t('aboutPage.title')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: { xs: '0.95rem', md: '1rem' } }}>
                  {t('aboutPage.subtitle')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
                  {t('aboutPage.intro')}
                </Typography>
                <Typography variant="h2" sx={{ mt: 3, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                  {t('aboutPage.heritage.heading')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                  {t('aboutPage.heritage.body')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: { md: 560 },
                    height: { xs: 240, sm: 300, md: 360 },
                    mx: { md: 'auto' },
                  }}
                >
                  <ResponsiveImage
                    src="/images/home/about-heritage.jpg"
                    alt={t('aboutPage.heritage.heading')}
                    className="h-full w-full"
                  />
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
              <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 1 } }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: { md: 560 },
                    height: { xs: 240, sm: 300, md: 400 },
                    mx: { md: 'auto' },
                  }}
                >
                  <ResponsiveImage
                    src="/images/home/about-factory.jpg"
                    alt={t('aboutPage.factory.heading')}
                    className="h-full w-full"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 2 } }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
                  {t('aboutPage.factory.heading')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
                  {t('aboutPage.factory.body')}
                </Typography>
                <Typography variant="h3" sx={{ mt: 3, fontSize: { xs: '1.15rem', md: '1.35rem' } }}>
                  {t('aboutPage.export.heading')}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                  {t('aboutPage.export.body')}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: { xs: 4, md: 5 } }}>
              <Typography variant="overline" color="text.secondary">
                {t('aboutPage.catalog.heading')}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 520 }}>
                {t('aboutPage.catalog.body')}
              </Typography>
              <Grid container spacing={2}>
                {CATALOGS.map((catalog) => (
                  <Grid key={catalog.id} size={{ xs: 12, sm: 6, md: 5 }}>
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
                      <Typography sx={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: '1.15rem' }}>
                        {t(catalog.nameKey)}
                      </Typography>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        sx={{ mt: 2 }}
                      >
                        <Button className="w-full sm:w-auto" onClick={() => setPreviewHref(catalog.href)}>
                          {t('aboutPage.catalog.preview')}
                        </Button>
                        <Button
                          className="w-full sm:w-auto"
                          href={catalog.href}
                          download={catalog.fileName}
                          variant="secondary"
                        >
                          {t('aboutPage.catalog.download')}
                        </Button>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Dialog
        open={Boolean(previewHref)}
        onClose={() => setPreviewHref(null)}
        maxWidth={false}
        fullScreen={false}
        aria-labelledby="about-catalog-preview-title"
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'calc(100vw - 24px)', md: '80vw' },
              height: { xs: '88vh', md: '85vh' },
              maxWidth: { xs: 'calc(100vw - 24px)', md: '80vw' },
              m: { xs: '12px', md: 2 },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle id="about-catalog-preview-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.5, fontFamily: 'ui-serif, Georgia, serif' }}>
          {previewCatalog ? t(previewCatalog.nameKey) : t('aboutPage.catalog.heading')}
          <IconButton onClick={() => setPreviewHref(null)} aria-label={t('aboutPage.catalog.close')} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {previewHref ? (
            <iframe
              title={previewCatalog ? t(previewCatalog.nameKey) : t('aboutPage.catalog.heading')}
              src={previewHref}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AboutPage;
