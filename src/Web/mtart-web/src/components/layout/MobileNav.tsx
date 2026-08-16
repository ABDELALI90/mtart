import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { ColorModeToggle } from '@/theme/ColorModeToggle';
import { ROUTES } from '@/utils/paths';
import type { SupportedLanguage } from '@/i18n';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  lang: SupportedLanguage;
  navItems: { key: string; to: (lang: string) => string }[];
}

export function MobileNav({ open, onClose, onOpenSearch, lang, navItems }: MobileNavProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      id="mobile-nav-drawer"
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ display: { lg: 'none' } }}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: 360 }, maxWidth: '100vw' } },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'ui-serif, Georgia, serif', letterSpacing: '0.08em' }}>
          MT ART
        </Typography>
        <IconButton onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Stack component="nav" sx={{ px: 1.5, py: 2 }} aria-label="Mobile primary">
        <Button
          color="inherit"
          startIcon={<SearchIcon />}
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          sx={{ justifyContent: 'flex-start', minHeight: 48 }}
        >
          {t('nav.search')}
        </Button>
        {navItems.map((item) => (
          <Button
            key={item.key}
            color="inherit"
            component={Link}
            to={item.to(lang)}
            onClick={onClose}
            sx={{ justifyContent: 'flex-start', minHeight: 48 }}
          >
            {t(item.key)}
          </Button>
        ))}
        <Button color="inherit" component={Link} to={ROUTES.catalogs(lang)} onClick={onClose} sx={{ justifyContent: 'flex-start', minHeight: 48 }}>
          {t('nav.catalog')}
        </Button>
        <Button color="inherit" component={Link} to={ROUTES.contact(lang)} onClick={onClose} sx={{ justifyContent: 'flex-start', minHeight: 48 }}>
          {t('nav.contact')}
        </Button>
      </Stack>
      <Box sx={{ mt: 'auto', p: 2.5, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <LanguageSwitcher currentLang={lang} tone="dark" />
          <ColorModeToggle />
        </Stack>
        <Button fullWidth variant="contained" component={Link} to={ROUTES.requestQuote(lang)} onClick={onClose}>
          {t('nav.requestQuote')}
        </Button>
      </Box>
    </Drawer>
  );
}
