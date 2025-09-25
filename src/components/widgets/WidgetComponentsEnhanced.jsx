import React, { useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Widget Loading Skeleton with animations
 */
export const WidgetSkeleton = ({ title = '', height = '300px', sections = 3 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      style={{ minHeight: height }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[...Array(sections)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </motion.div>
  );
};

/**
 * Enhanced Widget Error State with retry and fallback options
 */
export const WidgetError = ({
  error,
  onRetry,
  title = 'Widget',
  message = null,
  showDetails = false,
  fallbackAction = null
}) => {
  const [detailsVisible, setDetailsVisible] = useState(showDetails);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-[300px] flex flex-col items-center justify-center"
    >
      <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title} Error
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
        {message || error?.message || 'Failed to load data. Please try again.'}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        )}
        {fallbackAction && (
          <button
            onClick={fallbackAction.onClick}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {fallbackAction.label || 'Use Cached Data'}
          </button>
        )}
      </div>

      {/* Error Details (collapsible) */}
      {error && (
        <div className="w-full">
          <button
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
          >
            {detailsVisible ? 'Hide' : 'Show'} Details
          </button>
          <AnimatePresence>
            {detailsVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs text-gray-600 dark:text-gray-400 overflow-hidden"
              >
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Enhanced Refresh Button with loading states
 */
export const RefreshButton = ({
  onClick,
  isRefreshing = false,
  size = 'sm',
  lastRefreshed = null,
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const formatLastRefreshed = () => {
    if (!lastRefreshed) return '';
    const diff = Date.now() - new Date(lastRefreshed).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="flex items-center gap-2">
      {lastRefreshed && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastRefreshed()}
        </span>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={isRefreshing}
        className={`${sizeClasses[size]} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                    bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                    rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2`}
        title="Refresh data"
      >
        <ArrowPathIcon className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`} />
        {showLabel && <span className="text-xs">Refresh</span>}
      </motion.button>
    </div>
  );
};

/**
 * Enhanced Widget Container with header actions
 */
export const WidgetContainer = ({
  title,
  icon: Icon,
  children,
  onRefresh,
  isRefreshing = false,
  lastRefreshed = null,
  actions,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}
    >
      <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onRefresh && (
              <RefreshButton
                onClick={onRefresh}
                isRefreshing={isRefreshing}
                lastRefreshed={lastRefreshed}
              />
            )}
          </div>
        </div>
      </div>
      <div className={`p-6 ${contentClassName}`}>
        {children}
      </div>
    </motion.div>
  );
};

/**
 * Metric Card Component for displaying key metrics
 */
export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  onClick,
  isLoading = false
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    green: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
    red: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
    indigo: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
    gray: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : MinusIcon;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendValue}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

/**
 * Data Grid Component for tabular data
 */
export const DataGrid = ({ columns, data, isLoading = false, emptyMessage = 'No data available' }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex gap-4 mb-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Status Indicator Component
 */
export const StatusIndicator = ({ status, label, size = 'sm' }) => {
  const statusConfig = {
    success: {
      color: 'bg-green-500',
      icon: CheckCircleIcon,
      text: 'text-green-600 dark:text-green-400'
    },
    warning: {
      color: 'bg-yellow-500',
      icon: ExclamationTriangleIcon,
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    error: {
      color: 'bg-red-500',
      icon: XCircleIcon,
      text: 'text-red-600 dark:text-red-400'
    },
    info: {
      color: 'bg-blue-500',
      icon: ClockIcon,
      text: 'text-blue-600 dark:text-blue-400'
    },
    default: {
      color: 'bg-gray-500',
      icon: MinusIcon,
      text: 'text-gray-600 dark:text-gray-400'
    }
  };

  const config = statusConfig[status] || statusConfig.default;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${sizeClasses[size]} ${config.color} rounded-full animate-pulse`}></span>
      {label && (
        <span className={`text-sm ${config.text}`}>
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ value, max = 100, label, color = 'blue', showPercentage = true }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          {showPercentage && (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${colorClasses[color] || colorClasses.blue} rounded-full`}
        />
      </div>
    </div>
  );
};

export default {
  WidgetSkeleton,
  WidgetError,
  RefreshButton,
  WidgetContainer,
  MetricCard,
  DataGrid,
  StatusIndicator,
  ProgressBar
};