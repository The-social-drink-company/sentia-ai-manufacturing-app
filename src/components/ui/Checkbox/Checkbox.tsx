// Enterprise Checkbox component with indeterminate state

import React, { forwardRef, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        default: 'h-4 w-4',
        lg: 'h-5 w-5'
      },
      variant: {
        default: '',
        destructive: 'border-red-500 data-[state=checked]:bg-red-500',
        success: 'border-green-500 data-[state=checked]:bg-green-500',
        warning: 'border-yellow-500 data-[state=checked]:bg-yellow-500'
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default'
    }
  }
);

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'>,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean;
  label?: string;
  description?: string;
  error?: string;
  onChange?: (checked: boolean) => void;
  containerClassName?: string;
  'data-testid'?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      containerClassName,
      size,
      variant,
      indeterminate = false,
      label,
      description,
      error,
      checked,
      onChange,
      disabled,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const internalRef = ref || inputRef;

    // Handle indeterminate state
    useEffect(() => {
      if (typeof internalRef === 'object' && internalRef?.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, internalRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    const computedVariant = error ? 'destructive' : variant;
    const isChecked = indeterminate ? false : checked;
    const dataState = indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked';

    const checkboxElement = (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          ref={internalRef}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          data-testid={testId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${testId}-error` : 
            description ? `${testId}-description` : 
            undefined
          }
          {...props}
        />
        <div
          className={cn(
            checkboxVariants({ size, variant: computedVariant }),
            'flex items-center justify-center transition-colors cursor-pointer',
            disabled && 'cursor-not-allowed',
            className
          )}
          data-state={dataState}
          onClick={() => {
            if (!disabled && typeof internalRef === 'object' && internalRef?.current) {
              internalRef.current.click();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled && typeof internalRef === 'object' && internalRef?.current) {
                internalRef.current.click();
              }
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="checkbox"
          aria-checked={indeterminate ? 'mixed' : isChecked}
          aria-disabled={disabled}
          data-testid={`${testId}-visual`}
        >
          {indeterminate ? (
            <Minus className={cn(
              'text-current',
              size === 'sm' && 'h-2 w-2',
              size === 'default' && 'h-3 w-3',
              size === 'lg' && 'h-4 w-4'
            )} />
          ) : isChecked ? (
            <Check className={cn(
              'text-current',
              size === 'sm' && 'h-2 w-2',
              size === 'default' && 'h-3 w-3',
              size === 'lg' && 'h-4 w-4'
            )} />
          ) : null}
        </div>
      </div>
    );

    // If no label, return just the checkbox
    if (!label && !description && !error) {
      return checkboxElement;
    }

    // Return checkbox with label and description
    return (
      <div className={cn('space-y-2', containerClassName)}>
        <div className="flex items-start space-x-2">
          {checkboxElement}
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label
                className={cn(
                  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  disabled && 'opacity-50'
                )}
                onClick={() => {
                  if (!disabled && typeof internalRef === 'object' && internalRef?.current) {
                    internalRef.current.click();
                  }
                }}
              >
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p 
                className="text-xs text-muted-foreground"
                id={`${testId}-description`}
                data-testid={`${testId}-description`}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p 
            className="text-xs text-red-600 dark:text-red-400 ml-6"
            id={`${testId}-error`}
            data-testid={`${testId}-error`}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
export type { CheckboxProps };