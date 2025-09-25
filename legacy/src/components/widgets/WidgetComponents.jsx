import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Widget Loading Skeleton Component
 */
export const WidgetSkeleton = ({ title = '', height = '300px' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse" style={{ minHeight: height }}>
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="mt-6">
        <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Widget Error State Component
 */
export const WidgetError = ({ error, onRetry, title = 'Widget' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-[300px] flex flex-col items-center justify-center"
    >
      <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title} Error
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        {error?.message || 'Failed to load data'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      )}
    </motion.div>
  );
};

/**
 * Widget Refresh Button Component
 */
export const RefreshButton = ({ onClick, isRefreshing = false, size = 'sm' }) => {
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

  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className={`${sizeClasses[size]} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                  bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Refresh data"
    >
      <ArrowPathIcon className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );
};

/**
 * Widget Container Component
 */
export const WidgetContainer = ({ title, children, onRefresh, isRefreshing = false, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {onRefresh && (
          <RefreshButton onClick={onRefresh} isRefreshing={isRefreshing} />
        )}
      </div>
      {children}
    </div>
  );
};

/**
 * Metric Card Component for displaying KPIs
 */
export const MetricCard = ({ label, value, unit = '', trend = null, icon: Icon }) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
            {unit && <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trendColors[trend.direction]}`}>
              {trend.direction === 'up' && 'â†‘'}
              {trend.direction === 'down' && 'â†“'}
              <span className="ml-1">{trend.value}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Data Grid Component for tabular data
 */
export const DataGrid = ({ columns, data, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
                <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
