// Enterprise Input component with validation and states

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500'
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  showPasswordToggle?: boolean;
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  loading?: boolean;
  containerClassName?: string;
  'data-testid'?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      type = 'text',
      leftIcon,
      rightIcon,
      clearable = false,
      showPasswordToggle = false,
      label,
      description,
      error,
      success,
      loading = false,
      disabled,
      value,
      onChange,
      onClear,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const isEmpty = !currentValue || (typeof currentValue === 'string' && currentValue.length === 0);

    // Determine variant based on validation states
    const computedVariant = error ? 'error' : success ? 'success' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue as any);
    };

    const handleClear = () => {
      const newValue = '';
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue as any);
      onClear?.();
    };

    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const hasLeftIcon = !!leftIcon;
    const hasRightContent = !!(rightIcon || clearable || (type === 'password' && showPasswordToggle) || loading);

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            htmlFor={props.id}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: computedVariant, size }),
              hasLeftIcon && 'pl-10',
              hasRightContent && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            value={currentValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            data-testid={testId}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${testId}-error` : 
              success ? `${testId}-success` : 
              description ? `${testId}-description` : 
              undefined
            }
            {...props}
          />

          {/* Right Content */}
          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {/* Loading Spinner */}
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
              )}

              {/* Clear Button */}
              {clearable && !isEmpty && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid={`${testId}-clear`}
                  aria-label="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Password Toggle */}
              {type === 'password' && showPasswordToggle && !loading && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid={`${testId}-password-toggle`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}

              {/* Right Icon */}
              {rightIcon && !loading && (
                <div className="text-gray-500">
                  {rightIcon}
                </div>
              )}

              {/* Success/Error Icons */}
              {!loading && (
                <>
                  {error && (
                    <AlertCircle className="h-4 w-4 text-red-500" data-testid={`${testId}-error-icon`} />
                  )}
                  {success && !error && (
                    <CheckCircle className="h-4 w-4 text-green-500" data-testid={`${testId}-success-icon`} />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p 
            className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1"
            id={`${testId}-error`}
            data-testid={`${testId}-error-message`}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p 
            className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1"
            id={`${testId}-success`}
            data-testid={`${testId}-success-message`}
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
export type { InputProps };