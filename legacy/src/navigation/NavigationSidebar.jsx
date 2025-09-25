import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  TruckIcon,
  BeakerIcon,
  BanknotesIcon,
  AdjustmentsHorizontalIcon,
  DocumentChartBarIcon,
  FolderIcon,
  UserGroupIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigation } from './NavigationProvider';
import { useTheme } from '../theming';

// Navigation configuration with role-based access
const navigationSections = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: HomeIcon,
        permissions: [],
        badge: null
      }
    ]
  },
  {
    title: 'Planning & Analytics',
    items: [
      {
        label: 'Demand Forecasting',
        path: '/forecasting',
        icon: ChartBarIcon,
        permissions: ['forecasting.view'],
        badge: 'AI'
      },
      {
        label: 'Inventory Management',
        path: '/inventory',
        icon: CubeIcon,
        permissions: ['inventory.view'],
        badge: null
      },
      {
        label: 'Production Tracking',
        path: '/production',
        icon: TruckIcon,
        permissions: ['production.view'],
        badge: null
      },
      {
        label: 'Quality Control',
        path: '/quality',
        icon: BeakerIcon,
        permissions: ['quality.view'],
        badge: null
      },
      {
        label: 'AI Analytics',
        path: '/ai-analytics',
        icon: SparklesIcon,
        permissions: ['ai.analytics'],
        badge: 'NEW'
      }
    ]
  },
  {
    title: 'Financial Management',
    items: [
      {
        label: 'Working Capital',
        path: '/working-capital',
        icon: BanknotesIcon,
        permissions: ['workingcapital.view'],
        badge: null
      },
      {
        label: 'What-If Analysis',
        path: '/what-if',
        icon: AdjustmentsHorizontalIcon,
        permissions: ['whatif.analyze'],
        badge: null
      },
      {
        label: 'Financial Reports',
        path: '/financial-reports',
        icon: DocumentChartBarIcon,
        permissions: ['reports.financial'],
        badge: null
      }
    ]
  },
  {
    title: 'Data Management',
    items: [
      {
        label: 'Data Import',
        path: '/data-import',
        icon: FolderIcon,
        permissions: ['data.import'],
        badge: null
      },
      {
        label: 'Import Templates',
        path: '/templates',
        icon: DocumentChartBarIcon,
        permissions: ['data.templates'],
        badge: null
      }
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Admin Panel',
        path: '/admin',
        icon: UserGroupIcon,
        permissions: ['admin.access'],
        badge: null
      },
      {
        label: 'System Settings',
        path: '/settings',
        icon: CogIcon,
        permissions: ['system.settings'],
        badge: null
      }
    ]
  }
];

export const NavigationSidebar = ({ 
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  ...props 
}) => {
  const location = useLocation();
  const { hasPermission } = useAuthRole();
  const { currentPath, suggestions } = useNavigation();
  const { resolvedTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState(new Set());
  
  // Filter navigation items based on permissions
  const filteredNavigation = useMemo(() => {
    return navigationSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.permissions.length === 0 || 
          item.permissions.some(permission => hasPermission(permission))
        )
      }))
      .filter(section => section.items.length > 0);
  }, [hasPermission]);
  
  // Check if path is active (exact match or starts with path)
  const isPathActive = (path) => {
    return currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path));
  };
  
  // Toggle section expansion
  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };
  
  // Get suggestion indicator for navigation item
  const getSuggestionIndicator = (path) => {
    return suggestions.find(suggestion => suggestion.path === path);
  };
  
  const sidebarClasses = `
    flex flex-col h-full transition-all duration-300 ease-in-out
    ${resolvedTheme === 'dark'
      ? 'bg-slate-900 border-slate-700'
      : 'bg-white border-gray-200'
    }
    ${isCollapsed ? 'w-16' : 'w-64'}
    border-r
  `;
  
  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <aside className={`${sidebarClasses} ${className}`} {...props}>
      {/* Sidebar Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h2 className={`font-semibold ${textPrimaryClasses}`}>Sentia</h2>
              <p className={`text-xs ${textMutedClasses}`}>Manufacturing</p>
            </div>
          </div>
        )}
        
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`
            p-1.5 rounded-md transition-colors
            ${resolvedTheme === 'dark'
              ? 'hover:bg-slate-800 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }
          `}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1">
          {filteredNavigation.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              {!isCollapsed && (
                <div className="px-3 mb-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`
                      flex items-center justify-between w-full text-left
                      text-xs font-semibold uppercase tracking-wider
                      ${textMutedClasses}
                    `}
                  >
                    {section.title}
                    <ChevronRightIcon className={`
                      w-3 h-3 transition-transform
                      ${expandedSections.has(section.title) ? 'rotate-90' : ''}
                    `} />
                  </button>
                </div>
              )}
              
              {/* Navigation Items */}
              <div className={`
                space-y-1 px-2
                ${!isCollapsed && expandedSections.has(section.title) ? '' : 'hidden'}
                ${isCollapsed ? 'block' : ''}
              `}>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = isPathActive(item.path);
                  const suggestion = getSuggestionIndicator(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        group relative flex items-center px-2 py-2 text-sm font-medium rounded-md
                        transition-all duration-200
                        ${isActive
                          ? resolvedTheme === 'dark'
                            ? 'bg-blue-900 text-blue-100 border-r-2 border-blue-400'
                            : 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : resolvedTheme === 'dark'
                            ? 'text-gray-300 hover:bg-slate-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {/* Icon */}
                      <IconComponent className={`
                        flex-shrink-0 w-5 h-5
                        ${isCollapsed ? 'mx-auto' : 'mr-3'}
                        ${isActive ? 'text-current' : 'text-current'}
                      `} />
                      
                      {/* Label and badges */}
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {/* Suggestion indicator */}
                            {suggestion && (
                              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            )}
                            
                            {/* Badge */}
                            {item.badge && (
                              <span className={`
                                inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                                ${item.badge === 'AI'
                                  ? resolvedTheme === 'dark'
                                    ? 'bg-purple-900 text-purple-200'
                                    : 'bg-purple-100 text-purple-800'
                                  : item.badge === 'NEW'
                                    ? resolvedTheme === 'dark'
                                      ? 'bg-green-900 text-green-200'
                                      : 'bg-green-100 text-green-800'
                                    : resolvedTheme === 'dark'
                                      ? 'bg-gray-700 text-gray-300'
                                      : 'bg-gray-100 text-gray-700'
                                }
                              `}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className={`
                          absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap
                          opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity
                          z-50
                          ${resolvedTheme === 'dark'
                            ? 'bg-slate-800 text-gray-100 border border-slate-600'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                          }
                        `}>
                          {item.label}
                          {item.badge && (
                            <span className={`ml-1 text-xs ${textMutedClasses}`}>
                              ({item.badge})
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      
      {/* Smart suggestions at bottom */}
      {!isCollapsed && suggestions.length > 0 && (
        <div className={`
          p-3 border-t
          ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center mb-2">
            <LightBulbIcon className="w-4 h-4 text-yellow-500 mr-1" />
            <span className={`text-xs font-semibold ${textMutedClasses}`}>
              Smart Suggestions
            </span>
          </div>
          
          <div className="space-y-1">
            {suggestions.slice(0, 2).map((suggestion) => (
              <Link
                key={suggestion.path}
                to={suggestion.path}
                className={`
                  block px-2 py-1 text-xs rounded transition-colors
                  ${resolvedTheme === 'dark'
                    ? 'text-gray-400 hover:bg-slate-800 hover:text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                {suggestion.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default NavigationSidebar;
