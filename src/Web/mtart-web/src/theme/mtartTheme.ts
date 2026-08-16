import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

export const THEME_STORAGE_KEY = 'mtart.theme';

const LIGHT = {
  background: '#FAF9F6',
  paper: '#FFFFFF',
  text: '#171717',
  textSecondary: '#666666',
  divider: '#D8D5CF',
  primary: '#111111',
  primaryContrast: '#FFFFFF',
  secondarySurface: '#FFFFFF',
} as const;

const DARK = {
  background: '#111111',
  paper: '#191919',
  text: '#FFFFFF',
  textSecondary: '#B5B5B5',
  divider: '#3A3A3A',
  primary: '#FFFFFF',
  primaryContrast: '#111111',
  secondarySurface: '#222222',
} as const;

export function themeTokens(mode: PaletteMode) {
  return mode === 'dark' ? DARK : LIGHT;
}

const headingFont = 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
const bodyFont = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export function createMtArtTheme(mode: PaletteMode = 'light', direction: 'ltr' | 'rtl' = 'ltr'): Theme {
  const tokens = themeTokens(mode);

  return createTheme({
    direction,
    cssVariables: true,
    palette: {
      mode,
      primary: { main: tokens.primary, contrastText: tokens.primaryContrast },
      secondary: { main: tokens.textSecondary, contrastText: tokens.paper },
      background: {
        default: tokens.background,
        paper: tokens.paper,
      },
      error: {
        main: tokens.text,
        contrastText: tokens.paper,
      },
      text: {
        primary: tokens.text,
        secondary: tokens.textSecondary,
      },
      divider: tokens.divider,
      action: {
        hover: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.04)',
        selected: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,17,0.08)',
      },
    },
    shape: { borderRadius: 2 },
    spacing: 8,
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '-0.02em' },
      h2: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '-0.02em' },
      h3: { fontFamily: headingFont, fontWeight: 500 },
      h4: { fontFamily: headingFont, fontWeight: 500 },
      h5: { fontFamily: headingFont, fontWeight: 500 },
      h6: { fontFamily: headingFont, fontWeight: 500 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.06em',
      },
      overline: {
        letterSpacing: '0.16em',
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: mode,
          },
          body: {
            backgroundColor: tokens.background,
            color: tokens.text,
            overflowX: 'hidden',
          },
          '::selection': {
            backgroundColor: mode === 'dark' ? '#FFFFFF' : '#111111',
            color: mode === 'dark' ? '#111111' : '#FFFFFF',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${tokens.divider}`,
            backgroundColor: mode === 'dark' ? 'rgba(17,17,17,0.92)' : 'rgba(250,249,246,0.94)',
            backdropFilter: 'blur(8px)',
            color: tokens.text,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 2,
            minHeight: 44,
            paddingInline: 20,
          },
          contained: {
            backgroundColor: tokens.primary,
            color: tokens.primaryContrast,
            '&:hover': { backgroundColor: tokens.primary, opacity: 0.88 },
          },
          outlined: {
            borderColor: tokens.divider,
            color: tokens.text,
            '&:hover': {
              borderColor: tokens.text,
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            color: tokens.text,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: tokens.paper,
            color: tokens.text,
          },
          outlined: {
            borderColor: tokens.divider,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0, variant: 'outlined' },
        styleOverrides: {
          root: {
            borderRadius: 2,
            borderColor: tokens.divider,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
          fullWidth: true,
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            backgroundColor: tokens.paper,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.text,
            },
          },
          notchedOutline: {
            borderColor: tokens.divider,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 2,
            maxWidth: 'calc(100vw - 32px)',
            margin: 16,
            backgroundColor: tokens.paper,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.paper,
            color: tokens.text,
            backgroundImage: 'none',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: tokens.primary, height: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: 12,
            minHeight: 44,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 2 },
        },
      },
      MuiSlider: {
        styleOverrides: {
          thumb: { width: 14, height: 14 },
          track: { border: 'none' },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: tokens.text,
            color: tokens.paper,
            fontSize: 12,
            borderRadius: 2,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 2,
            border: `1px solid ${tokens.divider}`,
            boxShadow: mode === 'dark' ? '0 12px 32px rgba(0,0,0,0.45)' : '0 12px 32px rgba(17,17,17,0.08)',
          },
        },
      },
      MuiStepper: {
        styleOverrides: {
          root: { padding: 0 },
        },
      },
      MuiContainer: {
        defaultProps: { maxWidth: 'xl' },
      },
    },
  });
}
