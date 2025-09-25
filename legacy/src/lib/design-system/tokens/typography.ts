// Typography tokens for the Sentia Manufacturing Dashboard design system

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface TypographyScale {
  display: {
    xl: TypographyToken;
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
  };
  heading: {
    xl: TypographyToken;
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
    xs: TypographyToken;
  };
  body: {
    xl: TypographyToken;
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
    xs: TypographyToken;
  };
  label: {
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
    xs: TypographyToken;
  };
  caption: {
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
  };
  mono: {
    xl: TypographyToken;
    lg: TypographyToken;
    md: TypographyToken;
    sm: TypographyToken;
    xs: TypographyToken;
  };
}

// Font families
export const fontFamilies = {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
  mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
};

// Font weights
export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900
};

// Typography scale using modular scale (1.250 - Major Third)
export const typography: TypographyScale = {
  display: {
    xl: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '4.5rem', // 72px
      fontWeight: fontWeights.bold,
      lineHeight: '1.1',
      letterSpacing: '-0.02em'
    },
    lg: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '3.75rem', // 60px
      fontWeight: fontWeights.bold,
      lineHeight: '1.1',
      letterSpacing: '-0.02em'
    },
    md: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '3rem', // 48px
      fontWeight: fontWeights.bold,
      lineHeight: '1.15',
      letterSpacing: '-0.015em'
    },
    sm: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '2.25rem', // 36px
      fontWeight: fontWeights.bold,
      lineHeight: '1.2',
      letterSpacing: '-0.01em'
    }
  },
  heading: {
    xl: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.875rem', // 30px
      fontWeight: fontWeights.semibold,
      lineHeight: '1.25',
      letterSpacing: '-0.005em'
    },
    lg: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.5rem', // 24px
      fontWeight: fontWeights.semibold,
      lineHeight: '1.3',
      letterSpacing: '-0.005em'
    },
    md: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.25rem', // 20px
      fontWeight: fontWeights.semibold,
      lineHeight: '1.35',
      letterSpacing: '0'
    },
    sm: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.125rem', // 18px
      fontWeight: fontWeights.semibold,
      lineHeight: '1.4',
      letterSpacing: '0'
    },
    xs: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1rem', // 16px
      fontWeight: fontWeights.semibold,
      lineHeight: '1.45',
      letterSpacing: '0'
    }
  },
  body: {
    xl: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.25rem', // 20px
      fontWeight: fontWeights.normal,
      lineHeight: '1.6',
      letterSpacing: '0'
    },
    lg: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1.125rem', // 18px
      fontWeight: fontWeights.normal,
      lineHeight: '1.55',
      letterSpacing: '0'
    },
    md: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1rem', // 16px
      fontWeight: fontWeights.normal,
      lineHeight: '1.5',
      letterSpacing: '0'
    },
    sm: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.875rem', // 14px
      fontWeight: fontWeights.normal,
      lineHeight: '1.45',
      letterSpacing: '0'
    },
    xs: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.75rem', // 12px
      fontWeight: fontWeights.normal,
      lineHeight: '1.4',
      letterSpacing: '0.005em'
    }
  },
  label: {
    lg: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '1rem', // 16px
      fontWeight: fontWeights.medium,
      lineHeight: '1.45',
      letterSpacing: '0'
    },
    md: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.875rem', // 14px
      fontWeight: fontWeights.medium,
      lineHeight: '1.4',
      letterSpacing: '0'
    },
    sm: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.75rem', // 12px
      fontWeight: fontWeights.medium,
      lineHeight: '1.35',
      letterSpacing: '0.01em'
    },
    xs: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.6875rem', // 11px
      fontWeight: fontWeights.medium,
      lineHeight: '1.3',
      letterSpacing: '0.01em',
      textTransform: 'uppercase'
    }
  },
  caption: {
    lg: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.875rem', // 14px
      fontWeight: fontWeights.normal,
      lineHeight: '1.4',
      letterSpacing: '0.005em'
    },
    md: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.75rem', // 12px
      fontWeight: fontWeights.normal,
      lineHeight: '1.35',
      letterSpacing: '0.01em'
    },
    sm: {
      fontFamily: fontFamilies.sans.join(', '),
      fontSize: '0.6875rem', // 11px
      fontWeight: fontWeights.normal,
      lineHeight: '1.3',
      letterSpacing: '0.01em'
    }
  },
  mono: {
    xl: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: '1.25rem', // 20px
      fontWeight: fontWeights.medium,
      lineHeight: '1.4',
      letterSpacing: '0'
    },
    lg: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: '1.125rem', // 18px
      fontWeight: fontWeights.medium,
      lineHeight: '1.4',
      letterSpacing: '0'
    },
    md: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: '1rem', // 16px
      fontWeight: fontWeights.medium,
      lineHeight: '1.4',
      letterSpacing: '0'
    },
    sm: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: '0.875rem', // 14px
      fontWeight: fontWeights.medium,
      lineHeight: '1.35',
      letterSpacing: '0'
    },
    xs: {
      fontFamily: fontFamilies.mono.join(', '),
      fontSize: '0.75rem', // 12px
      fontWeight: fontWeights.medium,
      lineHeight: '1.3',
      letterSpacing: '0'
    }
  }
};

