// Shadow tokens for the Sentia Manufacturing Dashboard design system

export interface ShadowToken {
  boxShadow: string;
  filter?: string;
}

export interface ShadowScale {
  none: ShadowToken;
  xs: ShadowToken;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
  '2xl': ShadowToken;
  inner: ShadowToken;
}

export interface SemanticShadows {
  card: ShadowToken;
  overlay: ShadowToken;
  dropdown: ShadowToken;
  modal: ShadowToken;
  tooltip: ShadowToken;
  focus: ShadowToken;
  button: {
    idle: ShadowToken;
    hover: ShadowToken;
    pressed: ShadowToken;
  };
  navigation: ShadowToken;
}

// Base shadow scale with 5 elevation levels
export const shadows: ShadowScale = {
  none: {
    boxShadow: 'none'
  },
  xs: {
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))'
  },
  sm: {
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    filter: 'drop-shadow(0 1px 3px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))'
  },
  md: {
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1)) drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))'
  },
  lg: {
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    filter: 'drop-shadow(0 10px 15px rgb(0 0 0 / 0.1)) drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))'
  },
  xl: {
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.1)) drop-shadow(0 8px 10px rgb(0 0 0 / 0.1))'
  },
  '2xl': {
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    filter: 'drop-shadow(0 25px 50px rgb(0 0 0 / 0.25))'
  },
  inner: {
    boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  }
};

// Dark mode shadow variations
export const darkShadows: ShadowScale = {
  none: {
    boxShadow: 'none'
  },
  xs: {
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.2))'
  },
  sm: {
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    filter: 'drop-shadow(0 1px 3px rgb(0 0 0 / 0.3)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))'
  },
  md: {
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.4)) drop-shadow(0 2px 4px rgb(0 0 0 / 0.4))'
  },
  lg: {
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
    filter: 'drop-shadow(0 10px 15px rgb(0 0 0 / 0.5)) drop-shadow(0 4px 6px rgb(0 0 0 / 0.5))'
  },
  xl: {
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)',
    filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.6)) drop-shadow(0 8px 10px rgb(0 0 0 / 0.6))'
  },
  '2xl': {
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.7)',
    filter: 'drop-shadow(0 25px 50px rgb(0 0 0 / 0.7))'
  },
  inner: {
    boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.2)'
  }
};

// Semantic shadow assignments
export const semanticShadows: SemanticShadows = {
  card: shadows.sm,
  overlay: shadows['2xl'],
  dropdown: shadows.lg,
  modal: shadows.xl,
  tooltip: shadows.md,
  focus: {
    boxShadow: '0 0 0 3px rgb(59 130 246 / 0.5)'
  },
  button: {
    idle: shadows.xs,
    hover: shadows.sm,
    pressed: shadows.inner
  },
  navigation: shadows.sm
};

// Dark mode semantic shadows
export const darkSemanticShadows: SemanticShadows = {
  card: darkShadows.sm,
  overlay: darkShadows['2xl'],
  dropdown: darkShadows.lg,
  modal: darkShadows.xl,
  tooltip: darkShadows.md,
  focus: {
    boxShadow: '0 0 0 3px rgb(59 130 246 / 0.3)'
  },
  button: {
    idle: darkShadows.xs,
    hover: darkShadows.sm,
    pressed: darkShadows.inner
  },
  navigation: darkShadows.sm
};

// Colored shadows for brand elements
export interface ColoredShadows {
  primary: ShadowToken;
  success: ShadowToken;
  warning: ShadowToken;
  danger: ShadowToken;
}

