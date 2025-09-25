/**
 * Performance optimization wrapper for lazy loading components
 * Implements React Suspense with loading skeletons
 */

import React, { Suspense, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading skeleton component
export const LoadingSkeleton = memo(({ type = 'default', count = 1 }) => {
  const skeletonTypes = {
    default: 'h-32 w-full',
    chart: 'h-64 w-full',
    widget: 'h-48 w-full',
    table: 'h-96 w-full',
    card: 'h-40 w-full',
    text: 'h-4 w-3/4',
    button: 'h-10 w-24'
  };

  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-4">
          <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${skeletonTypes[type]}`} />
        </div>
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-[200px] flex items-center justify-center p-4">
    <div className="text-center">
      <p className="text-red-500 mb-2">Something went wrong loading this component</p>
      <p className="text-sm text-gray-500 mb-4">{error?.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Lazy load wrapper with error boundary and suspense
export const LazyLoadWrapper = memo(({ 
  children, 
  fallback = <LoadingSkeleton type="default" />,
  errorFallback = ErrorFallback
}) => {
  return (
    <ErrorBoundary FallbackComponent={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

LazyLoadWrapper.displayName = 'LazyLoadWrapper';

// Widget loading skeleton
export const WidgetSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
    </div>
    <div className="mt-6 h-32 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
));

WidgetSkeleton.displayName = 'WidgetSkeleton';

// Chart loading skeleton
export const ChartSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
    <div className="mt-4 flex justify-between">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-1/5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

// Table loading skeleton
export const TableSkeleton = memo(({ rows = 5, columns = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
    </div>
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

// Dashboard grid skeleton
export const DashboardSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <WidgetSkeleton key={i} />
    ))}
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

// Progressive loading wrapper for large data sets
export const ProgressiveLoader = memo(({ 
  data, 
  renderItem, 
  batchSize = 10,
  delay = 100,
  placeholder = <LoadingSkeleton />
}) => {
  const [loadedCount, setLoadedCount] = React.useState(batchSize);

  React.useEffect(() => {
    if (loadedCount < data.length) {
      const timer = setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + batchSize, data.length));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loadedCount, data.length, batchSize, delay]);

  const visibleData = data.slice(0, loadedCount);

  return (
    <>
      {visibleData.map((item, index) => renderItem(item, index))}
      {loadedCount < data.length && placeholder}
    </>
  );
});

ProgressiveLoader.displayName = 'ProgressiveLoader';

export default LazyLoadWrapper;
