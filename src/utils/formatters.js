/**
 * Centralized number formatting utilities for consistent display
 * across the Sentia Manufacturing Dashboard
 */

/**
 * Format currency amounts with proper UK/European formatting
 * Large numbers (>= 1M) show without decimals, smaller amounts with 2 decimals
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'GBP')
 * @param {boolean} compact - Use compact notation for large numbers
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'GBP', compact = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '£0';
  }

  const numAmount = Number(amount);
  
  // For large amounts (>= 1M), don't show decimals
  if (Math.abs(numAmount) >= 1000000) {
    if (compact) {
      if (Math.abs(numAmount) >= 1000000000) {
        return `£${(numAmount / 1000000000).toFixed(0)}B`;
      } else if (Math.abs(numAmount) >= 1000000) {
        return `£${(numAmount / 1000000).toFixed(0)}M`;
      }
    } else {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numAmount);
    }
  }

  // For smaller amounts, show 2 decimal places
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format percentages as integers (no decimals)
 * @param {number} value - The percentage value (0-100 or 0-1)
 * @param {boolean} isDecimal - Whether input is decimal (0-1) or percentage (0-100)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, isDecimal = false) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  const numValue = Number(value);
  const percentage = isDecimal ? numValue * 100 : numValue;
  
  // Always round percentages to integers - no decimals
  return `${Math.round(percentage)}%`;
};

/**
 * Format days (DSO, DPO, DIO, CCC) as integers
 * @param {number} days - Number of days
 * @param {string} suffix - Optional suffix (default: 'days')
 * @returns {string} Formatted days string
 */
export const formatDays = (days, suffix = 'days') => {
  if (days === null || days === undefined || isNaN(days)) {
    return `0 ${suffix}`;
  }

  const numDays = Number(days);
  // Days should always be integers
  return `${Math.round(numDays)} ${suffix}`;
};

/**
 * Format turnover ratios and multipliers
 * @param {number} value - The ratio value
 * @param {string} suffix - Suffix (default: 'x')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted ratio string
 */
export const formatRatio = (value, suffix = 'x', decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return `0${suffix}`;
  }

  const numValue = Number(value);
  return `${numValue.toFixed(decimals)}${suffix}`;
};

/**
 * Format large numbers with appropriate units (K, M, B)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0 for large numbers)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const numValue = Number(value);
  
  if (Math.abs(numValue) >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(decimals)}B`;
  } else if (Math.abs(numValue) >= 1000000) {
    return `${(numValue / 1000000).toFixed(decimals)}M`;
  } else if (Math.abs(numValue) >= 1000) {
    return `${(numValue / 1000).toFixed(decimals)}K`;
  } else {
    return numValue.toLocaleString('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
};

/**
 * Format efficiency and utilization percentages as integers
 * @param {number} value - Efficiency value (0-100 or 0-1)
 * @param {boolean} isDecimal - Whether input is decimal format
 * @returns {string} Formatted efficiency string
 */
export const formatEfficiency = (value, isDecimal = false) => {
  return formatPercentage(value, isDecimal);
};

/**
 * Format working capital metrics with proper units
 * @param {string} metricType - Type of metric (ccc, dso, dpo, dio, turnover, etc.)
 * @param {number} value - The value to format
 * @returns {string} Formatted metric string
 */
export const formatWorkingCapitalMetric = (metricType, value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  switch (metricType.toLowerCase()) {
    case 'ccc':
    case 'dso':
    case 'dpo':
    case 'dio':
      return formatDays(value);
    
    case 'facility_utilization':
    case 'utilization':
      return formatPercentage(value, true); // Decimal input
    
    case 'inv_turnover':
    case 'wc_turnover':
    case 'inventory_turnover':
    case 'working_capital_turnover':
      return formatRatio(value);
    
    case 'revenue':
    case 'receivables':
    case 'inventory':
    case 'payables':
    case 'working_capital':
    case 'cash_position':
      return formatCurrency(value, 'GBP');
    
    case 'efficiency':
    case 'production_efficiency':
    case 'quality_score':
      return formatPercentage(value);
    
    default:
      return formatNumber(value, 1);
  }
};

/**
 * Format chart values based on context
 * @param {number} value - Value to format
 * @param {string} type - Chart data type ('currency', 'percentage', 'days', 'ratio', 'number')
 * @returns {string} Formatted value for chart display
 */
export const formatChartValue = (value, type = 'number') => {
  switch (type) {
    case 'currency':
      return formatCurrency(value, 'GBP', true); // Use compact notation for charts
    case 'percentage':
      return formatPercentage(value);
    case 'days':
      return formatDays(value);
    case 'ratio':
      return formatRatio(value);
    default:
      return formatNumber(value);
  }
};

export default {
  formatCurrency,
  formatPercentage,
  formatDays,
  formatRatio,
  formatNumber,
  formatEfficiency,
  formatWorkingCapitalMetric,
  formatChartValue
};