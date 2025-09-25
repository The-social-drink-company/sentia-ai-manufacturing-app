/**
 * ENTERPRISE THEME CONFIGURATION
 * World-class UI/UX theme system inspired by Fortune 500 applications
 * Includes Quantum Dark and Crystal Clear themes
 */

export const themes = {
  // QUANTUM DARK THEME - Inspired by Bloomberg Terminal, DataDog, and Palantir
  quantumDark: {
    name: 'Quantum Dark',
    colors: {
      // Background Layers - Deep space color progression
      background: {
        primary: '#0A0E1B',    // Deep Space - main app background
        secondary: '#0F1420',  // Midnight - secondary containers
        tertiary: '#1A1F2E',   // Twilight - tertiary elements
        elevated: '#1E2333',   // Card Surface - elevated components
        overlay: '#252A3A',    // Overlays and modals
        hover: '#2A2F40',      // Hover states
      },

      // Text Colors - High contrast for readability
      text: {
        primary: '#F8FAFC',    // Primary text
        secondary: '#CBD5E1',  // Secondary text
        tertiary: '#94A3B8',   // Muted text
        disabled: '#64748B',   // Disabled text
        inverse: '#0F172A',    // Text on light backgrounds
      },

      // Brand Colors - Electric and vibrant
      brand: {
        primary: '#00D4FF',    // Electric Blue - primary actions
        secondary: '#7C3AED',  // Quantum Purple - secondary accent
        tertiary: '#F97316',   // Sunset Orange - tertiary accent
      },

      // Semantic Colors
      semantic: {
        success: '#10B981',    // Emerald - success states
        warning: '#F59E0B',    // Amber - warnings
        error: '#EF4444',      // Red - errors
        info: '#06B6D4',       // Cyan - information
      },

      // Data Visualization Palette
      chart: {
        primary: ['#00D4FF', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'],
        categorical: [
          '#00D4FF', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
          '#06B6D4', '#EC4899', '#8B5CF6', '#14B8A6', '#FB923C',
          '#F87171', '#38BDF8'
        ],
        sequential: {
          blue: ['#0A0E1B', '#1E3A5F', '#2E5A8F', '#3E7DC0', '#4EA3F0', '#5ECAFF'],
          purple: ['#1A0F2E', '#2E1F4E', '#4A2F7E', '#6B3FAE', '#8E4FDE', '#B15FFF'],
          green: ['#0A1F1B', '#1A3F2E', '#2A5F42', '#3A7F56', '#4A9F6A', '#5ABF7E'],
        },
        diverging: {
          redBlue: ['#EF4444', '#FB7185', '#FCA5A5', '#E5E7EB', '#93C5FD', '#60A5FA', '#3B82F6'],
          purpleOrange: ['#7C3AED', '#A78BFA', '#C4B5FD', '#E5E7EB', '#FED7AA', '#FDBA74', '#F97316'],
        },
        heatmap: {
          viridis: ['#440154', '#482777', '#3F4A8A', '#31678E', '#26838F', '#1F9D8A', '#6CCE59', '#FDE724'],
          plasma: ['#0D0887', '#4B03A1', '#7D03A8', '#A82296', '#CC4778', '#E56B5D', '#F89441', '#FDC328'],
        }
      },

      // Borders and Dividers
      border: {
        default: '#2D3748',
        light: '#1F2937',
        dark: '#0F172A',
        accent: '#00D4FF',
      },

      // Shadows for depth
      shadow: {
        sm: 'rgba(0, 0, 0, 0.3)',
        md: 'rgba(0, 0, 0, 0.5)',
        lg: 'rgba(0, 0, 0, 0.7)',
        glow: 'rgba(0, 212, 255, 0.3)',
      }
    },

    // Typography
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Consolas, monospace',
        display: 'Poppins, Inter, sans-serif',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      }
    },

    // Spacing
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },

    // Border Radius
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },

    // Animations
    animations: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }
    }
  },

  // CRYSTAL CLEAR THEME - Clean, professional light theme
  crystalClear: {
    name: 'Crystal Clear',
    colors: {
      // Background Layers - Clean whites and grays
      background: {
        primary: '#FFFFFF',    // Pure white
        secondary: '#F8FAFC',  // Off-white
        tertiary: '#F1F5F9',   // Light gray
        elevated: '#FFFFFF',   // Elevated surfaces
        overlay: '#F8FAFC',    // Overlays
        hover: '#E2E8F0',      // Hover states
      },

      // Text Colors
      text: {
        primary: '#0F172A',    // Dark navy
        secondary: '#475569',  // Gray
        tertiary: '#64748B',   // Light gray
        disabled: '#94A3B8',   // Disabled
        inverse: '#FFFFFF',    // White text
      },

      // Brand Colors - Vibrant but professional
      brand: {
        primary: '#0EA5E9',    // Sky Blue
        secondary: '#8B5CF6',  // Purple
        tertiary: '#F97316',   // Orange
      },

      // Semantic Colors
      semantic: {
        success: '#059669',    // Green
        warning: '#D97706',    // Amber
        error: '#DC2626',      // Red
        info: '#0891B2',       // Cyan
      },

      // Data Visualization Palette
      chart: {
        primary: ['#0EA5E9', '#8B5CF6', '#059669', '#D97706', '#DC2626', '#0891B2'],
        categorical: [
          '#0EA5E9', '#8B5CF6', '#059669', '#D97706', '#DC2626',
          '#0891B2', '#DB2777', '#7C3AED', '#0D9488', '#EA580C',
          '#EF4444', '#0284C7'
        ],
        sequential: {
          blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'],
          purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7'],
          green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E'],
        },
        diverging: {
          redBlue: ['#DC2626', '#F87171', '#FCA5A5', '#E5E7EB', '#93C5FD', '#60A5FA', '#2563EB'],
          purpleOrange: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E5E7EB', '#FED7AA', '#FB923C', '#EA580C'],
        },
        heatmap: {
          blues: ['#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9', '#0284C7', '#0369A1'],
          greens: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D'],
        }
      },

      // Borders and Dividers
      border: {
        default: '#E5E7EB',
        light: '#F3F4F6',
        dark: '#D1D5DB',
        accent: '#0EA5E9',
      },

      // Shadows for depth
      shadow: {
        sm: 'rgba(0, 0, 0, 0.05)',
        md: 'rgba(0, 0, 0, 0.1)',
        lg: 'rgba(0, 0, 0, 0.15)',
        glow: 'rgba(14, 165, 233, 0.2)',
      }
    },

    // Typography - Same structure as dark theme
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Consolas, monospace',
        display: 'Poppins, Inter, sans-serif',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      }
    },

    // Spacing - Same as dark theme
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },

    // Border Radius - Same as dark theme
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },

    // Animations - Same as dark theme
    animations: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }
    }
  },

  // High Contrast Mode for accessibility
  highContrast: {
    name: 'High Contrast',
    colors: {
      background: {
        primary: '#000000',
        secondary: '#0A0A0A',
        tertiary: '#141414',
        elevated: '#1F1F1F',
        overlay: '#2A2A2A',
        hover: '#353535',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#E5E5E5',
        tertiary: '#CCCCCC',
        disabled: '#999999',
        inverse: '#000000',
      },
      brand: {
        primary: '#00FF00',
        secondary: '#FF00FF',
        tertiary: '#FFFF00',
      },
      semantic: {
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
        info: '#00FFFF',
      },
      border: {
        default: '#FFFFFF',
        light: '#CCCCCC',
        dark: '#666666',
        accent: '#00FF00',
      },
      shadow: {
        sm: 'rgba(255, 255, 255, 0.1)',
        md: 'rgba(255, 255, 255, 0.2)',
        lg: 'rgba(255, 255, 255, 0.3)',
        glow: 'rgba(0, 255, 0, 0.5)',
      }
    }
  }
};

// Default theme
export const defaultTheme = 'quantumDark';

// Theme utility functions
export const getTheme = (themeName) => {
  return themes[themeName] || themes[defaultTheme];
};

export const getThemeColors = (themeName) => {
  const theme = getTheme(themeName);
  return theme.colors;
};

export const getChartTheme = (themeName) => {
  const theme = getTheme(themeName);
  return {
    backgroundColor: theme.colors.background.primary,
    textColor: theme.colors.text.primary,
    gridColor: theme.colors.border.light,
    colors: theme.colors.chart.categorical,
    ...theme.colors.chart
  };
};

// CSS Variables generator for runtime theme switching
export const generateCSSVariables = (themeName) => {
  const theme = getTheme(themeName);
  const cssVars = {};

  // Flatten theme object into CSS variables
  const flatten = (obj, prefix = '') => {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const varName = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        flatten(value, varName);
      } else {
        cssVars[`--${varName}`] = value;
      }
    });
  };

  flatten(theme.colors, 'color');
  flatten(theme.typography, 'font');
  flatten(theme.spacing, 'space');
  flatten(theme.borderRadius, 'radius');
  flatten(theme.animations, 'animation');

  return cssVars;
};

export default themes;
