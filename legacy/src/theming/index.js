// Theme system barrel exports for clean imports
export { default as ThemeProvider, useTheme, THEMES } from './ThemeProvider';
export { default as ThemeToggle, ThemeDropdown } from './ThemeToggle';
export * from './themeUtils';
export { default as themedComponents } from './themedComponents.jsx';

// Re-export everything for convenience
export {
  getThemeClasses,
  THEME_CLASSES,
  MANUFACTURING_THEME_CLASSES,
  getCSSCustomProperty,
  getThemeStyles,
  getChartThemeOptions,
  getManufacturingStatusColors,
  validateTheme
} from './themeUtils';

// Re-export themed components
export {
  ThemedCard,
  ThemedInput,
  ThemedSecondaryButton,
  ThemedStatusBadge,
  ManufacturingKPICard,
  ProductionStatusIndicator,
  ThemedChartContainer,
  ThemedDataTable,
  ManufacturingAlert
} from './themedComponents.jsx';
