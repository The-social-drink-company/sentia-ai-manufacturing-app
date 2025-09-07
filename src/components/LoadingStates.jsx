import React from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Primary loading spinner
export const LoadingSpinner = ({ size = 'md', className = '', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

// Full page loading overlay
export const PageLoadingOverlay = ({ message = 'Loading...', show = true }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">{message}</h2>
      </div>
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ className = '', lines = 3 }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-200 rounded mb-2 ${
          i === lines - 1 ? 'w-1/2' : 'w-full'
        }`}></div>
      ))}
    </div>
  );
};

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className={`h-3 bg-gray-200 rounded ${
                  colIndex === 0 ? 'w-32' : 'w-20'
                }`}></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Chart skeleton loader
export const ChartSkeleton = ({ className = '', height = 'h-64' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className={`bg-gray-100 rounded ${height} flex items-end justify-around px-4 pb-4`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                width: '8%'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Progress indicator for multi-step processes
export const ProgressIndicator = ({ 
  steps = [], 
  currentStep = 0, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index < currentStep 
                ? 'bg-green-100 text-green-700' 
                : index === currentStep
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="w-4 h-4" />
              ) : index === currentStep ? (
                <Clock className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs text-gray-600 mt-1">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-1 ${
              index < currentStep ? 'bg-green-300' : 'bg-gray-200'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Loading state for buttons
export const ButtonLoading = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-12 w-12 text-red-500 mb-4">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {error && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {error.message || 'An unexpected error occurred.'}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
};

// Query loading wrapper component
export const QueryWrapper = ({ 
  query, 
  skeleton, 
  error: errorComponent,
  empty,
  children 
}) => {
  if (query.isLoading) {
    return skeleton || <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (query.isError) {
    return errorComponent || (
      <ErrorState 
        error={query.error} 
        onRetry={query.refetch}
      />
    );
  }

  if (!query.data || (Array.isArray(query.data) && query.data.length === 0)) {
    return empty || (
      <EmptyState 
        title="No data available"
        description="There's no data to display at the moment."
      />
    );
  }

  return children;
};

export default {
  LoadingSpinner,
  PageLoadingOverlay,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ProgressIndicator,
  ButtonLoading,
  EmptyState,
  ErrorState,
  QueryWrapper
};