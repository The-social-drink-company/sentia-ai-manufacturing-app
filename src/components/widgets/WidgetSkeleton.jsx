import React from 'react';

/**
 * WidgetSkeleton - Loading state for dashboard widgets
 */
const WidgetSkeleton = ({ variant = 'default', className = '' }) => {
  const variants = {
    default: (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
      </div>
    ),
    chart: (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
        </div>
      </div>
    ),
    table: (
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    ),
    metric: (
      <div className="text-center space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mx-auto"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3 mx-auto"></div>
      </div>
    ),
    grid: (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    )
  };

  return (
    <div className={`p-4 ${className}`}>
      {variants[variant] || variants.default}
    </div>
  );
};

export default WidgetSkeleton;