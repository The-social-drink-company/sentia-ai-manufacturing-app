// Responsive breakpoint tokens for the Sentia Manufacturing Dashboard design system

export interface BreakpointScale {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface BreakpointValues {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// Breakpoint values in pixels
export const breakpointValues: BreakpointValues = {
  sm: 640,   // Mobile
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Wide
  '2xl': 1536 // Ultra-wide
};

// Breakpoints as CSS values
export const breakpoints: BreakpointScale = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Device categories for semantic naming
export interface DeviceCategories {
  mobile: {
    min: number;
    max: number;
    breakpoint: keyof BreakpointScale;
  };
  tablet: {
    min: number;
    max: number;
    breakpoint: keyof BreakpointScale;
  };
  desktop: {
    min: number;
    max: number;
    breakpoint: keyof BreakpointScale;
  };
  wide: {
    min: number;
    max: number;
    breakpoint: keyof BreakpointScale;
  };
  ultrawide: {
    min: number;
    max?: number;
    breakpoint: keyof BreakpointScale;
  };
}

export const deviceCategories: DeviceCategories = {
  mobile: {
    min: 0,
    max: breakpointValues.md - 1, // 0-767px
    breakpoint: 'sm'
  },
  tablet: {
    min: breakpointValues.md,
    max: breakpointValues.lg - 1,  // 768-1023px
    breakpoint: 'md'
  },
  desktop: {
    min: breakpointValues.lg,
    max: breakpointValues.xl - 1,  // 1024-1279px
    breakpoint: 'lg'
  },
  wide: {
    min: breakpointValues.xl,
    max: breakpointValues['2xl'] - 1, // 1280-1535px
    breakpoint: 'xl'
  },
  ultrawide: {
    min: breakpointValues['2xl'],     // 1536px+
    breakpoint: '2xl'
  }
};

// Container max-widths for different breakpoints
export interface ContainerWidths {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export const containerWidths: ContainerWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Dashboard-specific layout breakpoints
export interface DashboardBreakpoints {
  sidebar: {
    collapse: number;    // When to collapse sidebar
    hide: number;        // When to hide sidebar completely
  };
  navigation: {
    mobile: number;      // When to switch to mobile nav
    compact: number;     // When to use compact navigation
  };
  grid: {
    single: number;      // Single column layout
    double: number;      // Two column layout
    triple: number;      // Three column layout
    quad: number;        // Four column layout
  };
  widgets: {
    stack: number;       // Stack widgets vertically
    compact: number;     // Use compact widget layout
  };
}

export const dashboardBreakpoints: DashboardBreakpoints = {
  sidebar: {
    collapse: breakpointValues.lg,  // 1024px
    hide: breakpointValues.md       // 768px
  },
  navigation: {
    mobile: breakpointValues.md,    // 768px
    compact: breakpointValues.lg    // 1024px
  },
  grid: {
    single: breakpointValues.sm,    // 640px
    double: breakpointValues.md,    // 768px
    triple: breakpointValues.lg,    // 1024px
    quad: breakpointValues.xl       // 1280px
  },
  widgets: {
    stack: breakpointValues.sm,     // 640px
    compact: breakpointValues.md    // 768px
  }
};

// Media query utilities
export const mediaQueries = {
  // Min-width queries (mobile-first)
  up: (breakpoint: keyof BreakpointScale) => 
    `@media (min-width: ${breakpoints[breakpoint]})`,
  
  // Max-width queries (desktop-first)
  down: (breakpoint: keyof BreakpointScale) => {
    const value = breakpointValues[breakpoint] - 1;
    return `@media (max-width: ${value}px)`;
  },
  
  // Between two breakpoints
  between: (min: keyof BreakpointScale, max: keyof BreakpointScale) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpointValues[max] - 1}px)`,
  
  // Only specific breakpoint range
  only: (breakpoint: keyof BreakpointScale) => {
    const keys = Object.keys(breakpoints) as (keyof BreakpointScale)[];
    const index = keys.indexOf(breakpoint);
    
    if (index === 0) {
      // First breakpoint: 0 to next breakpoint
      return `@media (max-width: ${breakpointValues[keys[1]] - 1}px)`;
    } else if (index === keys.length - 1) {
      // Last breakpoint: this breakpoint to infinity
      return `@media (min-width: ${breakpoints[breakpoint]})`;
    } else {
      // Middle breakpoint: this to next
      return `@media (min-width: ${breakpoints[breakpoint]}) and (max-width: ${breakpointValues[keys[index + 1]] - 1}px)`;
    }
  },
  
  // Custom media queries for common use cases
  mobile: `@media (max-width: ${breakpointValues.md - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpointValues.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
  
  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // Device pixel ratio queries
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx)',
  
  // Hover capability queries
  hover: '@media (hover: hover)',
  touch: '@media (hover: none)',
  
  // Reduced motion preference
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  motionOk: '@media (prefers-reduced-motion: no-preference)',
  
  // Color scheme preference
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)'
};

// CSS Grid breakpoint utilities
export const gridBreakpoints = {
  columns: {
    sm: 4,   // 4 columns on small screens
    md: 8,   // 8 columns on medium screens
    lg: 12,  // 12 columns on large screens
    xl: 12,  // 12 columns on extra large screens
    '2xl': 12 // 12 columns on ultra-wide screens
  },
  
  gaps: {
    sm: '16px',   // 16px gap on small screens
    md: '20px',   // 20px gap on medium screens
    lg: '24px',   // 24px gap on large screens
    xl: '28px',   // 28px gap on extra large screens
    '2xl': '32px' // 32px gap on ultra-wide screens
  }
};

// Responsive utilities for CSS-in-JS
export const responsiveUtils = {
  // Apply styles at specific breakpoint and above
  fromBreakpoint: (breakpoint: keyof BreakpointScale, styles: Record<string, any>) => ({
    [mediaQueries.up(breakpoint)]: styles
  }),
  
  // Apply styles below specific breakpoint
  belowBreakpoint: (breakpoint: keyof BreakpointScale, styles: Record<string, any>) => ({
    [mediaQueries.down(breakpoint)]: styles
  }),
  
  // Apply styles only at specific breakpoint range
  atBreakpoint: (breakpoint: keyof BreakpointScale, styles: Record<string, any>) => ({
    [mediaQueries.only(breakpoint)]: styles
  }),
  
  // Apply different styles at different breakpoints
  responsive: (styleMap: Partial<Record<keyof BreakpointScale | 'base', Record<string, any>>>) => {
    const styles: Record<string, any> = {};
    
    if (styleMap.base) {
      Object.assign(styles, styleMap.base);
    }
    
    Object.entries(styleMap).forEach(([breakpoint, breakpointStyles]) => {
      if (breakpoint !== 'base' && breakpointStyles) {
        styles[mediaQueries.up(breakpoint as keyof BreakpointScale)] = breakpointStyles;
      }
    });
    
    return styles;
  }
};

// Generate CSS variables for breakpoints
export const generateBreakpointVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Breakpoint values
  Object.entries(breakpoints).forEach(([key, value]) => {
    cssVariables[`--breakpoint-${key}`] = value;
  });
  
