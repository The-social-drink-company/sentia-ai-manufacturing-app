// CSS Variables generation and management for the Sentia Manufacturing Dashboard design system

import { 
  colors, 
  lightColors, 
  darkColors, 
  marketColors,
  type FunctionalColors,
  type MarketColors 
} from '../tokens/colors';
import { typography, type TypographyScale } from '../tokens/typography';
import { spacing, semanticSpacing, dashboardSpacing } from '../tokens/spacing';
import { shadows, darkShadows, semanticShadows, darkSemanticShadows } from '../tokens/shadows';
import { radius, semanticRadius, dashboardRadius, componentRadius } from '../tokens/radius';
import { breakpoints, containerWidths, gridBreakpoints } from '../tokens/breakpoints';
import { duration, easing } from '../tokens/animations';

// CSS Variable types
export interface CSSVariableGroup {
  [key: string]: string | number;
}

export interface ThemeCSSVariables {
  colors: CSSVariableGroup;
  typography: CSSVariableGroup;
  spacing: CSSVariableGroup;
  shadows: CSSVariableGroup;
  radius: CSSVariableGroup;
  breakpoints: CSSVariableGroup;
  animations: CSSVariableGroup;
  market?: CSSVariableGroup;
}

// Generate color CSS variables
export const generateColorVariables = (
  functionalColors: FunctionalColors,
  mode: 'light' | 'dark' = 'light'
): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Functional colors
  Object.entries(functionalColors).forEach(([category, categoryColors]) => {
    Object.entries(categoryColors).forEach(([key, value]) => {
      variables[`--color-${category}-${key}`] = value;
    });
  });
  
  // Base color palette
  Object.entries(colors).forEach(([palette, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      variables[`--color-${palette}-${shade}`] = value;
    });
  });
  
  // Mode-specific aliases
  variables['--color-mode'] = mode;
  
  return variables;
};

// Generate typography CSS variables
export const generateTypographyVariables = (
  typographyScale: TypographyScale
): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  Object.entries(typographyScale).forEach(([category, sizes]) => {
    Object.entries(sizes).forEach(([size, token]) => {
      const prefix = `--typography-${category}-${size}`;
      variables[`${prefix}-font-family`] = token.fontFamily;
      variables[`${prefix}-font-size`] = token.fontSize;
      variables[`${prefix}-font-weight`] = token.fontWeight;
      variables[`${prefix}-line-height`] = token.lineHeight;
      
      if (token.letterSpacing) {
        variables[`${prefix}-letter-spacing`] = token.letterSpacing;
      }
      
      if (token.textTransform) {
        variables[`${prefix}-text-transform`] = token.textTransform;
      }
    });
  });
  
  return variables;
};

// Generate spacing CSS variables
export const generateSpacingVariables = (): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Base spacing scale
  Object.entries(spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });
  
  // Semantic spacing
  const flattenSpacing = (obj: any, prefix: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[`${prefix}-${key}`] = value;
      } else if (typeof value === 'object') {
        flattenSpacing(value, `${prefix}-${key}`);
      }
    });
  };
  
  flattenSpacing(semanticSpacing, '--spacing-semantic');
  flattenSpacing(dashboardSpacing, '--spacing-dashboard');
  
  return variables;
};

// Generate shadow CSS variables
export const generateShadowVariables = (
  shadowScale: typeof shadows,
  mode: 'light' | 'dark' = 'light'
): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Base shadow scale
  Object.entries(shadowScale).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value.boxShadow;
    if (value.filter) {
      variables[`--shadow-${key}-filter`] = value.filter;
    }
  });
  
  // Semantic shadows
  const semanticShadowScale = mode === 'light' ? semanticShadows : darkSemanticShadows;
  const flattenShadows = (obj: any, prefix: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && 'boxShadow' in value) {
        variables[`${prefix}-${key}`] = value.boxShadow;
        if (value.filter) {
          variables[`${prefix}-${key}-filter`] = value.filter;
        }
      } else if (typeof value === 'object') {
        flattenShadows(value, `${prefix}-${key}`);
      }
    });
  };
  
  flattenShadows(semanticShadowScale, '--shadow-semantic');
  
  return variables;
};

// Generate radius CSS variables
export const generateRadiusVariables = (): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Base radius scale
  Object.entries(radius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });
  
  // Semantic radius
  const flattenRadius = (obj: any, prefix: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[`${prefix}-${key}`] = value;
      } else if (typeof value === 'object') {
        flattenRadius(value, `${prefix}-${key}`);
      }
    });
  };
  
  flattenRadius(semanticRadius, '--radius-semantic');
  flattenRadius(dashboardRadius, '--radius-dashboard');
  flattenRadius(componentRadius, '--radius-component');
  
  return variables;
};

// Generate breakpoint CSS variables
export const generateBreakpointVariables = (): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Breakpoint values
  Object.entries(breakpoints).forEach(([key, value]) => {
    variables[`--breakpoint-${key}`] = value;
  });
  
  // Container widths
  Object.entries(containerWidths).forEach(([key, value]) => {
    variables[`--container-${key}`] = value;
  });
  
  // Grid breakpoints
  Object.entries(gridBreakpoints.columns).forEach(([key, value]) => {
    variables[`--grid-columns-${key}`] = value;
  });
  
  Object.entries(gridBreakpoints.gaps).forEach(([key, value]) => {
    variables[`--grid-gap-${key}`] = value;
  });
  
  return variables;
};

// Generate animation CSS variables
export const generateAnimationVariables = (): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  
  // Duration variables
  Object.entries(duration).forEach(([key, value]) => {
    variables[`--duration-${key}`] = value;
  });
  
  // Easing variables
  Object.entries(easing).forEach(([key, value]) => {
    variables[`--easing-${key}`] = value;
  });
  
  return variables;
};

