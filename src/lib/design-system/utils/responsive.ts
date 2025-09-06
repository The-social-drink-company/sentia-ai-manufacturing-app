// Responsive utilities for the Sentia Manufacturing Dashboard design system

import { breakpoints, breakpointValues, deviceCategories } from '../tokens/breakpoints';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

// Responsive value types
export type ResponsiveValue<T> = T | {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

export type BreakpointKey = keyof typeof breakpoints;
export type DeviceType = keyof typeof deviceCategories;

// Media query builder
export const createMediaQuery = {
  up: (breakpoint: BreakpointKey) => `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint: BreakpointKey) => {
    const value = breakpointValues[breakpoint] - 1;
    return `@media (max-width: ${value}px)`;
  },
  between: (min: BreakpointKey, max: BreakpointKey) => {
    const maxValue = breakpointValues[max] - 1;
    return `@media (min-width: ${breakpoints[min]}) and (max-width: ${maxValue}px)`;
  },
  only: (breakpoint: BreakpointKey) => {
    const keys = Object.keys(breakpoints) as BreakpointKey[];
    const index = keys.indexOf(breakpoint);
    
    if (index === 0) {
      return `@media (max-width: ${breakpointValues[keys[1]] - 1}px)`;
    } else if (index === keys.length - 1) {
      return `@media (min-width: ${breakpoints[breakpoint]})`;
    } else {
      const nextBreakpoint = keys[index + 1];
      return `@media (min-width: ${breakpoints[breakpoint]}) and (max-width: ${breakpointValues[nextBreakpoint] - 1}px)`;
    }
  }
};

// Responsive value resolver
export const resolveResponsiveValue = <T>(
  value: ResponsiveValue<T>,
  currentBreakpoint: BreakpointKey
): T => {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }
  
  const responsiveValue = value as Record<string, T>;
  const breakpointOrder: BreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Find the appropriate value by going down the breakpoint hierarchy
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (responsiveValue[bp] !== undefined) {
      return responsiveValue[bp];
    }
  }
  
  // Return the first available value if no match found
  return Object.values(responsiveValue)[0] as T;
};

// Generate responsive styles for CSS-in-JS
export const responsiveStyles = <T extends Record<string, any>>(
  styleMap: ResponsiveValue<T>
): Record<string, T | Record<string, T>> => {
  if (typeof styleMap !== 'object' || styleMap === null) {
    return styleMap as T;
  }
  
  const styles: Record<string, T | Record<string, T>> = {};
  const responsiveMap = styleMap as Record<string, T>;
  
  // Apply base styles (sm is mobile-first base)
  if (responsiveMap.sm) {
    Object.assign(styles, responsiveMap.sm);
  }
  
  // Apply responsive styles
  const breakpointKeys: BreakpointKey[] = ['md', 'lg', 'xl', '2xl'];
  breakpointKeys.forEach(bp => {
    if (responsiveMap[bp]) {
      styles[createMediaQuery.up(bp)] = responsiveMap[bp];
    }
  });
  
  return styles;
};

// Responsive spacing utilities
export const responsiveSpacing = {
  // Generate responsive padding
  padding: (value: ResponsiveValue<keyof typeof spacing>) => 
    responsiveStyles(
      typeof value === 'object' 
        ? Object.entries(value).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { padding: spacing[val as keyof typeof spacing] }
          }), {})
        : { padding: spacing[value as keyof typeof spacing] }
    ),
  
  // Generate responsive margin
  margin: (value: ResponsiveValue<keyof typeof spacing>) => 
    responsiveStyles(
      typeof value === 'object' 
        ? Object.entries(value).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { margin: spacing[val as keyof typeof spacing] }
          }), {})
        : { margin: spacing[value as keyof typeof spacing] }
    ),
  
  // Generate responsive gap
  gap: (value: ResponsiveValue<keyof typeof spacing>) => 
    responsiveStyles(
      typeof value === 'object' 
        ? Object.entries(value).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { gap: spacing[val as keyof typeof spacing] }
          }), {})
        : { gap: spacing[value as keyof typeof spacing] }
    )
};

// Responsive typography utilities
export const responsiveTypography = {
  // Generate responsive font sizes
  fontSize: (value: ResponsiveValue<{ category: string; size: string }>) => {
    const getFontSize = (typographyValue: { category: string; size: string }) => {
      const token = (typography as any)[typographyValue.category]?.[typographyValue.size];
      return token?.fontSize || '1rem';
    };
    
    return responsiveStyles(
      typeof value === 'object' && 'sm' in value
        ? Object.entries(value).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { fontSize: getFontSize(val as { category: string; size: string }) }
          }), {})
        : { fontSize: getFontSize(value as { category: string; size: string }) }
    );
  },
  
  // Generate complete responsive typography styles
  text: (value: ResponsiveValue<{ category: string; size: string }>) => {
    const getTypographyStyles = (typographyValue: { category: string; size: string }) => {
      const token = (typography as any)[typographyValue.category]?.[typographyValue.size];
      if (!token) return {};
      
      return {
        fontFamily: token.fontFamily,
        fontSize: token.fontSize,
        fontWeight: token.fontWeight,
        lineHeight: token.lineHeight,
        ...(token.letterSpacing && { letterSpacing: token.letterSpacing })
      };
    };
    
    return responsiveStyles(
      typeof value === 'object' && 'sm' in value
        ? Object.entries(value).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: getTypographyStyles(val as { category: string; size: string })
          }), {})
        : getTypographyStyles(value as { category: string; size: string })
    );
  }
};

// Grid system utilities
export interface GridProps {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<keyof typeof spacing>;
  templateColumns?: ResponsiveValue<string>;
}

export const responsiveGrid = ({
  columns,
  gap,
  templateColumns
}: GridProps) => {
  const styles: Record<string, any> = {
    display: 'grid'
  };
  
  if (columns) {
    const columnStyles = responsiveStyles(
      typeof columns === 'object' 
        ? Object.entries(columns).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { gridTemplateColumns: `repeat(${val}, 1fr)` }
          }), {})
        : { gridTemplateColumns: `repeat(${columns}, 1fr)` }
    );
    Object.assign(styles, columnStyles);
  }
  
  if (templateColumns) {
    const templateStyles = responsiveStyles(
      typeof templateColumns === 'object' 
        ? Object.entries(templateColumns).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { gridTemplateColumns: val }
          }), {})
        : { gridTemplateColumns: templateColumns }
    );
    Object.assign(styles, templateStyles);
  }
  
  if (gap) {
    const gapStyles = responsiveSpacing.gap(gap);
    Object.assign(styles, gapStyles);
  }
  
  return styles;
};

// Flexbox utilities
export interface FlexProps {
  direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>;
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>;
  justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>;
  align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'>;
  gap?: ResponsiveValue<keyof typeof spacing>;
}

export const responsiveFlex = ({
  direction,
  wrap,
  justify,
  align,
  gap
}: FlexProps) => {
  const styles: Record<string, any> = {
    display: 'flex'
  };
  
  if (direction) {
    const directionStyles = responsiveStyles(
      typeof direction === 'object' 
        ? Object.entries(direction).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { flexDirection: val }
          }), {})
        : { flexDirection: direction }
    );
    Object.assign(styles, directionStyles);
  }
  
  if (wrap) {
    const wrapStyles = responsiveStyles(
      typeof wrap === 'object' 
        ? Object.entries(wrap).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { flexWrap: val }
          }), {})
        : { flexWrap: wrap }
    );
    Object.assign(styles, wrapStyles);
  }
  
  if (justify) {
    const justifyStyles = responsiveStyles(
      typeof justify === 'object' 
        ? Object.entries(justify).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { justifyContent: val }
          }), {})
        : { justifyContent: justify }
    );
    Object.assign(styles, justifyStyles);
  }
  
  if (align) {
    const alignStyles = responsiveStyles(
      typeof align === 'object' 
        ? Object.entries(align).reduce((acc, [bp, val]) => ({
            ...acc,
            [bp]: { alignItems: val }
          }), {})
        : { alignItems: align }
    );
    Object.assign(styles, alignStyles);
  }
  
  if (gap) {
    const gapStyles = responsiveSpacing.gap(gap);
    Object.assign(styles, gapStyles);
  }
  
  return styles;
};

// Container utilities
export const container = {
  // Responsive container with max-widths
  responsive: (padding: ResponsiveValue<keyof typeof spacing> = { sm: '4', lg: '8' }) => ({
    width: '100%',
    maxWidth: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...responsiveSpacing.padding(padding),
    [createMediaQuery.up('sm')]: {
      maxWidth: '640px'
    },
    [createMediaQuery.up('md')]: {
      maxWidth: '768px'
    },
    [createMediaQuery.up('lg')]: {
      maxWidth: '1024px'
    },
    [createMediaQuery.up('xl')]: {
      maxWidth: '1280px'
    },
    [createMediaQuery.up('2xl')]: {
      maxWidth: '1536px'
    }
  }),
  
  // Fluid container (full width with padding)
  fluid: (padding: ResponsiveValue<keyof typeof spacing> = { sm: '4', lg: '8' }) => ({
    width: '100%',
    ...responsiveSpacing.padding(padding)
  })
};

// Visibility utilities
export const visibility = {
  // Show only on specific breakpoints
  showOn: (...breakpoints: BreakpointKey[]) => {
    const styles: Record<string, any> = { display: 'none' };
    
    breakpoints.forEach(bp => {
      styles[createMediaQuery.up(bp)] = { display: 'block' };
    });
    
    return styles;
  },
  
  // Hide on specific breakpoints
  hideOn: (...breakpoints: BreakpointKey[]) => {
    const styles: Record<string, any> = {};
    
    breakpoints.forEach(bp => {
      styles[createMediaQuery.up(bp)] = { display: 'none' };
    });
    
    return styles;
  },
  
  // Show only on mobile
  mobileOnly: {
    [createMediaQuery.up('md')]: {
      display: 'none'
    }
  },
  
  // Hide on mobile
  desktopOnly: {
    display: 'none',
    [createMediaQuery.up('md')]: {
      display: 'block'
    }
  }
};

// Utility functions for runtime breakpoint detection
export const getBreakpoint = (width: number): BreakpointKey => {
  if (width >= breakpointValues['2xl']) return '2xl';
  if (width >= breakpointValues.xl) return 'xl';
  if (width >= breakpointValues.lg) return 'lg';
  if (width >= breakpointValues.md) return 'md';
  return 'sm';
};

export const getDeviceType = (width: number): DeviceType => {
  if (width >= deviceCategories.ultrawide.min) return 'ultrawide';
  if (width >= deviceCategories.wide.min) return 'wide';
  if (width >= deviceCategories.desktop.min) return 'desktop';
  if (width >= deviceCategories.tablet.min) return 'tablet';
  return 'mobile';
};

export const isBreakpointActive = (breakpoint: BreakpointKey, width: number): boolean => {
  return width >= breakpointValues[breakpoint];
};