  // Container widths
  Object.entries(containerWidths).forEach(([key, value]) => {
    cssVariables[`--container-${key}`] = value;
  });
  
  // Grid columns
  Object.entries(gridBreakpoints.columns).forEach(([key, value]) => {
    cssVariables[`--grid-columns-${key}`] = value.toString();
  });
  
  // Grid gaps
  Object.entries(gridBreakpoints.gaps).forEach(([key, value]) => {
    cssVariables[`--grid-gap-${key}`] = value;
  });
  
  return cssVariables;
};

// Utility functions
export const getBreakpointValue = (breakpoint: keyof BreakpointScale): number => {
  return breakpointValues[breakpoint];
};

export const getCurrentBreakpoint = (width: number): keyof BreakpointScale => {
  if (width >= breakpointValues['2xl']) return '2xl';
  if (width >= breakpointValues.xl) return 'xl';
  if (width >= breakpointValues.lg) return 'lg';
  if (width >= breakpointValues.md) return 'md';
  return 'sm';
};

export const getDeviceCategory = (width: number): keyof DeviceCategories => {
  if (width >= deviceCategories.ultrawide.min) return 'ultrawide';
  if (width >= deviceCategories.wide.min) return 'wide';
  if (width >= deviceCategories.desktop.min) return 'desktop';
  if (width >= deviceCategories.tablet.min) return 'tablet';
  return 'mobile';
};

export const isBreakpointActive = (breakpoint: keyof BreakpointScale, currentWidth: number): boolean => {
  return currentWidth >= breakpointValues[breakpoint];
};

// Hook-ready utilities for React components
export const useBreakpointHelpers = () => {
  return {
    mediaQueries,
    responsiveUtils,
    getBreakpointValue,
    getCurrentBreakpoint,
    getDeviceCategory,
    isBreakpointActive
  };
};