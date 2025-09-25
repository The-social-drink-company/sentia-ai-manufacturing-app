import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transform hover:scale-[1.02] active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
  );

  const variantClasses = {
    primary: cn(
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg',
      'hover:from-blue-700 hover:to-blue-800 hover:shadow-xl',
      'focus:ring-blue-500',
      'active:from-blue-800 active:to-blue-900'
    ),
    secondary: cn(
      'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg',
      'hover:from-gray-700 hover:to-gray-800 hover:shadow-xl',
      'focus:ring-gray-500'
    ),
    outline: cn(
      'border-2 border-blue-600 text-blue-600 bg-white',
      'hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700',
      'focus:ring-blue-500'
    ),
    ghost: cn(
      'text-gray-700 bg-transparent hover:bg-gray-100',
      'focus:ring-gray-500'
    ),
    danger: cn(
      'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg',
      'hover:from-red-700 hover:to-red-800 hover:shadow-xl',
      'focus:ring-red-500'
    )
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" variant="secondary" className="mr-2" />
      ) : (
        icon && iconPosition === 'left' && (
          <span className={cn(iconSizeClasses[size], 'mr-2')}>
            {icon}
          </span>
        )
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn(iconSizeClasses[size], 'ml-2')}>
          {icon}
        </span>
      )}
    </button>
  );
};

export const IconButton: React.FC<{
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  'aria-label': string;
}> = ({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  className,
  disabled,
  loading,
  'aria-label': ariaLabel
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transform hover:scale-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        sizeClasses[size],
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        variant === 'secondary' && 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        variant === 'ghost' && 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        className
      )}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <span className={iconSizeClasses[size]}>
          {icon}
        </span>
      )}
    </button>
  );
};