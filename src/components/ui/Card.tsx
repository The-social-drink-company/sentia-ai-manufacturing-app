import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner, Skeleton } from './LoadingSpinner';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  loading = false,
  onClick,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'bg-white shadow-sm border border-gray-200',
    bordered: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-100',
    ghost: 'bg-transparent'
  };

  const baseClasses = cn(
    'rounded-lg transition-all duration-200',
    variantClasses[variant],
    hover && 'hover-lift cursor-pointer hover:shadow-md',
    onClick && 'cursor-pointer',
    loading && 'pointer-events-none',
    className
  );

  if (loading) {
    return (
      <div className={baseClasses}>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  actions
}) => (
  <div className={cn(
    'px-6 py-4 border-b border-gray-200 flex items-center justify-between',
    className
  )}>
    <div className="flex-1">{children}</div>
    {actions && <div className="flex items-center space-x-2">{actions}</div>}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  loading = false
}) => {
  if (loading) {
    return (
      <div className={cn('px-6 py-4 space-y-3', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className
}) => (
  <div className={cn(
    'px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg',
    className
  )}>
    {children}
  </div>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    timeframe?: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  loading = false,
  className,
  onClick
}) => {
  if (loading) {
    return (
      <Card className={cn('hover-lift', className)} loading={loading} />
    );
  }

  return (
    <Card 
      className={cn('hover-lift animate-fade-in', className)} 
      onClick={onClick}
      hover={!!onClick}
    >
      <CardBody className="relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <div className="flex items-center">
                <span className={cn(
                  'text-sm font-medium flex items-center',
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                )}>
                  {change.type === 'increase' ? (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {Math.abs(change.value)}%
                </span>
                {change.timeframe && (
                  <span className="text-xs text-gray-500 ml-1">
                    {change.timeframe}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 text-blue-600">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

interface StatusCardProps {
  title: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  message,
  timestamp,
  actions,
  className
}) => {
  const statusConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const config = statusConfig[status];

  return (
    <Card
      className={cn(
        'border-l-4 animate-slide-in-right',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <CardBody>
        <div className="flex items-start">
          <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
            {config.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
            {timestamp && (
              <p className="text-xs text-gray-500 mt-2">{timestamp}</p>
            )}
          </div>
          {actions && (
            <div className="ml-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};