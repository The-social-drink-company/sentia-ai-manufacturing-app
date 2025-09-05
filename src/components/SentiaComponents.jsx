// Sentia Spirits Premium Component Library
// World-Class Enterprise UI Components

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/sentia-branding.css';

// Premium Card Component
export const SentiaCard = ({ 
  children, 
  title, 
  subtitle, 
  icon, 
  className = '', 
  hoverable = true,
  onClick 
}) => {
  return (
    <motion.div
      className={`sentia-card ${hoverable ? 'hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hoverable ? { scale: 1.02 } : {}}
    >
      {(title || subtitle || icon) && (
        <div className="sentia-card-header flex items-center justify-between">
          <div className="flex-1">
            {title && <h3 className="sentia-card-title">{title}</h3>}
            {subtitle && <p className="sentia-card-subtitle">{subtitle}</p>}
          </div>
          {icon && <div className="text-2xl">{icon}</div>}
        </div>
      )}
      <div className="sentia-card-content">
        {children}
      </div>
    </motion.div>
  );
};

// Premium Metric Display
export const SentiaMetric = ({ 
  label, 
  value, 
  change, 
  trend = 'neutral',
  format = 'number',
  icon
}) => {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', { 
          style: 'currency', 
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percent':
        return `${val}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-GB').format(val);
    }
  };

  return (
    <motion.div 
      className="sentia-metric"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="sentia-metric-label">{label}</span>
      </div>
      <div className="sentia-metric-value">
        {formatValue(value)}
      </div>
      {change !== undefined && (
        <div className={`sentia-metric-change ${trend}`}>
          <span>{trend === 'positive' ? '↑' : trend === 'negative' ? '↓' : '→'}</span>
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </motion.div>
  );
};

// Premium Button Component
export const SentiaButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={`sentia-btn sentia-btn-${variant} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

// Premium Progress Bar
export const SentiaProgress = ({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  color = 'primary',
  animated = true 
}) => {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    primary: 'bg-black',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600'
  };

  return (
    <div className="sentia-progress">
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Premium Badge Component
export const SentiaBadge = ({ 
  children, 
  variant = 'default',
  size = 'medium',
  dot = false 
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-black text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
      {children}
    </span>
  );
};

// Premium Tab Component
export const SentiaTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <SentiaBadge size="small" variant={activeTab === tab.id ? 'primary' : 'default'}>
                  {tab.count}
                </SentiaBadge>
              )}
            </div>
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

// Premium Alert Component
export const SentiaAlert = ({ 
  children, 
  variant = 'info', 
  title, 
  dismissible = false,
  onDismiss 
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  };

  const iconMap = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    danger: '✕'
  };

  return (
    <motion.div
      className={`rounded-lg border p-4 ${variantClasses[variant]}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-2xl">{iconMap[variant]}</span>
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 text-current hover:opacity-75"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Premium Loading Skeleton
export const SentiaSkeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height = '20px',
  className = '' 
}) => {
  const variantStyles = {
    text: { height: '20px', borderRadius: '4px' },
    title: { height: '32px', borderRadius: '4px' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%' },
    image: { height: '200px', borderRadius: '8px' },
    card: { height: '120px', borderRadius: '8px' }
  };

  const style = variant === 'custom' 
    ? { width, height } 
    : { ...variantStyles[variant], width };

  return (
    <div 
      className={`sentia-skeleton ${className}`} 
      style={style}
    />
  );
};

// Premium Modal Component
export const SentiaModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer,
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    fullscreen: 'max-w-full h-full'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full`}>
              {title && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">{title}</h2>
                </div>
              )}
              <div className="px-6 py-4">
                {children}
              </div>
              {footer && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Premium Data Table Component
export const SentiaTable = ({ 
  columns, 
  data, 
  loading = false,
  emptyMessage = 'No data available' 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <SentiaSkeleton key={i} height="60px" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="sentia-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} style={{ width: column.width }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
            >
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Export all components
export default {
  SentiaCard,
  SentiaMetric,
  SentiaButton,
  SentiaProgress,
  SentiaBadge,
  SentiaTabs,
  SentiaAlert,
  SentiaSkeleton,
  SentiaModal,
  SentiaTable
};