// Theme-aware component wrappers and utilities
import React from 'react';
import { useTheme } from './ThemeProvider';
import { getThemeClasses, THEME_CLASSES, MANUFACTURING_THEME_CLASSES } from './themeUtils';

/**
 * Theme-aware Card component
 */
export const ThemedCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const cardClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.card);
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg',
    bordered: 'border-2'
  };
  
  return (
    <div 
      className={`${cardClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Theme-aware Input component
 */
export const ThemedInput = ({ 
  className = '', 
  error = false,
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const inputClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.input);
  const errorClasses = error ? 
    'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  
  return (
    <input 
      className={`${inputClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
};

/**
 * Theme-aware Button component (secondary variant)
 */
export const ThemedSecondaryButton = ({ 
  children,
  className = '', 
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const buttonClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.buttonSecondary);
  
  return (
    <button 
      className={`${buttonClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Theme-aware Status Badge
 */
export const ThemedStatusBadge = ({ 
  status = 'info', 
  children,
  className = '',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const statusClasses = getThemeClasses(
    resolvedTheme, 
    THEME_CLASSES[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]
  );
  
  return (
    <span 
      className={`${statusClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Manufacturing-specific KPI Card
 */
export const ManufacturingKPICard = ({ 
  title, 
  value, 
  unit = '', 
  trend = null,
  status = 'info',
  className = '',
  children,
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const cardClasses = getThemeClasses(resolvedTheme, MANUFACTURING_THEME_CLASSES.kpiCard);
  const textPrimaryClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.textPrimary);
  const textSecondaryClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.textSecondary);
  
  return (
    <div 
      className={`${cardClasses} ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${textSecondaryClasses}`}>
          {title}
        </h3>
        {trend && (
          <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className={`text-3xl font-semibold ${textPrimaryClasses}`}>
          {value}
          {unit && <span className={`text-lg ${textSecondaryClasses} ml-1`}>{unit}</span>}
        </p>
      </div>
      <div className="mt-4">
        <ThemedStatusBadge status={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </ThemedStatusBadge>
      </div>
      {children}
    </div>
  );
};

/**
 * Manufacturing Production Status Component
 */
export const ProductionStatusIndicator = ({ 
  status = 'idle', 
  label,
  className = '',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const statusClasses = getThemeClasses(
    resolvedTheme, 
    MANUFACTURING_THEME_CLASSES[`production${status.charAt(0).toUpperCase() + status.slice(1)}`]
  );
  
  const statusLabels = {
    active: 'Active',
    idle: 'Idle',
    down: 'Down',
    maintenance: 'Maintenance'
  };
  
  return (
    <div className={`flex items-center ${className}`} {...props}>
      <div 
        className={`w-3 h-3 rounded-full mr-2 ${
          status === 'active' ? 'bg-green-500' :
          status === 'idle' ? 'bg-yellow-500' :
          status === 'down' ? 'bg-red-500' : 'bg-gray-500'
        }`} 
      />
      <span className={statusClasses}>
        {label || statusLabels[status] || status}
      </span>
    </div>
  );
};

/**
 * Theme-aware Chart Container
 */
export const ThemedChartContainer = ({ 
  title,
  children, 
  className = '',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const containerClasses = getThemeClasses(resolvedTheme, MANUFACTURING_THEME_CLASSES.chartContainer);
  const textPrimaryClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.textPrimary);
  
  return (
    <div 
      className={`${containerClasses} ${className}`}
      {...props}
    >
      {title && (
        <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
          {title}
        </h3>
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

/**
 * Theme-aware Data Table
 */
export const ThemedDataTable = ({ 
  headers = [], 
  data = [], 
  className = '',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const headerClasses = getThemeClasses(resolvedTheme, MANUFACTURING_THEME_CLASSES.tableHeader);
  const rowClasses = getThemeClasses(resolvedTheme, MANUFACTURING_THEME_CLASSES.tableRow);
  const textPrimaryClasses = getThemeClasses(resolvedTheme, THEME_CLASSES.textPrimary);
  
  return (
    <div className={`overflow-x-auto ${className}`} {...props}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={headerClasses}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowClasses}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-6 py-4 text-sm ${textPrimaryClasses}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Manufacturing Alert Component
 */
export const ManufacturingAlert = ({ 
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  ...props 
}) => {
  const { resolvedTheme } = useTheme();
  
  const alertClasses = {
    info: getThemeClasses(resolvedTheme, THEME_CLASSES.statusInfo),
    success: getThemeClasses(resolvedTheme, THEME_CLASSES.statusSuccess),
    warning: getThemeClasses(resolvedTheme, THEME_CLASSES.statusWarning),
    error: getThemeClasses(resolvedTheme, THEME_CLASSES.statusError)
  };
  
  return (
    <div 
      className={`
        p-4 rounded-lg border-l-4 
        ${alertClasses[type]} 
        ${className}
      `}
      {...props}
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default {
  ThemedCard,
  ThemedInput,
  ThemedSecondaryButton,
  ThemedStatusBadge,
  ManufacturingKPICard,
  ProductionStatusIndicator,
  ThemedChartContainer,
  ThemedDataTable,
  ManufacturingAlert
};