/**
 * ENTERPRISE THEME SWITCHER
 * Advanced theme management system with Quantum Dark and Crystal Clear themes
 * Features: smooth transitions, keyboard shortcuts, system preference detection
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { themes, generateCSSVariables } from '../../config/theme.config';
import { logDebug, logInfo } from '../../utils/logger';

// Create Theme Context
const EnterpriseThemeContext = createContext(null);

export const useEnterpriseTheme = () => {
  const context = useContext(EnterpriseThemeContext);
  if (!context) {
    throw new Error('useEnterpriseTheme must be used within EnterpriseThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const EnterpriseThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('sentia-enterprise-theme');
    if (savedTheme && themes[savedTheme]) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'quantumDark';
    }

    return 'crystalClear'; // Default to light theme
  });

  const [isAutoMode, setIsAutoMode] = useState(() => {
    return localStorage.getItem('sentia-theme-auto') === 'true';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('sentia-accent-color') || themes[currentTheme].colors.brand.primary;
  });

  // Apply theme to document
  useEffect(() => {
    const theme = themes[currentTheme];
    const cssVars = generateCSSVariables(currentTheme);

    // Apply CSS variables to root
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Apply theme class for Tailwind
    document.documentElement.className = currentTheme === 'quantumDark' ? 'dark' : '';

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.background.primary);
    }

    // Save to localStorage
    localStorage.setItem('sentia-enterprise-theme', currentTheme);

    logInfo('Theme applied', { theme: currentTheme });
  }, [currentTheme]);

  // Handle system theme changes
  useEffect(() => {
    if (!isAutoMode) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setCurrentTheme(e.matches ? 'quantumDark' : 'crystalClear');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAutoMode]);

  // Save auto mode preference
  useEffect(() => {
    localStorage.setItem('sentia-theme-auto', isAutoMode.toString());
  }, [isAutoMode]);

  // Save accent color preference
  useEffect(() => {
    localStorage.setItem('sentia-accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  const switchTheme = useCallback((themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      setIsAutoMode(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const themeKeys = Object.keys(themes).filter(key => !key.includes('highContrast'));
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    switchTheme(themeKeys[nextIndex]);
  }, [currentTheme, switchTheme]);

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    switchTheme,
    toggleTheme,
    isAutoMode,
    setIsAutoMode,
    accentColor,
    setAccentColor,
    isDark: currentTheme === 'quantumDark',
    isLight: currentTheme === 'crystalClear',
    isHighContrast: currentTheme === 'highContrast'
  };

  return (
    <EnterpriseThemeContext.Provider value={value}>
      {children}
    </EnterpriseThemeContext.Provider>
  );
};

// Theme Switcher UI Component
export const EnterpriseThemeSwitcher = ({ minimal = false }) => {
  const {
    currentTheme,
    theme,
    switchTheme,
    toggleTheme,
    isAutoMode,
    setIsAutoMode,
    accentColor,
    setAccentColor
  } = useEnterpriseTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Shift + T to toggle theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
      // Cmd/Ctrl + Shift + D for dark theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        switchTheme('quantumDark');
      }
      // Cmd/Ctrl + Shift + L for light theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        switchTheme('crystalClear');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleTheme, switchTheme]);

  if (minimal) {
    return (
      <motion.button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-quantum-hover transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        {currentTheme === 'quantumDark' ? (
          <MoonIcon className="w-5 h-5 text-brand-primary" />
        ) : (
          <SunIcon className="w-5 h-5 text-brand-secondary" />
        )}
      </motion.button>
    );
  }

  return (
    <div className="relative">
      {/* Main Theme Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-quantum-surface
                   border border-gray-200 dark:border-quantum-border rounded-xl
                   hover:border-brand-primary dark:hover:border-brand-primary
                   transition-all duration-300 shadow-sm hover:shadow-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          {currentTheme === 'quantumDark' ? (
            <MoonIcon className="w-5 h-5 text-brand-primary" />
          ) : currentTheme === 'crystalClear' ? (
            <SunIcon className="w-5 h-5 text-brand-secondary" />
          ) : (
            <SparklesIcon className="w-5 h-5 text-brand-tertiary" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {theme.name}
          </span>
        </div>
        <AdjustmentsHorizontalIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Theme Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-quantum-surface
                       border border-gray-200 dark:border-quantum-border rounded-2xl
                       shadow-xl dark:shadow-2xl z-50 overflow-hidden"
          >
            {/* Theme Options */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Choose Theme
              </h3>

              {/* Theme Buttons */}
              <div className="space-y-2">
                {/* Quantum Dark */}
                <ThemeOption
                  icon={<MoonIcon className="w-5 h-5" />}
                  name="Quantum Dark"
                  description="Deep space theme for focused work"
                  gradient="from-quantum-space to-quantum-midnight"
                  isActive={currentTheme === 'quantumDark'}
                  onClick={() => {
                    switchTheme('quantumDark');
                    setIsAutoMode(false);
                  }}
                />

                {/* Crystal Clear */}
                <ThemeOption
                  icon={<SunIcon className="w-5 h-5" />}
                  name="Crystal Clear"
                  description="Clean and bright for daytime"
                  gradient="from-crystal-pure to-crystal-soft"
                  isActive={currentTheme === 'crystalClear'}
                  onClick={() => {
                    switchTheme('crystalClear');
                    setIsAutoMode(false);
                  }}
                />

                {/* High Contrast */}
                <ThemeOption
                  icon={<SparklesIcon className="w-5 h-5" />}
                  name="High Contrast"
                  description="Maximum contrast for accessibility"
                  gradient="from-black to-gray-800"
                  isActive={currentTheme === 'highContrast'}
                  onClick={() => {
                    switchTheme('highContrast');
                    setIsAutoMode(false);
                  }}
                />

                {/* Auto Mode */}
                <ThemeOption
                  icon={<ComputerDesktopIcon className="w-5 h-5" />}
                  name="Auto"
                  description="Follow system preference"
                  gradient="from-gray-400 to-gray-600"
                  isActive={isAutoMode}
                  onClick={() => setIsAutoMode(true)}
                />
              </div>

              {/* Customization Toggle */}
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="mt-4 w-full flex items-center justify-between px-3 py-2
                         text-sm text-gray-600 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-quantum-hover rounded-lg
                         transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PaintBrushIcon className="w-4 h-4" />
                  <span>Customize Colors</span>
                </div>
                <motion.div
                  animate={{ rotate: showCustomization ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>

              {/* Color Customization Panel */}
              <AnimatePresence>
                {showCustomization && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-quantum-border"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                          Accent Color
                        </label>
                        <div className="flex gap-2">
                          {[
                            '#00D4FF', // Electric Blue
                            '#7C3AED', // Quantum Purple
                            '#F97316', // Sunset Orange
                            '#10B981', // Emerald
                            '#EC4899', // Pink
                            '#F59E0B', // Amber
                          ].map((color) => (
                            <button
                              key={color}
                              onClick={() => setAccentColor(color)}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                accentColor === color
                                  ? 'border-gray-900 dark:border-white scale-110'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Set accent color to ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-quantum-twilight border-t border-gray-200 dark:border-quantum-border">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Keyboard shortcuts:
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <kbd className="px-2 py-1 text-xs bg-white dark:bg-quantum-surface border border-gray-300 dark:border-quantum-border rounded">
                  Ctrl+Shift+T
                </kbd>
                <span className="text-xs text-gray-500 dark:text-gray-400">Toggle theme</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Theme Option Component
const ThemeOption = ({ icon, name, description, gradient, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-quantum-hover border border-transparent'
                  }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
        <div className="text-white">{icon}</div>
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};

export default EnterpriseThemeSwitcher;
