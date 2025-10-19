/**
 * Number and Currency Formatting Utilities
 * Formats large numbers into human-readable strings with K/M suffixes
 */

/**
 * Format currency with appropriate suffix (K/M)
 * @param {number} value - The numeric value to format
 * @param {string} currency - Currency symbol (default: '£')
 * @returns {string} Formatted currency string
 * @example formatCurrency(10760000, '£') // '£10.76M'
 */
export const formatCurrency = (value, currency = '£') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${currency}0`
  }

  // Millions
  if (Math.abs(value) >= 1000000) {
    return `${currency}${(value / 1000000).toFixed(2)}M`
  }

  // Thousands
  if (Math.abs(value) >= 1000) {
    return `${currency}${(value / 1000).toFixed(0)}K`
  }

  // Less than 1000
  return `${currency}${value.toLocaleString()}`
}

/**
 * Format number with appropriate suffix (K/M)
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted number string
 * @example formatNumber(350314) // '350K'
 */
export const formatNumber = value => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  // Millions
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  }

  // Thousands
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }

  // Less than 1000
  return value.toLocaleString()
}

/**
 * Format percentage with specified decimal places
 * @param {number} value - The numeric value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 * @example formatPercentage(67.6, 1) // '67.6%'
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Format compact number (no suffix, with commas)
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted number string with commas
 * @example formatCompact(10760) // '10,760'
 */
export const formatCompact = value => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  return value.toLocaleString()
}

/**
 * Format trend value with sign and percentage
 * @param {number} value - The trend value
 * @returns {string} Formatted trend string
 * @example formatTrend(15.2) // '+15.2%'
 */
export const formatTrend = value => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%'
  }

  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