// Generate market-specific CSS variables
export const generateMarketVariables = (
  region: keyof MarketColors
): CSSVariableGroup => {
  const variables: CSSVariableGroup = {};
  const marketPalette = marketColors[region];
  
  // Primary colors
  Object.entries(marketPalette.primary).forEach(([shade, value]) => {
    variables[`--color-market-primary-${shade}`] = value;
  });
  
  // Accent color
  variables['--color-market-accent'] = marketPalette.accent;
  
  // Region identifier
  variables['--market-region'] = region;
  
  return variables;
};

// Generate complete theme CSS variables
export const generateThemeVariables = (
  mode: 'light' | 'dark',
  marketRegion?: keyof MarketColors
): ThemeCSSVariables => {
  const functionalColors = mode === 'light' ? lightColors : darkColors;
  const shadowScale = mode === 'light' ? shadows : darkShadows;
  
  return {
    colors: generateColorVariables(functionalColors, mode),
    typography: generateTypographyVariables(typography),
    spacing: generateSpacingVariables(),
    shadows: generateShadowVariables(shadowScale, mode),
    radius: generateRadiusVariables(),
    breakpoints: generateBreakpointVariables(),
    animations: generateAnimationVariables(),
    ...(marketRegion && { market: generateMarketVariables(marketRegion) })
  };
};

// Convert CSS variables object to CSS string
export const cssVariablesToString = (variables: CSSVariableGroup): string => {
  return Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
};

// Convert theme variables to CSS string
export const themeVariablesToString = (themeVars: ThemeCSSVariables): string => {
  const allVariables = Object.values(themeVars).reduce((acc, group) => ({
    ...acc,
    ...group
  }), {});
  
  return `:root {\n${cssVariablesToString(allVariables)}\n}`;
};

// Apply CSS variables to document
export const applyCSSVariables = (variables: CSSVariableGroup, element?: HTMLElement): void => {
  const target = element || document.documentElement;
  
  Object.entries(variables).forEach(([key, value]) => {
    target.style.setProperty(key, String(value));
  });
};

// Apply theme variables to document
export const applyThemeVariables = (
  mode: 'light' | 'dark',
  marketRegion?: keyof MarketColors,
  element?: HTMLElement
): void => {
  const themeVars = generateThemeVariables(mode, marketRegion);
  const allVariables = Object.values(themeVars).reduce((acc, group) => ({
    ...acc,
    ...group
  }), {});
  
  applyCSSVariables(allVariables, element);
};

// Remove CSS variables from document
export const removeCSSVariables = (
  variableNames: string[],
  element?: HTMLElement
): void => {
  const target = element || document.documentElement;
  
  variableNames.forEach(name => {
    target.style.removeProperty(name);
  });
};

// Get CSS variable value
export const getCSSVariable = (
  variableName: string,
  element?: HTMLElement
): string => {
  const target = element || document.documentElement;
  return getComputedStyle(target).getPropertyValue(variableName).trim();
};

// CSS variable utilities for dynamic theming
export const cssVarUtils = {
  // Create CSS var function
  var: (name: string, fallback?: string) => 
    `var(--${name}${fallback ? `, ${fallback}` : ''})`,
  
  // Color utilities
  color: {
    primary: (shade: string = '500') => `var(--color-primary-${shade})`,
    secondary: (shade: string = '500') => `var(--color-secondary-${shade})`,
    success: (shade: string = '500') => `var(--color-success-${shade})`,
    warning: (shade: string = '500') => `var(--color-warning-${shade})`,
    danger: (shade: string = '500') => `var(--color-danger-${shade})`,
    neutral: (shade: string = '500') => `var(--color-neutral-${shade})`,
    background: (type: string = 'primary') => `var(--color-background-${type})`,
    surface: (type: string = 'primary') => `var(--color-surface-${type})`,
    text: (type: string = 'primary') => `var(--color-text-${type})`,
    border: (type: string = 'primary') => `var(--color-border-${type})`
  },
  
  // Typography utilities
  typography: {
    fontFamily: (category: string, size: string) => 
      `var(--typography-${category}-${size}-font-family)`,
    fontSize: (category: string, size: string) => 
      `var(--typography-${category}-${size}-font-size)`,
    fontWeight: (category: string, size: string) => 
      `var(--typography-${category}-${size}-font-weight)`,
    lineHeight: (category: string, size: string) => 
      `var(--typography-${category}-${size}-line-height)`
  },
  
  // Spacing utilities
  spacing: (size: string) => `var(--spacing-${size})`,
  
  // Shadow utilities
  shadow: (level: string) => `var(--shadow-${level})`,
  
  // Radius utilities
  radius: (size: string) => `var(--radius-${size})`,
  
  // Animation utilities
  duration: (speed: string) => `var(--duration-${speed})`,
  easing: (curve: string) => `var(--easing-${curve})`,
  
  // Market utilities
  market: {
    primary: (shade: string = '500') => `var(--color-market-primary-${shade})`,
    accent: () => `var(--color-market-accent)`
  }
};

// CSS custom properties for theme switching animation
export const themeTransitionCSS = `
  :root {
    --theme-transition-duration: 200ms;
    --theme-transition-easing: ease-in-out;
  }
  
  * {
    transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
    transition-duration: var(--theme-transition-duration);
    transition-timing-function: var(--theme-transition-easing);
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      transition-duration: 0.01ms !important;
    }
  }
`;

// Export default theme CSS
export const getDefaultThemeCSS = (mode: 'light' | 'dark' = 'light'): string => {
  const themeVars = generateThemeVariables(mode);
  return themeVariablesToString(themeVars);
};