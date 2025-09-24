// Color tokens for the Sentia Manufacturing Dashboard design system

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  primary: ColorPalette;
  secondary: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  danger: ColorPalette;
  neutral: ColorPalette;
}

export interface MarketColors {
  uk: {
    primary: ColorPalette;
    accent: string;
  };
  eu: {
    primary: ColorPalette;
    accent: string;
  };
  us: {
    primary: ColorPalette;
    accent: string;
  };
}

// Base color palettes
export const colors: SemanticColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  }
};

// Market-specific color variations
export const marketColors: MarketColors = {
  uk: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#1E40AF', // Royal Blue
      600: '#1d4ed8',
      700: '#1e3a8a',
      800: '#1e40af',
      900: '#172554',
      950: '#0f1419'
    },
    accent: '#C41E3A' // British Red
  },
  eu: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#003399', // European Blue
      600: '#002c7a',
      700: '#00245b',
      800: '#001d3d',
      900: '#00152e',
      950: '#000d1f'
    },
    accent: '#FFCC00' // European Gold
  },
  us: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#002868', // Liberty Blue
      600: '#001f52',
      700: '#00163d',
      800: '#000e28',
      900: '#000613',
      950: '#00030a'
    },
    accent: '#BF0A30' // American Red
  }
};

// Functional color mappings
export interface FunctionalColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  border: {
    primary: string;
    secondary: string;
    tertiary: string;
    focus: string;
    error: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
    link: string;
    linkHover: string;
  };
  interactive: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    disabled: string;
  };
  feedback: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;
  };
}

export const lightColors: FunctionalColors = {
  background: {
    primary: colors.neutral[50],
    secondary: colors.neutral[100],
    tertiary: colors.neutral[200],
    inverse: colors.neutral[900]
  },
  surface: {
    primary: '#ffffff',
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  border: {
    primary: colors.neutral[200],
    secondary: colors.neutral[300],
    tertiary: colors.neutral[400],
    focus: colors.primary[500],
    error: colors.danger[500]
  },
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[500],
    inverse: colors.neutral[50],
    disabled: colors.neutral[400],
    link: colors.primary[600],
    linkHover: colors.primary[700]
  },
  interactive: {
    primary: colors.primary[600],
    primaryHover: colors.primary[700],
    primaryActive: colors.primary[800],
    secondary: colors.neutral[100],
    secondaryHover: colors.neutral[200],
    secondaryActive: colors.neutral[300],
    disabled: colors.neutral[300]
  },
  feedback: {
    success: colors.success[600],
    successBg: colors.success[50],
    warning: colors.warning[600],
    warningBg: colors.warning[50],
    error: colors.danger[600],
    errorBg: colors.danger[50],
    info: colors.primary[600],
    infoBg: colors.primary[50]
  }
};

export const darkColors: FunctionalColors = {
  background: {
    primary: colors.neutral[950],
    secondary: colors.neutral[900],
    tertiary: colors.neutral[800],
    inverse: colors.neutral[50]
  },
  surface: {
    primary: colors.neutral[900],
    secondary: colors.neutral[800],
    tertiary: colors.neutral[700],
    overlay: 'rgba(0, 0, 0, 0.7)'
  },
  border: {
    primary: colors.neutral[700],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    focus: colors.primary[400],
    error: colors.danger[400]
  },
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[200],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[900],
    disabled: colors.neutral[500],
    link: colors.primary[400],
    linkHover: colors.primary[300]
  },
  interactive: {
    primary: colors.primary[500],
    primaryHover: colors.primary[400],
    primaryActive: colors.primary[300],
    secondary: colors.neutral[700],
    secondaryHover: colors.neutral[600],
    secondaryActive: colors.neutral[500],
    disabled: colors.neutral[700]
  },
  feedback: {
    success: colors.success[400],
    successBg: colors.success[950],
    warning: colors.warning[400],
    warningBg: colors.warning[950],
    error: colors.danger[400],
    errorBg: colors.danger[950],
    info: colors.primary[400],
    infoBg: colors.primary[950]
  }
};

// CSS custom properties generator
export const generateColorVariables = (colors: FunctionalColors, prefix: string = '') => {
  const cssVariables: Record<string, string> = {};
  
  Object.entries(colors).forEach(([category, categoryColors]) => {
    Object.entries(categoryColors).forEach(([key, value]) => {
      cssVariables[`--${prefix}color-${category}-${key}`] = value;
    });
  });
  
  return cssVariables;
};

// Market-specific CSS variables
export const generateMarketVariables = (market: keyof MarketColors) => {
  const marketPalette = marketColors[market];
  const cssVariables: Record<string, string> = {};
  
  Object.entries(marketPalette.primary).forEach(([key, value]) => {
    cssVariables[`--color-market-primary-${key}`] = value;
  });
  
  cssVariables['--color-market-accent'] = marketPalette.accent;
  
  return cssVariables;
};