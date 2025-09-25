// Enterprise Input Component
// Comprehensive input system with validation, states, and accessibility

import React, { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Input Variants
const inputVariants = cva(
  [
    'flex w-full rounded-md border px-3 py-2 text-sm transition-colors',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300 bg-white',
          'hover:border-gray-400',
          'focus:border-blue-500 focus:ring-blue-500'
        ],
        filled: [
          'border-transparent bg-gray-100',
          'hover:bg-gray-200',
          'focus:bg-white focus:border-blue-500 focus:ring-blue-500'
        ],
        flushed: [
          'border-0 border-b-2 border-gray-200 rounded-none px-0',
          'hover:border-gray-300',
          'focus:border-blue-500 focus:ring-0'
        ]
      },
      size: {
        sm: 'h-8 text-xs px-2',
        default: 'h-9 text-sm px-3',
        lg: 'h-10 text-base px-4'
      },
      state: {
        default: '',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
        warning: 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default'
    }
  }
);

// Base Input Component
const Input = forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  state = 'default',
  type = 'text',
  error,
  success,
  warning,
  disabled,
  required,
  label,
  placeholder,
  helperText,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  // Determine state based on props
  const inputState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 w-5 h-5">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          className={cn(
            inputVariants({ variant, size, state: inputState }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={inputState === 'error'}
          aria-describedby={
            helperText || error || success || warning 
              ? `${props.id}-description` 
              : undefined
          }
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400 w-5 h-5">
              {rightIcon}
            </div>
          </div>
        )}

        {/* State Icons */}
        {inputState === 'error' && !rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          </div>
        )}
        {inputState === 'success' && !rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Helper Text / Error / Success Messages */}
      {(helperText || error || success || warning) && (
        <div 
          id={`${props.id}-description`}
          className={cn(
            'mt-1 text-xs',
            inputState === 'error' && 'text-red-600',
            inputState === 'success' && 'text-green-600',
            inputState === 'warning' && 'text-amber-600',
            inputState === 'default' && 'text-gray-500'
          )}
        >
          {error || success || warning || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Password Input Component
export const PasswordInput = forwardRef(({
  showToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        showToggle ? (
          <button
            type="button"
            onClick={togglePassword}
            className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
            tabIndex={0}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        ) : undefined
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// Search Input Component
export const SearchInput = forwardRef(({
  onClear,
  clearable = true,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      leftIcon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightIcon={
        clearable && props.value ? (
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

// Number Input Component  
export const NumberInput = forwardRef(({
  min,
  max,
  step = 1,
  onIncrement,
  onDecrement,
  showControls = true,
  ...props
}, ref) => {
  const handleIncrement = () => {
    if (onIncrement) {
      onIncrement();
    } else {
      const current = parseFloat(props.value || 0);
      const newValue = current + step;
      if (!max || newValue <= max) {
        props.onChange?.({ target: { value: newValue } });
      }
    }
  };

  const handleDecrement = () => {
    if (onDecrement) {
      onDecrement();
    } else {
      const current = parseFloat(props.value || 0);
      const newValue = current - step;
      if (!min || newValue >= min) {
        props.onChange?.({ target: { value: newValue } });
      }
    }
  };

  return (
    <div className="relative">
      <Input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        className={showControls ? 'pr-8' : ''}
        {...props}
      />
      
      {showControls && (
        <div className="absolute inset-y-0 right-0 flex flex-col">
          <button
            type="button"
            onClick={handleIncrement}
            className="px-2 text-xs text-gray-400 hover:text-gray-600 border-l border-gray-300 flex items-center justify-center flex-1 bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Increment"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="px-2 text-xs text-gray-400 hover:text-gray-600 border-l border-t border-gray-300 flex items-center justify-center flex-1 bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Decrement"
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

// Manufacturing-specific inputs
export const SKUInput = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      placeholder="Enter SKU..."
      pattern="[A-Z0-9-]+"
      title="SKU should contain only uppercase letters, numbers, and hyphens"
      style={{ textTransform: 'uppercase' }}
      {...props}
    />
  );
});

SKUInput.displayName = 'SKUInput';

export const QuantityInput = forwardRef((props, ref) => {
  return (
    <NumberInput
      ref={ref}
      min={0}
      step={1}
      placeholder="Enter quantity..."
      {...props}
    />
  );
});

QuantityInput.displayName = 'QuantityInput';

export const PercentageInput = forwardRef((props, ref) => {
  return (
    <NumberInput
      ref={ref}
      min={0}
      max={100}
      step={0.1}
      placeholder="Enter percentage..."
      rightIcon={<span className="text-gray-500">%</span>}
      {...props}
    />
  );
});

PercentageInput.displayName = 'PercentageInput';

export default Input;