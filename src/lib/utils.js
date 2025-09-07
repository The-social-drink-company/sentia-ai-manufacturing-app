/**
 * Shared utility functions for the Sentia Manufacturing Dashboard
 * Consolidates common functions to reduce code duplication
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatCurrency as globalFormatCurrency } from '../config/global.js'

/**
 * Combines class names using clsx and tailwind-merge
 * @param {...any} inputs - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency using global configuration
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (optional)
 * @param {string} locale - Locale code (optional)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = null, locale = null) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00'
  }
  
  // Use global formatCurrency if available, otherwise fallback
  if (globalFormatCurrency) {
    return globalFormatCurrency(amount, currency, locale)
  }
  
  // Fallback formatting
  return new Intl.NumberFormat(locale || 'en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage with specified decimal places
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%'
  }
  return `${value.toFixed(decimals)}%`
}

/**
 * Format number with thousands separators
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Get status color classes for different states
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes for the status
 */
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'critical':
    case 'error':
    case 'failed':
      return 'text-red-600 bg-red-50'
    case 'warning':
    case 'pending':
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'success':
    case 'healthy':
    case 'completed':
    case 'good':
    case 'low':
      return 'text-green-600 bg-green-50'
    case 'info':
    case 'processing':
      return 'text-blue-600 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get urgency color classes based on urgency level (1-10 scale)
 * @param {number} urgency - Urgency level (1-10)
 * @returns {string} Tailwind CSS classes for urgency
 */
export function getUrgencyColor(urgency) {
  if (urgency >= 9) return 'text-red-800 bg-red-100'
  if (urgency >= 7) return 'text-yellow-800 bg-yellow-100'
  if (urgency >= 4) return 'text-blue-800 bg-blue-100'
  return 'text-green-800 bg-green-100'
}

/**
 * Get urgency label based on urgency level
 * @param {number} urgency - Urgency level (1-10)
 * @returns {string} Urgency label
 */
export function getUrgencyLabel(urgency) {
  if (urgency >= 9) return 'URGENT'
  if (urgency >= 7) return 'HIGH'
  if (urgency >= 4) return 'MEDIUM'
  return 'LOW'
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}