// Typography utilities
export const getTypographyStyles = (token: TypographyToken) => ({
  fontFamily: token.fontFamily,
  fontSize: token.fontSize,
  fontWeight: token.fontWeight,
  lineHeight: token.lineHeight,
  ...(token.letterSpacing && { letterSpacing: token.letterSpacing }),
  ...(token.textTransform && { textTransform: token.textTransform })
});

// Generate CSS variables for typography
export const generateTypographyVariables = (typography: TypographyScale) => {
  const cssVariables: Record<string, string> = {};
  
  Object.entries(typography).forEach(([category, sizes]) => {
    Object.entries(sizes).forEach(([size, token]) => {
      cssVariables[`--typography-${category}-${size}-font-family`] = token.fontFamily;
      cssVariables[`--typography-${category}-${size}-font-size`] = token.fontSize;
      cssVariables[`--typography-${category}-${size}-font-weight`] = token.fontWeight.toString();
      cssVariables[`--typography-${category}-${size}-line-height`] = token.lineHeight;
      
      if (token.letterSpacing) {
        cssVariables[`--typography-${category}-${size}-letter-spacing`] = token.letterSpacing;
      }
      
      if (token.textTransform) {
        cssVariables[`--typography-${category}-${size}-text-transform`] = token.textTransform;
      }
    });
  });
  
  return cssVariables;
};

// Responsive typography utilities
export interface ResponsiveTypography {
  mobile: TypographyToken;
  tablet?: TypographyToken;
  desktop: TypographyToken;
}

export const responsiveHeadings = {
  hero: {
    mobile: typography.display.md,
    desktop: typography.display.xl
  },
  pageTitle: {
    mobile: typography.display.sm,
    desktop: typography.display.lg
  },
  sectionTitle: {
    mobile: typography.heading.md,
    desktop: typography.heading.xl
  },
  cardTitle: {
    mobile: typography.heading.sm,
    desktop: typography.heading.lg
  }
};

// Text style presets for common use cases
export const textStyles = {
  // Dashboard specific styles
  kpiValue: {
    fontFamily: fontFamilies.mono.join(', '),
    fontSize: '2.25rem', // 36px
    fontWeight: fontWeights.bold,
    lineHeight: '1.1',
    letterSpacing: '-0.01em'
  },
  metricLabel: {
    fontFamily: fontFamilies.sans.join(', '),
    fontSize: '0.75rem', // 12px
    fontWeight: fontWeights.medium,
    lineHeight: '1.3',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const
  },
  statusBadge: {
    fontFamily: fontFamilies.sans.join(', '),
    fontSize: '0.6875rem', // 11px
    fontWeight: fontWeights.semibold,
    lineHeight: '1.2',
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const
  },
  tableHeader: {
    fontFamily: fontFamilies.sans.join(', '),
    fontSize: '0.75rem', // 12px
    fontWeight: fontWeights.semibold,
    lineHeight: '1.3',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const
  },
  code: {
    fontFamily: fontFamilies.mono.join(', '),
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeights.normal,
    lineHeight: '1.4',
    letterSpacing: '0'
  }
};