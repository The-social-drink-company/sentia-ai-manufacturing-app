// Theme utility functions for consistent theme-aware styling across components

/**
 * Generate theme-aware CSS classes
 * @param {string} resolvedTheme - Current resolved theme ('light' or 'dark')
 * @param {Object} classMap - Map of theme-specific classes
 * @returns {string} Combined CSS classes
 */
export const getThemeClasses = (resolvedTheme, classMap = {}) => {
  const {
    base = '',
    light = '',
    dark = '',
    common = ''
  } = classMap;

  const themeSpecific = resolvedTheme === 'dark' ? dark : light;
  return [base, common, themeSpecific].filter(Boolean).join(' ');
};

/**
 * Common theme class patterns for consistent styling
 */
export const THEME_CLASSES = {
  // Card backgrounds
  card: {
    base: 'rounded-lg border shadow-sm',
    light: 'bg-white border-gray-200',
    dark: 'bg-slate-800 border-slate-700'
  },
  
  // Text colors
  textPrimary: {
    light: 'text-gray-900',
    dark: 'text-gray-100'
  },
  
  textSecondary: {
    light: 'text-gray-600',
    dark: 'text-gray-300'
  },
  
  textMuted: {
    light: 'text-gray-500',
    dark: 'text-gray-400'
  },
  
  // Background colors
  bgPrimary: {
    light: 'bg-white',
    dark: 'bg-slate-900'
  },
  
  bgSecondary: {
    light: 'bg-gray-50',
    dark: 'bg-slate-800'
  },
  
  // Input styles
  input: {
    base: 'rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
    light: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    dark: 'bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400'
  },
  
  // Button variants
  buttonSecondary: {
    base: 'rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500',
    light: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    dark: 'bg-slate-700 text-gray-100 hover:bg-slate-600'
  },
  
  // Manufacturing status indicators
  statusSuccess: {
    base: 'px-2 py-1 rounded-full text-xs font-medium',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-green-900/30 text-green-400'
  },
  
  statusWarning: {
    base: 'px-2 py-1 rounded-full text-xs font-medium',
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-900/30 text-yellow-400'
  },
  
  statusError: {
    base: 'px-2 py-1 rounded-full text-xs font-medium',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-900/30 text-red-400'
  },
  
  statusInfo: {
    base: 'px-2 py-1 rounded-full text-xs font-medium',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-900/30 text-blue-400'
  }
};

/**
 * Manufacturing-specific theme utilities
 */
export const MANUFACTURING_THEME_CLASSES = {
  // KPI Card styling
  kpiCard: {
    base: 'p-6 rounded-lg border shadow-sm',
    light: 'bg-white border-gray-200',
    dark: 'bg-slate-800 border-slate-700'
  },
  
  // Production status colors
  productionActive: {
    base: 'font-semibold',
    light: 'text-green-600',
    dark: 'text-green-400'
  },
  
  productionIdle: {
    base: 'font-semibold',
    light: 'text-yellow-600',
    dark: 'text-yellow-400'
  },
  
  productionDown: {
    base: 'font-semibold',
    light: 'text-red-600',
    dark: 'text-red-400'
  },
  
  // Chart containers
  chartContainer: {
    base: 'p-4 rounded-lg border',
    light: 'bg-white border-gray-200',
    dark: 'bg-slate-800 border-slate-700'
  },
  
  // Data table styling
  tableHeader: {
    base: 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
    light: 'bg-gray-50 text-gray-500',
    dark: 'bg-slate-700 text-gray-300'
  },
  
  tableRow: {
    base: 'border-b',
    light: 'bg-white border-gray-200 hover:bg-gray-50',
    dark: 'bg-slate-800 border-slate-700 hover:bg-slate-700'
  }
};

/**
 * Get CSS custom property value for current theme
 * @param {string} propertyName - CSS custom property name (without --)
 * @returns {string} Property value
 */
export const getCSSCustomProperty = (propertyName) => {
  if (typeof document === 'undefined') return '';
  
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(`--${propertyName}`).trim();
};

/**
 * Apply theme-aware inline styles
 * @param {string} resolvedTheme - Current resolved theme
 * @param {Object} styleMap - Map of theme-specific styles
 * @returns {Object} Style object
 */
export const getThemeStyles = (resolvedTheme, styleMap = {}) => {
  const {
    base = {},
    light = {},
    dark = {},
    common = {}
  } = styleMap;

  const themeSpecific = resolvedTheme === 'dark' ? dark : light;
  
  return {
    ...base,
    ...common,
    ...themeSpecific
  };
};

/**
 * Chart.js theme configuration generator
 * @param {string} resolvedTheme - Current resolved theme
 * @returns {Object} Chart.js theme options
 */
export const getChartThemeOptions = (resolvedTheme) => {
  const isDark = resolvedTheme === 'dark';
  
  return {
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#f1f5f9' : '#0f172a'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#cbd5e1' : '#475569'
        },
        grid: {
          color: isDark ? '#334155' : '#e2e8f0'
        }
      },
      y: {
        ticks: {
          color: isDark ? '#cbd5e1' : '#475569'
        },
        grid: {
          color: isDark ? '#334155' : '#e2e8f0'
        }
      }
    }
  };
};

/**
 * Generate theme-aware manufacturing status colors
 * @param {string} status - Manufacturing status
 * @param {string} resolvedTheme - Current resolved theme
 * @returns {Object} Color configuration
 */
export const getManufacturingStatusColors = (status, resolvedTheme) => {
  const isDark = resolvedTheme === 'dark';
  
  const colorMap = {
    active: {
      light: { bg: '#10b981', text: '#ffffff' },
      dark: { bg: '#34d399', text: '#0f172a' }
    },
    idle: {
      light: { bg: '#f59e0b', text: '#ffffff' },
      dark: { bg: '#fbbf24', text: '#0f172a' }
    },
    down: {
      light: { bg: '#ef4444', text: '#ffffff' },
      dark: { bg: '#f87171', text: '#0f172a' }
    },
    maintenance: {
      light: { bg: '#6b7280', text: '#ffffff' },
      dark: { bg: '#9ca3af', text: '#0f172a' }
    }
  };
  
  return colorMap[status]?.[isDark ? 'dark' : 'light'] || colorMap.idle[isDark ? 'dark' : 'light'];
};

/**
 * Validate and sanitize theme value
 * @param {string} theme - Theme value to validate
 * @returns {string} Valid theme value
 */
export const validateTheme = (theme) => {
  const validThemes = ['light', 'dark', 'system'];
  return validThemes.includes(theme) ? theme : 'system';
};

export default {
  getThemeClasses,
  THEME_CLASSES,
  MANUFACTURING_THEME_CLASSES,
  getCSSCustomProperty,
  getThemeStyles,
  getChartThemeOptions,
  getManufacturingStatusColors,
  validateTheme
};
