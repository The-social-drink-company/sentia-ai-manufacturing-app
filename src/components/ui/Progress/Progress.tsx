// Progress component for MetricCard

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  'data-testid'?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  size = 'md',
  variant = 'default',
  showLabel = false,
  'data-testid': testId
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-1';
      case 'lg': return 'h-4';
      default: return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          getSizeClasses(),
          className
        )}
        data-testid={testId}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            getVariantClasses(),
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
          data-testid={`${testId}-indicator`}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

export { Progress };