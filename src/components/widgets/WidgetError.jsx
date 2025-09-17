import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * WidgetError - Error state for dashboard widgets with retry capability
 */
const WidgetError = ({ error, onRetry, className = '' }) => {
  return (
    <div className={`p-4 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Failed to load data
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default WidgetError;