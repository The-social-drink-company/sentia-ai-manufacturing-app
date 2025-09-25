// Theme Provider for the Sentia Manufacturing Dashboard design system

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { colors, lightColors, darkColors, marketColors, MarketColors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { shadows, darkShadows } from '../tokens/shadows';
import { radius } from '../tokens/radius';
import { breakpoints } from '../tokens/breakpoints';
import { duration, easing } from '../tokens/animations';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type MarketRegion = keyof MarketColors;

export interface Theme {
  mode: 'light' | 'dark';
  colors: typeof lightColors;
  shadows: typeof shadows;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  breakpoints: typeof breakpoints;
  animations: {
    duration: typeof duration;
    easing: typeof easing;
  };
  marketColors?: MarketColors[MarketRegion];
}

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  marketRegion: MarketRegion | null;
  setMode: (mode: ThemeMode) => void;
  setMarketRegion: (region: MarketRegion | null) => void;
  toggleMode: () => void;
  isSystemDark: boolean;
}

// Create theme context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme storage keys
const THEME_MODE_KEY = 'sentia-theme-mode';
const MARKET_REGION_KEY = 'sentia-market-region';

// System dark mode detection
const useSystemDarkMode = () => {
  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isSystemDark;
};

// Create theme object
const createTheme = (
  mode: 'light' | 'dark',
  marketRegion: MarketRegion | null = null
): Theme => ({
  mode,
  colors: mode === 'light' ? lightColors : darkColors,
  shadows: mode === 'light' ? shadows : darkShadows,
  typography,
  spacing,
  radius,
  breakpoints,
  animations: {
    duration,
    easing
  },
  marketColors: marketRegion ? marketColors[marketRegion] : undefined
});

// Generate CSS variables from theme
const generateThemeVariables = (theme: Theme): Record<string, string> => {
  const variables: Record<string, string> = {};

  // Color variables
  Object.entries(theme.colors).forEach(([category, categoryColors]) => {
    Object.entries(categoryColors).forEach(([key, value]) => {
      variables[`--color-${category}-${key}`] = value;
    });
  });

  // Typography variables
  Object.entries(theme.typography).forEach(([category, sizes]) => {
    Object.entries(sizes).forEach(([size, token]) => {
      variables[`--typography-${category}-${size}-font-family`] = token.fontFamily;
      variables[`--typography-${category}-${size}-font-size`] = token.fontSize;
      variables[`--typography-${category}-${size}-font-weight`] = token.fontWeight.toString();
      variables[`--typography-${category}-${size}-line-height`] = token.lineHeight;
      if (token.letterSpacing) {
        variables[`--typography-${category}-${size}-letter-spacing`] = token.letterSpacing;
      }
    });
  });

  // Spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });

  // Shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value.boxShadow;
    if (value.filter) {
      variables[`--shadow-${key}-filter`] = value.filter;
    }
  });

  // Radius variables
  Object.entries(theme.radius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });

  // Breakpoint variables
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    variables[`--breakpoint-${key}`] = value;
  });

  // Animation variables
  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    variables[`--duration-${key}`] = value;
  });
  
  Object.entries(theme.animations.easing).forEach(([key, value]) => {
    variables[`--easing-${key}`] = value;
  });

  // Market-specific color variables
  if (theme.marketColors) {
    Object.entries(theme.marketColors.primary).forEach(([key, value]) => {
      variables[`--color-market-primary-${key}`] = value;
    });
    variables['--color-market-accent'] = theme.marketColors.accent;
  }

  return variables;
};

// Apply theme variables to document
const applyThemeVariables = (variables: Record<string, string>) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

