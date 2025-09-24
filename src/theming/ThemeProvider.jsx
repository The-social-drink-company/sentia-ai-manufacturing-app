import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { logInfo, logWarn } from '../services/observability/structuredLogger.js';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = 'sentia-theme-preference';
const THEME_TRANSITION_DURATION = 200; // milliseconds

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Enterprise theme tokens based on design system
const THEME_TOKENS = {
  light: {
    // Background colors
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#f1f5f9',
    '--bg-card': '#ffffff',
    '--bg-overlay': 'rgba(0, 0, 0, 0.1)',
    
    // Text colors
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-tertiary': '#64748b',
    '--text-inverse': '#ffffff',
    '--text-muted': '#94a3b8',
    
    // Border colors
    '--border-primary': '#e2e8f0',
    '--border-secondary': '#cbd5e1',
    '--border-focus': '#3b82f6',
    
    // Status colors
    '--status-success': '#10b981',
    '--status-warning': '#f59e0b',
    '--status-error': '#ef4444',
    '--status-info': '#3b82f6',
    
    // Manufacturing specific colors
    '--manufacturing-primary': '#1e40af',
    '--manufacturing-secondary': '#0ea5e9',
    '--manufacturing-accent': '#06b6d4',
    '--manufacturing-success': '#059669',
    '--manufacturing-warning': '#d97706',
    '--manufacturing-critical': '#dc2626',
    
    // Interactive colors
    '--interactive-primary': '#3b82f6',
    '--interactive-primary-hover': '#2563eb',
    '--interactive-secondary': '#6b7280',
    '--interactive-secondary-hover': '#4b5563',
    
    // Shadow colors
    '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  dark: {
    // Background colors
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--bg-card': '#1e293b',
    '--bg-overlay': 'rgba(255, 255, 255, 0.1)',
    
    // Text colors
    '--text-primary': '#f8fafc',
    '--text-secondary': '#cbd5e1',
    '--text-tertiary': '#94a3b8',
    '--text-inverse': '#0f172a',
    '--text-muted': '#64748b',
    
    // Border colors
    '--border-primary': '#334155',
    '--border-secondary': '#475569',
    '--border-focus': '#60a5fa',
    
    // Status colors
    '--status-success': '#34d399',
    '--status-warning': '#fbbf24',
    '--status-error': '#f87171',
    '--status-info': '#60a5fa',
    
    // Manufacturing specific colors
    '--manufacturing-primary': '#3b82f6',
    '--manufacturing-secondary': '#0ea5e9',
    '--manufacturing-accent': '#06b6d4',
    '--manufacturing-success': '#10b981',
    '--manufacturing-warning': '#f59e0b',
    '--manufacturing-critical': '#ef4444',
    
    // Interactive colors
    '--interactive-primary': '#60a5fa',
    '--interactive-primary-hover': '#3b82f6',
    '--interactive-secondary': '#9ca3af',
    '--interactive-secondary-hover': '#d1d5db',
    
    // Shadow colors
    '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage or default to system
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored || THEMES.SYSTEM;
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [systemTheme, setSystemTheme] = useState('light');

  // Detect system theme preference
  const detectSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Apply theme tokens to CSS custom properties
  const applyThemeTokens = useCallback((themeName) => {
    if (typeof document === 'undefined') return;

    const tokens = THEME_TOKENS[themeName];
    if (!tokens) {
      logWarn('Theme not found, falling back to light theme', { theme: themeName });
      return applyThemeTokens('light');
    }

    const root = document.documentElement;
    
    // Apply theme tokens
    Object.entries(tokens).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Update data attribute for CSS targeting
    root.setAttribute('data-theme', themeName);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', tokens['--bg-primary']);
    }

    logInfo('Theme tokens applied successfully', { theme: themeName });
  }, []);

  // Smooth transition between themes
  const applyThemeWithTransition = useCallback((newTheme) => {
    if (typeof document === 'undefined') return;

    setIsTransitioning(true);

    // Add transition styles
    const root = document.documentElement;
    root.style.setProperty('--theme-transition', `all ${THEME_TRANSITION_DURATION}ms ease-in-out`);

    // Apply new theme
    applyThemeTokens(newTheme);

    // Remove transition after animation completes
    setTimeout(() => {
      root.style.removeProperty('--theme-transition');
      setIsTransitioning(false);
    }, THEME_TRANSITION_DURATION);
  }, [applyThemeTokens]);

  // System theme change listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialSystemTheme = detectSystemTheme();
    setSystemTheme(initialSystemTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      logInfo('System theme changed', { 
        oldTheme: systemTheme, 
        newTheme: newSystemTheme 
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [detectSystemTheme, systemTheme]);

  // Resolve theme based on preference and system
  useEffect(() => {
    let newResolvedTheme;

    switch (theme) {
      case THEMES.DARK:
        newResolvedTheme = 'dark';
        break;
      case THEMES.LIGHT:
        newResolvedTheme = 'light';
        break;
      case THEMES.SYSTEM:
      default:
        newResolvedTheme = systemTheme;
        break;
    }

    if (newResolvedTheme !== resolvedTheme) {
      setResolvedTheme(newResolvedTheme);
      applyThemeWithTransition(newResolvedTheme);
    }
  }, [theme, systemTheme, resolvedTheme, applyThemeWithTransition]);

  // Persist theme preference
  const updateTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      logWarn('Invalid theme provided, ignoring', { theme: newTheme });
      return;
    }

    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    logInfo('Theme preference updated', { 
      oldTheme: theme, 
      newTheme: newTheme 
    });
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? THEMES.DARK : THEMES.LIGHT;
    updateTheme(newTheme);
  }, [resolvedTheme, updateTheme]);

  // Get theme-aware CSS classes
  const getThemeClasses = useCallback((classMap = {}) => {
    const baseClasses = classMap.base || '';
    const themeClasses = classMap[resolvedTheme] || '';
    return `${baseClasses} ${themeClasses}`.trim();
  }, [resolvedTheme]);

  // Theme-aware color utilities
  const getThemeColor = useCallback((colorName) => {
    if (typeof document === 'undefined') return '';
    
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue(`--${colorName}`).trim();
  }, []);

  const contextValue = {
    // Current theme state
    theme,
    resolvedTheme,
    systemTheme,
    isTransitioning,
    
    // Theme control methods
    setTheme: updateTheme,
    toggleTheme,
    
    // Utility methods
    getThemeClasses,
    getThemeColor,
    
    // Theme constants
    themes: THEMES,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === THEMES.SYSTEM
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;