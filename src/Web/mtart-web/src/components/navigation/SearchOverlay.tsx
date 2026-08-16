import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useProductSearch } from '@/features/products/hooks';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { ROUTES } from '@/utils/paths';
import { catalogImageUrl } from '@/utils/media';

interface SearchOverlayProps {
  lang: string;
  onClose: () => void;
}

export function SearchOverlay({ lang, onClose }: SearchOverlayProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useProductSearch(query, lang, query.trim().length > 1);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <Dialog fullScreen open onClose={onClose} aria-label={t('nav.search')}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
          <SearchIcon sx={{ color: 'text.secondary' }} aria-hidden="true" />
          <TextField
            autoFocus
            variant="standard"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('nav.search')}
            fullWidth
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { fontFamily: 'ui-serif, Georgia, serif', fontSize: { xs: '1.5rem', md: '2rem' } },
              },
            }}
          />
          <IconButton onClick={onClose} aria-label="Close search">
            <CloseIcon />
          </IconButton>
        </Container>

        <Container maxWidth="xl" sx={{ flex: 1, overflowY: 'auto', py: 4 }}>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              {t('common.loading')}
            </Typography>
          ) : null}
          {!isLoading && query.trim().length > 1 && data?.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('common.noResults')}
            </Typography>
          ) : null}
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            {data?.map((product) => (
              <Box component="li" key={product.id}>
                <Link to={ROUTES.product(lang, product.slug)} onClick={onClose}>
                  <Stack spacing={1}>
                    <ResponsiveImage
                      src={catalogImageUrl(product.primaryImageUrl, { cropped: true })}
                      alt={product.name}
                      aspectRatio="4/5"
                      placeholderLabel={product.name}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {product.reference}
                    </Typography>
                    <Typography variant="h6" sx={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: '1rem' }}>
                      {product.name}
                    </Typography>
                  </Stack>
                </Link>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    </Dialog>
  );
}
