// Enterprise Design System - Design Tokens
// Comprehensive design token system for Sentia Manufacturing Dashboard

export const designTokens = {
  // Color Palette - Manufacturing-focused brand colors
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#eff6ff',   // Lightest blue
      100: '#dbeafe',  // Very light blue
      200: '#bfdbfe',  // Light blue
      300: '#93c5fd',  // Medium light blue
      400: '#60a5fa',  // Medium blue
      500: '#3b82f6',  // Default blue
      600: '#2563eb',  // Dark blue (primary)
      700: '#1d4ed8',  // Darker blue
      800: '#1e40af',  // Very dark blue
      900: '#1e3a8a',  // Darkest blue
      950: '#172554'   // Ultra dark blue
    },

    // Secondary Colors - Manufacturing Orange/Amber
    secondary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',   // Default amber
      600: '#d97706',   // Dark amber (secondary)
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },

    // Success Colors - Green for KPIs and positive metrics
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',   // Default green
      600: '#16a34a',   // Dark green
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },

    // Warning Colors - Yellow for alerts and warnings
    warning: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',   // Default yellow
      600: '#ca8a04',   // Dark yellow
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006'
    },

    // Error Colors - Red for errors and critical issues
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',   // Default red
      600: '#dc2626',   // Dark red
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },

    // Neutral Colors - Grays for text and backgrounds
    neutral: {
      50: '#f9fafb',    // Almost white
      100: '#f3f4f6',   // Very light gray
      200: '#e5e7eb',   // Light gray
      300: '#d1d5db',   // Medium light gray
      400: '#9ca3af',   // Medium gray
      500: '#6b7280',   // Default gray
      600: '#4b5563',   // Dark gray
      700: '#374151',   // Darker gray
      800: '#1f2937',   // Very dark gray
      900: '#111827',   // Almost black
      950: '#030712'    // Ultra dark
    },

    // Manufacturing Specific Colors
    manufacturing: {
      production: '#22c55e',    // Green for production metrics
      quality: '#3b82f6',       // Blue for quality metrics
      inventory: '#f59e0b',     // Amber for inventory
      maintenance: '#dc2626',   // Red for maintenance alerts
      efficiency: '#8b5cf6',    // Purple for efficiency metrics
      safety: '#f97316',        // Orange for safety metrics
    },

    // Status Colors
    status: {
      online: '#22c55e',
      offline: '#6b7280',
      warning: '#f59e0b',
      error: '#dc2626',
      maintenance: '#8b5cf6',
      idle: '#64748b'
    }
  },

  // Typography Scale
  typography: {
    fontFamilies: {
      sans: [
        'Inter', 
        'ui-sans-serif', 
        'system-ui', 
        '-apple-system', 
        'BlinkMacSystemFont', 
        'Segoe UI', 
        'Roboto', 
        'Helvetica Neue', 
        'Arial', 
        'sans-serif'
      ],
      mono: [
        'JetBrains Mono',
        'ui-monospace',
        'SFMono-Regular',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    },

    fontSizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
      '9xl': '8rem'       // 128px
    },

    fontWeights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },

    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Spacing Scale - Based on 4px grid
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    9: '2.25rem',       // 36px
    10: '2.5rem',       // 40px
    11: '2.75rem',      // 44px
    12: '3rem',         // 48px
    14: '3.5rem',       // 56px
    16: '4rem',         // 64px
    20: '5rem',         // 80px
    24: '6rem',         // 96px
    28: '7rem',         // 112px
    32: '8rem',         // 128px
    36: '9rem',         // 144px
    40: '10rem',        // 160px
    44: '11rem',        // 176px
    48: '12rem',        // 192px
    52: '13rem',        // 208px
    56: '14rem',        // 224px
    60: '15rem',        // 240px
    64: '16rem',        // 256px
    72: '18rem',        // 288px
    80: '20rem',        // 320px
    96: '24rem'         // 384px
  },

  // Border Radius Scale
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px'
  },

  // Shadow Scale
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },

  // Z-Index Scale
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    modal: '1000',
    popover: '1010',
    tooltip: '1020',
    notification: '1030',
    max: '9999'
  },

  // Breakpoints for Responsive Design
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Animation & Transitions
  animation: {
    durations: {
      fastest: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      slowest: '800ms'
    },
    
    easings: {
      linear: 'cubic-bezier(0, 0, 1, 1)',
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // Component Specific Tokens
  components: {
    button: {
      borderRadius: '0.375rem',  // md
      fontWeight: '500',         // medium
      fontSize: '0.875rem',      // sm
      padding: {
        sm: '0.5rem 0.75rem',    // py-2 px-3
        base: '0.625rem 1rem',   // py-2.5 px-4
        lg: '0.75rem 1.25rem',   // py-3 px-5
        xl: '0.875rem 1.5rem'    // py-3.5 px-6
      }
    },

    input: {
      borderRadius: '0.375rem',  // md
      fontSize: '0.875rem',      // sm
      padding: '0.625rem 0.75rem', // py-2.5 px-3
      borderWidth: '1px',
      focusRingWidth: '2px',
      focusRingOffset: '2px'
    },

    card: {
      borderRadius: '0.5rem',    // lg
      padding: '1.5rem',         // p-6
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
      borderWidth: '1px'
    },

    modal: {
      borderRadius: '0.75rem',   // xl
      padding: '2rem',           // p-8
      shadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // shadow-2xl
      backdropBlur: '4px'
    },

    navigation: {
      height: '4rem',            // h-16 (64px)
      padding: '0 1.5rem',       // px-6
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' // shadow
    },

    sidebar: {
      width: '16rem',            // w-64 (256px)
      collapsedWidth: '5rem',    // w-20 (80px)
      padding: '1rem'            // p-4
    }
  },

  // Manufacturing Dashboard Specific
  dashboard: {
    widget: {
      borderRadius: '0.75rem',   // xl
      padding: '1.5rem',         // p-6
      minHeight: '8rem',         // min-h-32
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' // shadow-md
    },

    kpi: {
      borderRadius: '0.5rem',    // lg
      padding: '1rem',           // p-4
      fontSize: '1.875rem',      // text-3xl
      fontWeight: '700'          // font-bold
    },

    chart: {
      borderRadius: '0.5rem',    // lg
      padding: '1rem',           // p-4
      minHeight: '20rem'         // min-h-80
    },

    alert: {
      borderRadius: '0.375rem',  // md
      padding: '0.75rem 1rem',   // py-3 px-4
      borderLeftWidth: '4px'
    }
  }
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  let cssVariables = ':root {\n';

  // Colors
  Object.entries(designTokens.colors).forEach(([colorName, shades]) => {
    if (typeof shades === 'object') {
      Object.entries(shades).forEach(([shade, value]) => {
        cssVariables += `  --color-${colorName}-${shade}: ${value};\n`;
      });
    } else {
      cssVariables += `  --color-${colorName}: ${shades};\n`;
    }
  });

  // Typography
  cssVariables += `  --font-sans: ${designTokens.typography.fontFamilies.sans.join(', ')};\n`;
  cssVariables += `  --font-mono: ${designTokens.typography.fontFamilies.mono.join(', ')};\n`;

  // Spacing
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    cssVariables += `  --spacing-${key}: ${value};\n`;
  });

  // Border Radius
  Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
    cssVariables += `  --radius-${key}: ${value};\n`;
  });

  // Shadows
  Object.entries(designTokens.shadows).forEach(([key, value]) => {
    cssVariables += `  --shadow-${key}: ${value};\n`;
  });

  cssVariables += '}\n';
  return cssVariables;
};

export default designTokens;