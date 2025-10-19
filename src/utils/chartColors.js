/**
 * Chart Color Palette
 * Consistent color scheme for all Recharts visualizations
 * Follows Tailwind CSS color system for design consistency
 */

export const chartColors = {
  // Primary colors
  primary: '#3B82F6', // Blue - Main brand color
  secondary: '#8B5CF6', // Purple - Secondary actions
  success: '#10B981', // Green - Positive metrics
  warning: '#F59E0B', // Amber - Warnings/thresholds
  danger: '#EF4444', // Red - Critical/negative
  info: '#14B8A6', // Teal - Informational

  // Market-specific colors
  ukMarket: '#3B82F6', // Blue - UK market
  usaMarket: '#F97316', // Orange - USA market
  euMarket: '#10B981', // Green - EU market (if needed)

  // Financial metrics
  revenue: '#3B82F6', // Blue
  grossProfit: '#10B981', // Green
  ebitda: '#F59E0B', // Amber
  grossMargin: '#8B5CF6', // Purple
  netProfit: '#14B8A6', // Teal
  operatingCosts: '#EF4444', // Red

  // Inventory/Stock
  currentStock: '#8B5CF6', // Purple
  reorderLevel: '#F97316', // Orange
  safetyStock: '#10B981', // Green
  outOfStock: '#EF4444', // Red

  // Sales/Units
  unitsSold: '#EF4444', // Red (from mockup)
  revenueBar: '#14B8A6', // Teal (from mockup)

  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Chart UI elements
  grid: '#E5E7EB', // Light gray for grid lines
  axis: '#6B7280', // Medium gray for axis labels
  tooltip: {
    background: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
  },
}

/**
 * Get color array for multi-series charts
 * @param {string} type - Chart type (sales, financial, inventory)
 * @returns {string[]} Array of colors
 */
export const getChartColorArray = type => {
  switch (type) {
    case 'sales':
      return [chartColors.danger, chartColors.info, chartColors.success]
    case 'financial':
      return [
        chartColors.revenue,
        chartColors.grossProfit,
        chartColors.ebitda,
        chartColors.grossMargin,
      ]
    case 'inventory':
      return [chartColors.currentStock, chartColors.reorderLevel, chartColors.safetyStock]
    case 'market':
      return [chartColors.ukMarket, chartColors.usaMarket, chartColors.euMarket]
    default:
      return [chartColors.primary, chartColors.secondary, chartColors.success]
  }
}

/**
 * Chart theme configuration
 */
export const chartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  gridStroke: chartColors.grid,
  gridStrokeDasharray: '3 3',
  axisStroke: chartColors.grid,
  axisTick: {
    fill: chartColors.axis,
    fontSize: 12,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: chartColors.tooltip.background,
      border: `1px solid ${chartColors.tooltip.border}`,
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    labelStyle: {
      color: chartColors.tooltip.text,
      fontWeight: 600,
    },
  },
  legend: {
    wrapperStyle: {
      paddingTop: '20px',
    },
    iconType: 'square',
  },
}

export default chartColors
