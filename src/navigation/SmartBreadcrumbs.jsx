import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useNavigation } from './NavigationProvider';
import { useTheme } from '../theming';

export const SmartBreadcrumbs = ({ 
  className = '',
  showHomeIcon = true,
  maxItems = 5,
  ...props 
}) => {
  const { breadcrumbs, navigateToPath } = useNavigation();
  const { resolvedTheme } = useTheme();
  
  // Truncate breadcrumbs if too many
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        breadcrumbs[0], // Always show first (Dashboard)
        { label: '...', path: null, isEllipsis: true },
        ...breadcrumbs.slice(-(maxItems - 2)) // Show last few
      ]
    : breadcrumbs;
  
  const handleBreadcrumbClick = (path) => {
    if (path) {
      navigateToPath(path);
    }
  };
  
  const baseClasses = 'flex items-center space-x-2 text-sm';
  const themeClasses = resolvedTheme === 'dark' 
    ? 'text-gray-300' 
    : 'text-gray-600';
  
  return (
    <nav 
      className={`${baseClasses} ${themeClasses} ${className}`}
      aria-label="Breadcrumb navigation"
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {displayBreadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {/* Separator (except for first item) */}
            {index > 0 && (
              <ChevronRightIcon 
                className="w-4 h-4 mx-2 text-gray-400" 
                aria-hidden="true"
              />
            )}
            
            {/* Breadcrumb item */}
            {crumb.isEllipsis ? (
              <span className="px-2 py-1 text-gray-400">...</span>
            ) : crumb.isLast ? (
              // Current page - not clickable
              <span 
                className={`
                  px-2 py-1 font-medium rounded-md
                  ${resolvedTheme === 'dark' 
                    ? 'text-white bg-slate-700' 
                    : 'text-gray-900 bg-gray-100'
                  }
                `}
                aria-current="page"
              >
                {index === 0 && showHomeIcon && (
                  <HomeIcon className="w-4 h-4 inline mr-1" />
                )}
                {crumb.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <button
                onClick={() => handleBreadcrumbClick(crumb.path)}
                className={`
                  px-2 py-1 rounded-md transition-colors duration-200
                  hover:bg-opacity-75 focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:ring-opacity-50
                  ${resolvedTheme === 'dark'
                    ? 'hover:bg-slate-700 hover:text-white'
                    : 'hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={`Navigate to ${crumb.label}`}
              >
                {index === 0 && showHomeIcon && (
                  <HomeIcon className="w-4 h-4 inline mr-1" />
                )}
                {crumb.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default SmartBreadcrumbs;