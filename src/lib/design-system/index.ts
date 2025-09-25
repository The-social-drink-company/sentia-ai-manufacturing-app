// Main entry point for the Sentia Manufacturing Dashboard Design System

// Token exports
export * from './tokens/colors';
export * from './tokens/typography';
export * from './tokens/spacing';
export * from './tokens/shadows';
export * from './tokens/radius';
export * from './tokens/breakpoints';
export * from './tokens/animations';

// Theme exports
export * from './theme/ThemeProvider';
export * from './theme/cssVariables';

// Utility exports
export * from './utils/responsive';

// Re-export commonly used types and utilities
export type {
  ColorPalette,
  SemanticColors,
  MarketColors,
  FunctionalColors
} from './tokens/colors';

export type {
  TypographyToken,
  TypographyScale
} from './tokens/typography';

export type {
  SpacingScale,
  SemanticSpacing
} from './tokens/spacing';

export type {
  ShadowToken,
  ShadowScale,
  SemanticShadows
} from './tokens/shadows';

export type {
  RadiusScale,
  SemanticRadius
} from './tokens/radius';

export type {
  BreakpointScale,
  BreakpointValues,
  DeviceCategories
} from './tokens/breakpoints';

export type {
  AnimationDuration,
  AnimationEasing,
  AnimationKeyframes
} from './tokens/animations';

export type {
  Theme,
  ThemeMode,
  MarketRegion,
  ThemeContextValue
} from './theme/ThemeProvider';

export type {
  ResponsiveValue,
  BreakpointKey,
  DeviceType
} from './utils/responsive';

// Design system configuration
export const designSystemConfig = {
  name: 'Sentia Manufacturing Dashboard Design System',
  version: '1.0.0',
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  spacing: {
    baseUnit: 4, // 4px base unit
    scale: 'linear'
  },
  typography: {
    baseFontSize: 16,
    scaleRatio: 1.25, // Major Third
    fonts: {
      sans: 'Inter',
      mono: 'Roboto Mono'
    }
  },
  colors: {
    mode: 'functional', // Using functional color system
    markets: ['uk', 'eu', 'us']
  }
} as const;