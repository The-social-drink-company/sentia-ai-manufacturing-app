import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { logInfo, logWarn } from '../services/observability/structuredLogger.js';
import {
  themes as themeDefinitions,
  defaultTheme as defaultThemeKey,
  generateCSSVariables,
  getTheme
} from '../config/theme.config.js';

const ThemeContext = createContext(null);

export const THEMES = {
  LIGHT: 'crystalClear',
  DARK: 'quantumDark',
  HIGH_CONTRAST: 'highContrast',
  SYSTEM: 'system'
};

const THEME_STORAGE_KEY = 'sentia-theme-preference';
const THEME_TRANSITION_DURATION = 200;
const AVAILABLE_THEME_KEYS = Object.keys(themeDefinitions);
const FALLBACK_THEME = AVAILABLE_THEME_KEYS.includes(defaultThemeKey)
  ? defaultThemeKey
  : THEMES.DARK;
const DEFAULT_LIGHT_THEME = THEMES.LIGHT;
const DEFAULT_DARK_THEME = THEMES.DARK;
const DARK_THEMES = new Set([THEMES.DARK, THEMES.HIGH_CONTRAST]);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getStoredPreference = () => {
  if (typeof window === 'undefined') return THEMES.SYSTEM;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return THEMES.SYSTEM;
    return stored === THEMES.SYSTEM || AVAILABLE_THEME_KEYS.includes(stored)
      ? stored
      : THEMES.SYSTEM;
  } catch (error) {
    logWarn('Failed to read stored theme preference', { message: error?.message });
    return THEMES.SYSTEM;
  }
};

const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState(DEFAULT_LIGHT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState(FALLBACK_THEME);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const detectSystemTheme = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return DEFAULT_LIGHT_THEME;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? DEFAULT_DARK_THEME
      : DEFAULT_LIGHT_THEME;
  }, []);

  const applyThemeTokens = useCallback((themeKey) => {
    if (typeof document === 'undefined') return;

    const selectedKey = AVAILABLE_THEME_KEYS.includes(themeKey)
      ? themeKey
      : FALLBACK_THEME;
    const theme = getTheme(selectedKey);
    const cssVars = generateCSSVariables(selectedKey);
    const root = document.documentElement;

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.setAttribute('data-theme', selectedKey);
    root.classList.toggle('dark', DARK_THEMES.has(selectedKey));

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const backgroundColor = theme.colors?.background?.primary;
      if (backgroundColor) {
        metaThemeColor.setAttribute('content', backgroundColor);
      }
    }

    logInfo('Theme tokens applied', { theme: selectedKey });
  }, []);

  const applyThemeWithTransition = useCallback((themeKey) => {
    if (typeof document === 'undefined') return undefined;

    setIsTransitioning(true);
    const root = document.documentElement;
    root.style.setProperty(
      '--theme-transition',
      `all ${THEME_TRANSITION_DURATION}ms ease-in-out`
    );

    applyThemeTokens(themeKey);

    const timeoutId = window.setTimeout(() => {
      root.style.removeProperty('--theme-transition');
      setIsTransitioning(false);
    }, THEME_TRANSITION_DURATION);

    return () => {
      window.clearTimeout(timeoutId);
      root.style.removeProperty('--theme-transition');
      setIsTransitioning(false);
    };
  }, [applyThemeTokens]);

  useEffect(() => {
    const initialSystemTheme = detectSystemTheme();
    setSystemTheme(initialSystemTheme);

    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      const nextTheme = event.matches ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
      setSystemTheme((previousTheme) => {
        if (previousTheme !== nextTheme) {
          logInfo('System theme changed', {
            oldTheme: previousTheme,
            newTheme: nextTheme
          });
        }
        return nextTheme;
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [detectSystemTheme]);

  const nextResolvedTheme = useMemo(() => {
    const preferredTheme = preference === THEMES.SYSTEM ? systemTheme : preference;
    return AVAILABLE_THEME_KEYS.includes(preferredTheme)
      ? preferredTheme
      : FALLBACK_THEME;
  }, [preference, systemTheme]);

  useEffect(() => {
    setResolvedTheme(nextResolvedTheme);
    const cleanup = applyThemeWithTransition(nextResolvedTheme);
    return cleanup;
  }, [nextResolvedTheme, applyThemeWithTransition]);

  const updateThemePreference = useCallback((nextTheme) => {
    const allowedThemes = new Set([...AVAILABLE_THEME_KEYS, THEMES.SYSTEM]);
    if (!allowedThemes.has(nextTheme)) {
      logWarn('Invalid theme provided, ignoring', { theme: nextTheme });
      return;
    }

    setPreference(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      logWarn('Failed to persist theme preference', { message: error?.message });
    }

    logInfo('Theme preference updated', {
      oldTheme: preference,
      newTheme: nextTheme
    });
  }, [preference]);

  const toggleTheme = useCallback(() => {
    const nextTheme = DARK_THEMES.has(resolvedTheme)
      ? DEFAULT_LIGHT_THEME
      : DEFAULT_DARK_THEME;
    updateThemePreference(nextTheme);
  }, [resolvedTheme, updateThemePreference]);

  const getThemeClasses = useCallback((classMap = {}) => {
    const baseClasses = classMap.base || '';
    const modeKey = DARK_THEMES.has(resolvedTheme) ? 'dark' : 'light';
    const specificThemeClasses = classMap[resolvedTheme] || '';
    const modeClasses = classMap[modeKey] || '';

    return [baseClasses, modeClasses, specificThemeClasses]
      .filter(Boolean)
      .join(' ')
      .trim();
  }, [resolvedTheme]);

  const getThemeColor = useCallback((token) => {
    if (typeof document === 'undefined') return '';
    const root = document.documentElement;
    const variableName = token.startsWith('--') ? token : `--${token}`;
    return getComputedStyle(root).getPropertyValue(variableName).trim();
  }, []);

  const contextValue = {
    theme: preference,
    resolvedTheme,
    systemTheme,
    isTransitioning,
    setTheme: updateThemePreference,
    toggleTheme,
    getThemeClasses,
    getThemeColor,
    themes: THEMES,
    availableThemes: themeDefinitions,
    isDark: DARK_THEMES.has(resolvedTheme),
    isLight: !DARK_THEMES.has(resolvedTheme),
    isSystem: preference === THEMES.SYSTEM
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
