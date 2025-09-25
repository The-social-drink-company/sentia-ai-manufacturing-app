import React, { useState } from 'react';
import { 
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShareIcon,
  Squares2X2Icon,
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  CalendarIcon,
  ShoppingCartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigation } from './NavigationProvider';
import { useTheme } from '../theming';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


export const QuickActions = ({ 
  className = '',
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'dropdown'
  showLabels = true,
  maxActions = 6,
  ...props 
}) => {
  const { quickActions, executeQuickAction, currentPath } = useNavigation();
  const { resolvedTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(null);
  
  // Icon mapping for actions
  const iconMap = {
    'download': ArrowDownTrayIcon,
    'refresh': ArrowPathIcon,
    'share': ShareIcon,
    'layout': Squares2X2Icon,
    'plus': PlusIcon,
    'document': DocumentTextIcon,
    'chart': ChartBarIcon,
    'play': PlayIcon,
    'calendar': CalendarIcon,
    'shopping-cart': ShoppingCartIcon,
    'check-circle': CheckCircleIcon
  };
  
  const handleActionClick = async (action) => {
    setIsExecuting(action.action);
    
    try {
      await executeQuickAction(action.action);
      
      // Track action execution
      window.dispatchEvent(new CustomEvent('sentia-quick-action-executed', {
        detail: { action: action.action, currentPath }
      }));
    } catch (error) {
      logError('Quick action failed:', error);
    } finally {
      setTimeout(() => setIsExecuting(null), 1000);
    }
    
    if (variant === 'dropdown') {
      setIsDropdownOpen(false);
    }
  };
  
  const getButtonClasses = (isActive = false) => `
    inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
    ${resolvedTheme === 'dark'
      ? `bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white
         ${isActive ? 'bg-slate-600 text-white' : ''}`
      : `bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900
         ${isActive ? 'bg-gray-200 text-gray-900' : ''}`
    }
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  if (quickActions.length === 0) {
    return null;
  }
  
  // Horizontal layout
  if (variant === 'horizontal') {
    const displayActions = quickActions.slice(0, maxActions);
    
    return (
      <div className={`flex items-center space-x-2 ${className}`} {...props}>
        {displayActions.map((action) => {
          const IconComponent = iconMap[action.icon] || EllipsisVerticalIcon;
          const isActive = isExecuting === action.action;
          
          return (
            <button
              key={action.action}
              onClick={() => handleActionClick(action)}
              disabled={isActive}
              className={getButtonClasses(isActive)}
              title={action.label}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              {showLabels && (
                <span className="ml-2 hidden sm:inline">
                  {action.label}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Show more actions button if there are more than maxActions */}
        {quickActions.length > maxActions && (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={getButtonClasses()}
            title="More actions"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
  
  // Vertical layout
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col space-y-1 ${className}`} {...props}>
        {quickActions.slice(0, maxActions).map((action) => {
          const IconComponent = iconMap[action.icon] || EllipsisVerticalIcon;
          const isActive = isExecuting === action.action;
          
          return (
            <button
              key={action.action}
              onClick={() => handleActionClick(action)}
              disabled={isActive}
              className={`${getButtonClasses(isActive)} justify-start w-full`}
              title={action.label}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              {showLabels && (
                <span className="ml-2">{action.label}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  
  // Dropdown layout
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} {...props}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={getButtonClasses(isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
          {showLabels && (
            <span className="ml-2 hidden sm:inline">Actions</span>
          )}
        </button>
        
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className={`
              absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20
              ${resolvedTheme === 'dark'
                ? 'bg-slate-800 border border-slate-700'
                : 'bg-white border border-gray-200'
              }
            `}>
              <div className="py-1">
                {quickActions.map((action, index) => {
                  const IconComponent = iconMap[action.icon] || EllipsisVerticalIcon;
                  const isActive = isExecuting === action.action;
                  
                  return (
                    <button
                      key={action.action}
                      onClick={() => handleActionClick(action)}
                      disabled={isActive}
                      className={`
                        w-full text-left px-4 py-2 text-sm flex items-center
                        transition-colors duration-150
                        ${resolvedTheme === 'dark'
                          ? 'text-gray-300 hover:bg-slate-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${index > 0 ? (resolvedTheme === 'dark' ? 'border-t border-slate-700' : 'border-t border-gray-100') : ''}
                      `}
                    >
                      <IconComponent className={`w-4 h-4 mr-3 ${isActive ? 'animate-pulse' : ''}`} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  
  return null;
};

export default QuickActions;