export const coloredShadows: ColoredShadows = {
  primary: {
    boxShadow: '0 10px 15px -3px rgb(59 130 246 / 0.2), 0 4px 6px -4px rgb(59 130 246 / 0.1)'
  },
  success: {
    boxShadow: '0 10px 15px -3px rgb(34 197 94 / 0.2), 0 4px 6px -4px rgb(34 197 94 / 0.1)'
  },
  warning: {
    boxShadow: '0 10px 15px -3px rgb(245 158 11 / 0.2), 0 4px 6px -4px rgb(245 158 11 / 0.1)'
  },
  danger: {
    boxShadow: '0 10px 15px -3px rgb(239 68 68 / 0.2), 0 4px 6px -4px rgb(239 68 68 / 0.1)'
  }
};

// Dashboard-specific shadows
export interface DashboardShadows {
  widget: {
    idle: ShadowToken;
    hover: ShadowToken;
    active: ShadowToken;
  };
  toolbar: ShadowToken;
  sidebar: ShadowToken;
  chart: ShadowToken;
  floatingButton: {
    idle: ShadowToken;
    hover: ShadowToken;
  };
}

export const dashboardShadows: DashboardShadows = {
  widget: {
    idle: shadows.sm,
    hover: shadows.md,
    active: shadows.lg
  },
  toolbar: {
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
  },
  sidebar: {
    boxShadow: '2px 0 8px -2px rgb(0 0 0 / 0.1)'
  },
  chart: shadows.xs,
  floatingButton: {
    idle: shadows.lg,
    hover: shadows.xl
  }
};

// Generate CSS variables for shadows
export const generateShadowVariables = (shadowScale: ShadowScale, prefix: string = '') => {
  const cssVariables: Record<string, string> = {};
  
  Object.entries(shadowScale).forEach(([key, value]) => {
    cssVariables[`--${prefix}shadow-${key}`] = value.boxShadow;
    if (value.filter) {
      cssVariables[`--${prefix}shadow-${key}-filter`] = value.filter;
    }
  });
  
  return cssVariables;
};

// Generate semantic shadow variables
export const generateSemanticShadowVariables = (semanticShadows: SemanticShadows, prefix: string = '') => {
  const cssVariables: Record<string, string> = {};
  
  Object.entries(semanticShadows).forEach(([key, value]) => {
    if (typeof value === 'object' && 'boxShadow' in value) {
      cssVariables[`--${prefix}shadow-${key}`] = value.boxShadow;
      if (value.filter) {
        cssVariables[`--${prefix}shadow-${key}-filter`] = value.filter;
      }
    } else if (typeof value === 'object') {
      // Handle nested objects like button states
      Object.entries(value).forEach(([subKey, subValue]) => {
        if ('boxShadow' in subValue) {
          cssVariables[`--${prefix}shadow-${key}-${subKey}`] = subValue.boxShadow;
          if (subValue.filter) {
            cssVariables[`--${prefix}shadow-${key}-${subKey}-filter`] = subValue.filter;
          }
        }
      });
    }
  });
  
  return cssVariables;
};

// Utility functions
export const getShadow = (level: keyof ShadowScale, isDark: boolean = false) => {
  return isDark ? darkShadows[level] : shadows[level];
};

export const getSemanticShadow = (type: keyof SemanticShadows, isDark: boolean = false) => {
  return isDark ? darkSemanticShadows[type] : semanticShadows[type];
};

export const applyShadow = (element: HTMLElement, shadowToken: ShadowToken) => {
  element.style.boxShadow = shadowToken.boxShadow;
  if (shadowToken.filter) {
    element.style.filter = shadowToken.filter;
  }
};

// Animation-ready shadow tokens for smooth transitions
export const transitionShadows = {
  property: 'box-shadow',
  duration: '150ms',
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// Responsive shadow utilities
export interface ResponsiveShadows {
  mobile: ShadowToken;
  desktop: ShadowToken;
}

export const responsiveShadows = {
  card: {
    mobile: shadows.xs,
    desktop: shadows.sm
  },
  modal: {
    mobile: shadows.lg,
    desktop: shadows.xl
  },
  widget: {
    mobile: shadows.sm,
    desktop: shadows.md
  }
};