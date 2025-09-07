import React, { useState, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  type,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputClasses = cn(
    'w-full px-3 py-2 border rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'placeholder:text-gray-400',
    'disabled:bg-gray-50 disabled:cursor-not-allowed',
    // Default state
    !error && !success && 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    // Error state
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50',
    // Success state
    success && 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50',
    // Focus animation
    isFocused && 'scale-[1.01] shadow-lg',
    // Icon padding
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    isPassword && 'pr-10',
    fullWidth && 'w-full',
    className
  );

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium transition-colors duration-200',
            error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={cn(
            'absolute inset-y-0 flex items-center pointer-events-none',
            iconPosition === 'left' ? 'left-3' : 'right-3'
          )}>
            <span className={cn(
              'h-4 w-4 transition-colors duration-200',
              error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400'
            )}>
              {icon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={inputClasses}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </button>
        )}
        
        {(error || success) && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {error && (
              <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            )}
            {success && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {hint && !error && !success && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 flex items-center space-x-1 animate-shake">
          <ExclamationCircleIcon className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
      
      {success && (
        <p className="text-xs text-green-600 flex items-center space-x-1 animate-fade-in">
          <CheckCircleIcon className="h-3 w-3" />
          <span>{success}</span>
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface SearchInputProps extends Omit<InputProps, 'type'> {
  onSearch?: (value: string) => void;
  searchDelay?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  searchDelay = 300,
  placeholder = "Search...",
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('');
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearch?.(value);
    }, searchDelay);
  };

  return (
    <Input
      type="search"
      value={searchValue}
      onChange={handleChange}
      placeholder={placeholder}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  );
};