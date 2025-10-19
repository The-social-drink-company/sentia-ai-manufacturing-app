/**
 * Dashboard Component Library
 * Barrel export for easy imports
 *
 * Usage:
 *   import { KPICard, KPIGrid, WorkingCapitalCard } from '@/components/dashboard';
 *
 * BMAD-UI-002: Component Library Structure
 */

// Command Palette
export { default as CommandPalette } from './CommandPalette';

// Financial Analysis
export { default as FinancialAnalysisSection } from './FinancialAnalysisSection';

// KPI Components
export { default as KPICard } from './KPICard';
export { default as KPIGrid } from './KPIGrid';

// Chart Components
export { default as MarketDistributionChart } from './MarketDistributionChart';
export { default as PLAnalysisChart } from './PLAnalysisChart';
export { default as PLAnalysisChartEnhanced } from './PLAnalysisChartEnhanced';
export { default as ProductSalesChart } from './ProductSalesChart';
export { default as RegionalContributionChart } from './RegionalContributionChart';
export { default as SalesPerformanceChart } from './SalesPerformanceChart';
export { default as StockLevelsChart } from './StockLevelsChart';
export { default as StockLevelsChartEnhanced } from './StockLevelsChartEnhanced';

// Dashboard Utilities
export { default as ProgressiveDashboardLoader } from './ProgressiveDashboardLoader';
export { default as QuickActions } from './QuickActions';
export { default as WorkingCapitalCard } from './WorkingCapitalCard';