// Theme Provider Props
export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultMarketRegion?: MarketRegion;
  storageKey?: string;
  enableSystemTheme?: boolean;
  disableTransitionOnChange?: boolean;
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  defaultMarketRegion = null,
  enableSystemTheme = true,
  disableTransitionOnChange = false
}) => {
  const isSystemDark = useSystemDarkMode();

  // Initialize theme mode from storage or default
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode;
    
    try {
      const stored = localStorage.getItem(THEME_MODE_KEY) as ThemeMode;
      return stored || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  // Initialize market region from storage or default
  const [marketRegion, setMarketRegionState] = useState<MarketRegion | null>(() => {
    if (typeof window === 'undefined') return defaultMarketRegion;
    
    try {
      const stored = localStorage.getItem(MARKET_REGION_KEY) as MarketRegion;
      return stored || defaultMarketRegion;
    } catch {
      return defaultMarketRegion;
    }
  });

  // Determine actual theme mode (considering system preference)
  const actualMode: 'light' | 'dark' = 
    mode === 'system' ? (isSystemDark ? 'dark' : 'light') : mode;

  // Create current theme
  const theme = createTheme(actualMode, marketRegion);

  // Set theme mode with persistence
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_MODE_KEY, newMode);
    } catch {
      // Handle localStorage errors silently
    }
  };

  // Set market region with persistence
  const setMarketRegion = (region: MarketRegion | null) => {
    setMarketRegionState(region);
    try {
      if (region) {
        localStorage.setItem(MARKET_REGION_KEY, region);
      } else {
        localStorage.removeItem(MARKET_REGION_KEY);
      }
    } catch {
      // Handle localStorage errors silently
    }
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    if (mode === 'system') {
      setMode(isSystemDark ? 'light' : 'dark');
    } else {
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  };

  // Apply theme variables when theme changes
  useEffect(() => {
    const variables = generateThemeVariables(theme);
    
    // Disable transitions during theme change if requested
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{transition-delay:0s!important;transition-duration:0s!important;animation-delay:0s!important;animation-duration:0s!important;}`
        )
      );
      document.head.appendChild(css);

      // Apply variables
      applyThemeVariables(variables);

      // Re-enable transitions after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.head.removeChild(css);
        });
      });
    } else {
      applyThemeVariables(variables);
    }

    // Update document class for theme
    document.documentElement.className = document.documentElement.className
      .replace(/(^|\s)(light|dark)(\s|$)/g, ' ')
      .trim();
    document.documentElement.classList.add(actualMode);

    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme.colors.background.primary);
    }
  }, [theme, actualMode, disableTransitionOnChange]);

  // Context value
  const contextValue: ThemeContextValue = {
    theme,
    mode,
    marketRegion,
    setMode,
    setMarketRegion,
    toggleMode,
    isSystemDark
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme utilities for styled components
export const styled = {
  // Get current theme values
  theme: (theme: Theme) => theme,
  
  // Color utilities
  color: (theme: Theme, path: string) => {
    const parts = path.split('.');
    let value: any = theme.colors;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value || '';
  },
  
  // Spacing utilities
  spacing: (theme: Theme, size: keyof typeof spacing) => theme.spacing[size],
  
  // Shadow utilities
  shadow: (theme: Theme, level: keyof typeof shadows) => theme.shadows[level].boxShadow,
  
  // Typography utilities
  typography: (theme: Theme, category: string, size: string) => {
    const token = (theme.typography as any)[category]?.[size];
    if (!token) return {};
    
    return {
      fontFamily: token.fontFamily,
      fontSize: token.fontSize,
      fontWeight: token.fontWeight,
      lineHeight: token.lineHeight,
      ...(token.letterSpacing && { letterSpacing: token.letterSpacing }),
      ...(token.textTransform && { textTransform: token.textTransform })
    };
  },
  
  // Media query utilities
  media: {
    up: (breakpoint: keyof typeof breakpoints) => 
      `@media (min-width: ${breakpoints[breakpoint]})`,
    down: (breakpoint: keyof typeof breakpoints) => {
      const bp = breakpoints[breakpoint];
      const value = parseInt(bp) - 1;
      return `@media (max-width: ${value}px)`;
    }
  }
};

// Default theme export
export const defaultTheme = createTheme('light');
export const defaultDarkTheme = createTheme('dark');

// Theme configuration for different markets
export const createMarketTheme = (
  mode: 'light' | 'dark',
  region: MarketRegion
): Theme => createTheme(mode, region);

// Hook for responsive values
export const useResponsive = () => {
  const { theme } = useTheme();
  
  return {
    isSmall: (width: number) => width < parseInt(theme.breakpoints.md),
    isMedium: (width: number) => 
      width >= parseInt(theme.breakpoints.md) && width < parseInt(theme.breakpoints.lg),
    isLarge: (width: number) => width >= parseInt(theme.breakpoints.lg),
    getCurrentBreakpoint: (width: number) => {
      if (width >= parseInt(theme.breakpoints['2xl'])) return '2xl';
      if (width >= parseInt(theme.breakpoints.xl)) return 'xl';
      if (width >= parseInt(theme.breakpoints.lg)) return 'lg';
      if (width >= parseInt(theme.breakpoints.md)) return 'md';
      return 'sm';
    }
  };
};