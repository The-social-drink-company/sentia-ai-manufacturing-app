// Enterprise Button component with extended shadcn/ui features

import React, { forwardRef, useState } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/design-system';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        market: 'bg-market-primary-500 text-white hover:bg-market-primary-600'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10'
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  'data-testid'?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      tooltip,
      'data-testid': testId,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isPressed, setIsPressed] = useState(false);

    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsPressed(true);
      }
      onKeyDown?.(e);
    };

    const handleKeyUp = () => {
      setIsPressed(false);
    };

    const buttonContent = (
      <>
        {loading && (
          <Loader2 
            className="mr-2 h-4 w-4 animate-spin" 
            data-testid={`${testId}-loading-spinner`}
          />
        )}
        {!loading && leftIcon && (
          <span className="mr-2" data-testid={`${testId}-left-icon`}>
            {leftIcon}
          </span>
        )}
        <span data-testid={`${testId}-text`}>
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && rightIcon && (
          <span className="ml-2" data-testid={`${testId}-right-icon`}>
            {rightIcon}
          </span>
        )}
      </>
    );

    const buttonElement = (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          isPressed && 'scale-95',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        data-testid={testId}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );

    if (tooltip) {
      return (
        <div className="group relative inline-block">
          {buttonElement}
          <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-100 dark:text-gray-900">
            {tooltip}
            <div className="absolute top-full left-1/2 h-1 w-1 -translate-x-1/2 transform border-l-2 border-r-2 border-t-2 border-gray-900 dark:border-gray-100" />
          </div>
        </div>
      );
    }

    return buttonElement;
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };