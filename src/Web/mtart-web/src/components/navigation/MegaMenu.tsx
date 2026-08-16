import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import LinkMui from '@mui/material/Link';
import Box from '@mui/material/Box';
import { ROUTES } from '@/utils/paths';

interface MegaMenuProps {
  lang: string;
  onNavigate: () => void;
}

export function MegaMenu({ lang, onNavigate }: MegaMenuProps) {
  const { t } = useTranslation();

  const columns: {
    titleKey: string;
    href: string;
    items: { key: string; href: string }[];
  }[] = [
    {
      titleKey: 'megaMenu.zellige',
      href: `${ROUTES.products(lang)}?category=zellige`,
      items: [
        { key: 'megaMenu.colors', href: ROUTES.zelligeColors(lang) },
        { key: 'megaMenu.formats', href: ROUTES.zelligeFormats(lang) },
        { key: 'megaMenu.collections', href: ROUTES.collections(lang) },
        { key: 'megaMenu.projects', href: ROUTES.projects(lang) },
      ],
    },
    {
      titleKey: 'megaMenu.bejmat',
      href: ROUTES.bjmat(lang),
      items: [
        { key: 'megaMenu.colors', href: ROUTES.bjmatColors(lang) },
        { key: 'megaMenu.formats', href: ROUTES.bjmatFormats(lang) },
        { key: 'megaMenu.productsItem', href: `${ROUTES.products(lang)}?category=bejmat` },
        { key: 'megaMenu.projects', href: ROUTES.projects(lang) },
      ],
    },
    {
      titleKey: 'megaMenu.cementTiles',
      href: ROUTES.cementTiles(lang),
      items: [
        { key: 'megaMenu.models', href: `${ROUTES.products(lang)}?category=cement-tiles` },
        { key: 'megaMenu.simulator', href: ROUTES.cementSimulator(lang) },
        { key: 'megaMenu.colors', href: ROUTES.cementColors(lang) },
        { key: 'megaMenu.formats', href: ROUTES.cementFormats(lang) },
        { key: 'megaMenu.stock', href: `${ROUTES.products(lang)}?category=cement-tiles&inStock=true` },
        { key: 'megaMenu.projects', href: ROUTES.projects(lang) },
      ],
    },
    {
      titleKey: 'megaMenu.terracotta',
      href: `${ROUTES.products(lang)}?category=terracotta`,
      items: [
        { key: 'megaMenu.square', href: `${ROUTES.products(lang)}?category=terracotta&q=square` },
        { key: 'megaMenu.rectangle', href: `${ROUTES.products(lang)}?category=terracotta&q=rectangle` },
        { key: 'megaMenu.projects', href: ROUTES.projects(lang) },
      ],
    },
  ];

  return (
    <Paper
      id="products-mega-menu"
      square
      elevation={0}
      sx={{
        position: 'fixed',
        insetInline: 0,
        top: { xs: 72, md: 88 },
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        zIndex: (theme) => theme.zIndex.appBar - 1,
        maxHeight: 'min(70vh, calc(100dvh - 88px))',
        overflowY: 'auto',
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          {columns.map((column) => (
            <Grid key={column.titleKey} size={{ xs: 6, md: 3 }}>
              <LinkMui
                component={Link}
                to={column.href}
                onClick={onNavigate}
                underline="hover"
                color="text.primary"
                sx={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: '1.125rem' }}
              >
                {t(column.titleKey)}
              </LinkMui>
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {column.items.map((item) => (
                  <LinkMui
                    key={`${column.titleKey}-${item.key}`}
                    component={Link}
                    to={item.href}
                    onClick={onNavigate}
                    underline="hover"
                    color="text.secondary"
                    variant="body2"
                  >
                    {t(item.key)}
                  </LinkMui>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <LinkMui
            component={Link}
            to={ROUTES.products(lang)}
            onClick={onNavigate}
            underline="hover"
            color="text.primary"
            sx={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {t('products.title')} →
          </LinkMui>
        </Container>
      </Box>
    </Paper>
  );
}
