import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEMES = {
  bright: {
    name: 'Bright',
    description: 'High contrast for maximum clarity',
    icon: '☀️',
    ideal: 'Well-lit environments, detailed work'
  },
  medium: {
    name: 'Medium',
    description: 'Balanced contrast for comfort',
    icon: '🌤️',
    ideal: 'General use, mixed lighting'
  },
  dark: {
    name: 'Dark',
    description: 'Low light for reduced eye strain',
    icon: '🌙',
    ideal: 'Low light, extended sessions'
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('sentia-theme');
    if (savedTheme && THEMES[savedTheme]) {
      return savedTheme;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'medium'; // Default to balanced theme
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save theme preference
    localStorage.setItem('sentia-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeColors = {
      bright: '#ffffff',
      medium: '#f8fafc',
      dark: '#0f172a'
    };
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[theme]);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a theme
      const savedTheme = localStorage.getItem('sentia-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'medium');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    setTheme,
    themes: THEMES,
    isDark: theme === 'dark',
    isBright: theme === 'bright',
    isMedium: theme === 'medium'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;