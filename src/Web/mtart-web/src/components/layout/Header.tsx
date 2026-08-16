import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { MegaMenu } from '@/components/navigation/MegaMenu';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchOverlay } from '@/components/navigation/SearchOverlay';
import { ColorModeToggle } from '@/theme/ColorModeToggle';
import { useLang } from '@/hooks/useLang';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ROUTES } from '@/utils/paths';

const NAV_ITEMS: { key: string; to: (lang: string) => string; hasMegaMenu?: boolean }[] = [
  { key: 'nav.products', to: ROUTES.products, hasMegaMenu: true },
  { key: 'nav.cementTiles', to: ROUTES.cementTiles },
  { key: 'nav.simulator', to: ROUTES.simulator },
  { key: 'nav.collections', to: ROUTES.collections },
  { key: 'nav.colors', to: ROUTES.colors },
  { key: 'nav.projects', to: ROUTES.projects },
  { key: 'nav.ourCraft', to: ROUTES.ourCraft },
  { key: 'nav.about', to: ROUTES.about },
];

export function Header() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === ROUTES.home(lang);
  const transparent = isHome && !scrolled && !mobileNavOpen;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useOnClickOutside(productsRef, () => setMegaMenuOpen(false));

  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileNavOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const navColor = transparent ? '#FFFFFF' : 'text.primary';

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: transparent ? 'transparent' : 'background.default',
          borderBottomColor: transparent ? 'transparent' : 'divider',
          color: navColor,
          backdropFilter: transparent ? 'none' : 'blur(8px)',
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 72, md: 88 },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box
              component={Link}
              to={ROUTES.home(lang)}
              sx={{
                fontFamily: 'ui-serif, Georgia, serif',
                fontSize: { xs: '1.35rem', md: '1.5rem' },
                letterSpacing: '0.08em',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              MT ART
            </Box>

            <Stack
              component="nav"
              direction="row"
              spacing={{ md: 2, lg: 3 }}
              sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center' }}
              aria-label="Primary"
            >
              {NAV_ITEMS.map((item) =>
                item.hasMegaMenu ? (
                  <Box key={item.key} ref={productsRef} sx={{ position: 'relative' }}>
                    <Button
                      color="inherit"
                      onClick={() => setMegaMenuOpen((value) => !value)}
                      aria-expanded={megaMenuOpen}
                      aria-controls="products-mega-menu"
                      endIcon={<KeyboardArrowDownIcon sx={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none' }} />}
                      sx={{ minHeight: 40, px: 1 }}
                    >
                      {t(item.key)}
                    </Button>
                    {megaMenuOpen ? (
                      <Box id="products-mega-menu">
                        <MegaMenu lang={lang} onNavigate={() => setMegaMenuOpen(false)} />
                      </Box>
                    ) : null}
                  </Box>
                ) : (
                  <Button
                    key={item.key}
                    color="inherit"
                    component={Link}
                    to={item.to(lang)}
                    sx={{ minHeight: 40, px: 1 }}
                  >
                    {t(item.key)}
                  </Button>
                ),
              )}
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                color="inherit"
                onClick={() => setSearchOpen(true)}
                aria-label={t('nav.search')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <SearchIcon />
              </IconButton>
              <ColorModeToggle light={transparent} />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <LanguageSwitcher currentLang={lang} tone={transparent ? 'light' : 'dark'} />
              </Box>
              <Button
                component={Link}
                to={ROUTES.requestQuote(lang)}
                variant={transparent ? 'outlined' : 'contained'}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  ...(transparent
                    ? { borderColor: '#FFFFFF', color: '#FFFFFF' }
                    : { bgcolor: 'primary.main', color: 'primary.contrastText' }),
                }}
              >
                {t('nav.requestQuote')}
              </Button>
              <IconButton
                color="inherit"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav-drawer"
                sx={{ display: { lg: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        lang={lang}
        navItems={NAV_ITEMS}
      />
      {searchOpen ? <SearchOverlay lang={lang} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
