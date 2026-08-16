import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PaletteMode } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import { createMtArtTheme, THEME_STORAGE_KEY } from '@/theme/mtartTheme';
import { isRtl } from '@/i18n';

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleMode: () => undefined,
  setMode: () => undefined,
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

function readStoredMode(): PaletteMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyDomTheme(mode: PaletteMode) {
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', mode === 'dark' ? '#111111' : '#FAF9F6');
  }
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [mode, setModeState] = useState<PaletteMode>(() => {
    if (typeof document !== 'undefined') {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'light' || current === 'dark') {
        return current;
      }
    }
    return readStoredMode();
  });

  useEffect(() => {
    applyDomTheme(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      setMode: setModeState,
      toggleMode: () => setModeState((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  const theme = useMemo(
    () => createMtArtTheme(mode, isRtl(i18n.language) ? 'rtl' : 'ltr'),
    [mode, i18n.language],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
