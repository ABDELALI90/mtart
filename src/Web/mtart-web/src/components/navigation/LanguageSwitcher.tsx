import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import i18next, { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { replaceLanguageInPath } from '@/utils/paths';

interface LanguageSwitcherProps {
  currentLang: SupportedLanguage;
  tone?: 'light' | 'dark';
}

export function LanguageSwitcher({ currentLang, tone = 'dark' }: LanguageSwitcherProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const open = Boolean(anchor);

  function handleSelect(next: SupportedLanguage) {
    setAnchor(null);
    if (next === currentLang) {
      return;
    }
    void i18next.changeLanguage(next);
    navigate(`${replaceLanguageInPath(location.pathname, next)}${location.search}`);
  }

  return (
    <>
      <Button
        color="inherit"
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
        startIcon={<LanguageIcon fontSize="small" />}
        sx={{
          minWidth: 0,
          color: tone === 'light' ? '#FFFFFF' : 'text.primary',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {currentLang}
      </Button>
      <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)} slotProps={{ list: { 'aria-label': 'Select language' } }}>
        {SUPPORTED_LANGUAGES.map((code) => (
          <MenuItem key={code} selected={code === currentLang} onClick={() => handleSelect(code)}>
            {code === currentLang ? (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            ) : null}
            {LANGUAGE_LABELS[code]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
