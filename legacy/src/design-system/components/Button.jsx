// Enterprise Button Component
// Comprehensive button system with variants, sizes, and accessibility

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Button Variants using Class Variance Authority
const buttonVariants = cva(
  // Base classes - applied to all buttons
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none'
  ],
  {
    variants: {
      // Visual variants
      variant: {
        // Primary - Main call to action
        primary: [
          'bg-blue-600 text-white shadow-sm',
          'hover:bg-blue-700 hover:shadow-md',
          'focus-visible:ring-blue-500',
          'active:bg-blue-800'
        ],
        // Secondary - Less prominent actions  
        secondary: [
          'bg-blue-100 text-blue-900 border border-blue-200',
          'hover:bg-blue-200 hover:border-blue-300',
          'focus-visible:ring-blue-500',
          'active:bg-blue-300'
        ],
        // Outline - Subtle actions
        outline: [
          'border border-gray-300 bg-white text-gray-700 shadow-sm',
          'hover:bg-gray-50 hover:border-gray-400',
          'focus-visible:ring-blue-500',
          'active:bg-gray-100'
        ],
        // Ghost - Minimal visual impact
        ghost: [
          'text-gray-700',
          'hover:bg-gray-100',
          'focus-visible:ring-blue-500',
          'active:bg-gray-200'
        ],
        // Destructive - Dangerous actions
        destructive: [
          'bg-red-600 text-white shadow-sm',
          'hover:bg-red-700 hover:shadow-md',
          'focus-visible:ring-red-500',
          'active:bg-red-800'
        ],
        // Success - Positive actions
        success: [
          'bg-green-600 text-white shadow-sm',
          'hover:bg-green-700 hover:shadow-md',
          'focus-visible:ring-green-500',
          'active:bg-green-800'
        ],
        // Warning - Caution actions
        warning: [
          'bg-amber-500 text-white shadow-sm',
          'hover:bg-amber-600 hover:shadow-md',
          'focus-visible:ring-amber-500',
          'active:bg-amber-700'
        ]
      },
      // Size variants
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-9 w-9 p-0'
      },
      // Full width option
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false
    }
  }
);

// Loading spinner component
const LoadingSpinner = ({ size = 16 }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Main Button Component
const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}, ref) => {
  // Handle click events
  const handleClick = (event) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // Determine spinner size based on button size
  const spinnerSize = {
    xs: 12,
    sm: 14,
    default: 16,
    lg: 18,
    xl: 20,
    icon: 16
  }[size];

  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {loading ? (
        <LoadingSpinner size={spinnerSize} />
      ) : leftIcon ? (
        <span className="mr-2 -ml-1">
          {leftIcon}
        </span>
      ) : null}

      {/* Button content */}
      {loading ? (
        <span className="ml-2">Loading...</span>
      ) : (
        <>
          {children}
          {/* Right icon */}
          {rightIcon && (
            <span className="ml-2 -mr-1">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Button Group Component
export const ButtonGroup = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'inline-flex rounded-md shadow-sm',
        '[&>button:not(:first-child)]:ml-px',
        '[&>button:not(:first-child)]:rounded-l-none',
        '[&>button:not(:last-child)]:rounded-r-none',
        '[&>button]:relative',
        '[&>button:hover]:z-10',
        '[&>button:focus]:z-10',
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
};

// Icon Button Component (specialized button for icons only)
export const IconButton = forwardRef(({
  icon,
  ariaLabel,
  variant = 'ghost',
  size = 'icon',
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      ariaLabel={ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Specialized Manufacturing Dashboard Buttons
export const KPIButton = forwardRef(({ 
  value, 
  label, 
  trend, 
  onClick,
  className,
  ...props 
}, ref) => {
  const trendColor = trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  const trendIcon = trend === 'up' ? 'â†—' : trend === 'down' ? 'â†˜' : 'â†’';

  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        'h-auto p-4 flex-col items-start text-left min-w-32',
        'hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 flex items-center">
        {label}
        <span className={cn('ml-1', trendColor)}>{trendIcon}</span>
      </div>
    </Button>
  );
});

KPIButton.displayName = 'KPIButton';

export const StatusButton = forwardRef(({ 
  status, 
  label, 
  count,
  onClick,
  className,
  ...props 
}, ref) => {
  const statusConfig = {
    online: { color: 'bg-green-500', variant: 'success' },
    offline: { color: 'bg-gray-500', variant: 'secondary' },
    warning: { color: 'bg-amber-500', variant: 'warning' },
    error: { color: 'bg-red-500', variant: 'destructive' },
    maintenance: { color: 'bg-blue-500', variant: 'primary' }
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <Button
      ref={ref}
      variant={config.variant}
      className={cn('relative', className)}
      onClick={onClick}
      {...props}
    >
      <div className={cn('w-2 h-2 rounded-full mr-2', config.color)} />
      {label}
      {count && (
        <span className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
          {count}
        </span>
      )}
    </Button>
  );
});

StatusButton.displayName = 'StatusButton';

export default Button;
