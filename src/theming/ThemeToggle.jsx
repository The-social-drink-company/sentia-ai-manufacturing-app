import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme, THEMES } from './ThemeProvider';
import Button from '../design-system/components/Button';

const ThemeToggle = ({ 
  variant = 'secondary',
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const { theme, resolvedTheme, setTheme, isTransitioning } = useTheme();

  const getNextTheme = (currentTheme) => {
    switch (currentTheme) {
      case THEMES.LIGHT:
        return THEMES.DARK;
      case THEMES.DARK:
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
    switch (theme) {
      case THEMES.LIGHT:
        return SunIcon;
      case THEMES.DARK:
        return MoonIcon;
      case THEMES.SYSTEM:
      default:
        return ComputerDesktopIcon;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case THEMES.LIGHT:
        return 'Light';
      case THEMES.DARK:
        return 'Dark';
      case THEMES.SYSTEM:
      default:
        return 'System';
    }
  };

  const getAriaLabel = () => {
    const nextTheme = getNextTheme(theme);
    const nextLabel = nextTheme === THEMES.LIGHT ? 'Light' : 
                     nextTheme === THEMES.DARK ? 'Dark' : 'System';
    return `Switch to ${nextLabel} theme`;
  };

  const IconComponent = getThemeIcon();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleThemeToggle}
      disabled={isTransitioning}
      className={`theme-toggle ${className} ${isTransitioning ? 'transition-opacity opacity-70' : ''}`}
      aria-label={getAriaLabel()}
      title={`Current: ${getThemeLabel()} theme (resolved: ${resolvedTheme})`}
    >
      <IconComponent className={`h-4 w-4 ${isTransitioning ? 'animate-pulse' : ''}`} />
      {showLabel && (
        <span className="ml-2 hidden sm:inline">
          {getThemeLabel()}
        </span>
      )}
    </Button>
  );
};

// Dropdown version for more explicit theme selection
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
      description: 'Always use light theme'
    },
    {
      value: THEMES.DARK,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Always use dark theme'
    }
  ];

  return (
    <div className={`theme-dropdown ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
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
            {option.label} {option.value === theme && `(${resolvedTheme})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeToggle;