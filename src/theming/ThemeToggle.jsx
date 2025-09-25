import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme, THEMES } from './ThemeProvider.jsx';
import Button from '../design-system/components/Button.jsx';

const resolveLabel = (theme) => {
  switch (theme) {
    case THEMES.LIGHT:
      return 'Light';
    case THEMES.DARK:
      return 'Dark';
    case THEMES.HIGH_CONTRAST:
      return 'High Contrast';
    case THEMES.SYSTEM:
    default:
      return 'System';
  }
};

const ThemeToggle = ({
  variant = 'secondary',
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const {
    theme,
    resolvedTheme,
    setTheme,
    isTransitioning,
    isDark
  } = useTheme();

  const getNextTheme = (currentTheme) => {
    switch (currentTheme) {
      case THEMES.LIGHT:
        return THEMES.DARK;
      case THEMES.DARK:
      case THEMES.HIGH_CONTRAST:
        return THEMES.SYSTEM;
      case THEMES.SYSTEM:
      default:
        return THEMES.LIGHT;
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (theme === THEMES.SYSTEM) {
      return ComputerDesktopIcon;
    }
    return isDark ? MoonIcon : SunIcon;
  };

  const getAriaLabel = () => {
    const nextTheme = getNextTheme(theme);
    return `Switch to ${resolveLabel(nextTheme)} theme`;
  };

  const IconComponent = getThemeIcon();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleThemeToggle}
      disabled={isTransitioning}
      className={`theme-toggle ${className} ${isTransitioning ? 'transition-opacity opacity-70' : ''}`.trim()}
      aria-label={getAriaLabel()}
      title={`Current: ${resolveLabel(theme)} theme (resolved: ${resolveLabel(resolvedTheme)})`}
    >
      <IconComponent className={`h-4 w-4 ${isTransitioning ? 'animate-pulse' : ''}`} />
      {showLabel && (
        <span className="ml-2 hidden sm:inline">
          {resolveLabel(theme)}
        </span>
      )}
    </Button>
  );
};

export const ThemeDropdown = ({ className = '' }) => {
  const { theme, setTheme, resolvedTheme, isTransitioning } = useTheme();

  const themeOptions = [
    {
      value: THEMES.SYSTEM,
      label: 'System',
      icon: ComputerDesktopIcon,
      description: 'Follow system preference'
    },
    {
      value: THEMES.LIGHT,
      label: 'Light',
      icon: SunIcon,
      description: 'Always use Crystal Clear (light) theme'
    },
    {
      value: THEMES.DARK,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Always use Quantum Dark theme'
    },
    {
      value: THEMES.HIGH_CONTRAST,
      label: 'High Contrast',
      icon: MoonIcon,
      description: 'High contrast accessibility mode'
    }
  ];

  return (
    <div className={`theme-dropdown ${className}`.trim()}>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        disabled={isTransitioning}
        className="
          bg-white dark:bg-slate-800
          border border-gray-300 dark:border-slate-600
          text-gray-900 dark:text-gray-100
          rounded-md px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label="Select theme preference"
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value === theme
              ? ` (${resolveLabel(resolvedTheme)})`
              : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeToggle;
