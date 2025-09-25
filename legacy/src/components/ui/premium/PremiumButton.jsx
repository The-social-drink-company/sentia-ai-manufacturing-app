
import React from 'react';
import { cn } from '../../../lib/utils';

const PremiumButton = React.forwardRef(({ 
  className, 
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props 
}, ref) => {
  const baseClasses = 'sentia-btn inline-flex items-center justify-center font-bold transition-all duration-200';
  
  const variants = {
    primary: 'sentia-btn-primary bg-black text-white hover:bg-gray-800',
    secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-900 hover:bg-gray-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {loading && <div className="sentia-loading mr-2" />}
      {children}
    </button>
  );
});

PremiumButton.displayName = 'PremiumButton';

export { PremiumButton };

