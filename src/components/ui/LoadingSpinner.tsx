import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    accent: 'text-green-600'
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-200 border-t-current',
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <span className="text-sm font-medium text-gray-600 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'h-4 w-full',
    rectangular: 'h-24 w-full',
    circular: 'h-12 w-12 rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_ease-in-out_infinite]'
  };

  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      aria-label="Loading content"
    />
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "Loading dashboard..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto mt-2 ml-2" 
             style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">{text}</h2>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);