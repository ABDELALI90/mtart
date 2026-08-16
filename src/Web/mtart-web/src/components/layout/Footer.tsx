import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinkMui from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

const SITE_CONFIG = {
  phone: '+212 5XX-XXXXXX',
  whatsapp: '+212 6XX-XXXXXX',
  email: 'contact@mtart.example',
  instagram: 'https://instagram.com/mtart',
  facebook: 'https://facebook.com/mtart',
  pinterest: 'https://pinterest.com/mtart',
  linkedin: 'https://linkedin.com/company/mtart',
} as const;

const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: 'Instagram', href: SITE_CONFIG.instagram },
  { label: 'Facebook', href: SITE_CONFIG.facebook },
  { label: 'Pinterest', href: SITE_CONFIG.pinterest },
  { label: 'LinkedIn', href: SITE_CONFIG.linkedin },
];

export function Footer() {
  const { t } = useTranslation();
  const lang = useLang();

  const productLinks = [
    { label: t('megaMenu.zellige'), to: `${ROUTES.products(lang)}?category=zellige` },
    { label: t('megaMenu.bejmat'), to: ROUTES.bjmat(lang) },
    { label: t('megaMenu.cementTiles'), to: ROUTES.cementTiles(lang) },
    { label: t('nav.simulator'), to: ROUTES.simulator(lang) },
    { label: t('megaMenu.terracotta'), to: `${ROUTES.products(lang)}?category=terracotta` },
    { label: t('nav.collections'), to: ROUTES.collections(lang) },
    { label: t('nav.colors'), to: ROUTES.colors(lang) },
  ];

  const companyLinks = [
    { label: t('footer.about'), to: ROUTES.about(lang) },
    { label: t('footer.craftsmanship'), to: ROUTES.craftsmanship(lang) },
    { label: t('footer.projects'), to: ROUTES.projects(lang) },
    { label: t('footer.contact'), to: ROUTES.contact(lang) },
  ];

  const professionalLinks = [
    { label: t('footer.architects'), to: ROUTES.professionals(lang) },
    { label: t('footer.designers'), to: ROUTES.professionals(lang) },
    { label: t('footer.customProjects'), to: ROUTES.requestQuote(lang) },
    { label: t('footer.requestSamples'), to: ROUTES.requestQuote(lang) },
  ];

  const supportLinks = [
    { label: t('footer.catalog'), to: ROUTES.catalogs(lang) },
    { label: t('footer.faq'), to: ROUTES.contact(lang) },
    { label: t('footer.shipping'), to: ROUTES.contact(lang) },
    { label: t('footer.maintenance'), to: ROUTES.craftsmanship(lang) },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              component={Link}
              to={ROUTES.home(lang)}
              sx={{
                fontFamily: 'ui-serif, Georgia, serif',
                fontSize: '1.5rem',
                letterSpacing: '0.08em',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              MT ART
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, maxWidth: 280, opacity: 0.72 }}>
              {t('footer.madeIn')}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, mt: 3 }}>
              {SOCIAL_LINKS.map((social) => (
                <LinkMui
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  color="inherit"
                  underline="hover"
                  sx={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.72 }}
                >
                  {social.label}
                </LinkMui>
              ))}
            </Stack>
          </Grid>
          <FooterColumn heading={t('footer.productsHeading')} links={productLinks} />
          <FooterColumn heading={t('footer.companyHeading')} links={companyLinks} />
          <FooterColumn heading={t('footer.professionalsHeading')} links={professionalLinks} />
          <FooterColumn heading={t('footer.supportHeading')} links={supportLinks} />
        </Grid>
      </Container>
      <Divider sx={{ borderColor: 'currentcolor', opacity: 0.12 }} />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="caption" sx={{ opacity: 0.55, display: 'block' }}>
          © {new Date().getFullYear()} MT ART. {t('footer.rights')}
        </Typography>
      </Container>
    </Box>
  );
}

function FooterColumn({ heading, links }: { heading: string; links: { label: string; to: string }[] }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <Typography variant="overline" sx={{ display: 'block', mb: 2, opacity: 0.55 }}>
        {heading}
      </Typography>
      <Stack spacing={1.2}>
        {links.map((link) => (
          <LinkMui
            key={link.label}
            component={Link}
            to={link.to}
            color="inherit"
            underline="hover"
            sx={{ fontSize: 14, opacity: 0.85 }}
          >
            {link.label}
          </LinkMui>
        ))}
      </Stack>
    </Grid>
  );
}
