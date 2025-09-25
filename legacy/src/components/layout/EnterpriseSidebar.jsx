/**
 * ENTERPRISE SIDEBAR NAVIGATION
 * World-class navigation system with intelligent features
 * Inspired by DataDog, Palantir, and Bloomberg Terminal
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  // Core Navigation Icons
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  Cog6ToothIcon,
  UsersIcon,

  // Feature Icons
  PresentationChartLineIcon,
  TruckIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  CircleStackIcon,
  SignalIcon,
  CpuChipIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  DocumentMagnifyingGlassIcon,

  // UI Icons
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon as RecentIcon,
  BookmarkIcon,
  BellIcon,
  XMarkIcon,
  PlusIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,

  // Action Icons
  ArrowRightIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLayoutStore } from '../../stores/layoutStore';
import { useEnterpriseTheme } from '../ui/EnterpriseThemeSwitcher';
import { logDebug } from '../../utils/logger';

// Navigation Structure
const navigationStructure = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Executive Dashboard',
        icon: HomeIcon,
        path: '/dashboard',
        shortcut: 'G O',
        description: 'Real-time business metrics',
        badge: { type: 'live', text: 'LIVE' },
        permissions: ['dashboard.view']
      },
      {
        id: 'ai-insights',
        label: 'AI Insights',
        icon: SparklesIcon,
        path: '/ai-insights',
        shortcut: 'G I',
        description: 'Intelligent business recommendations',
        badge: { type: 'new', text: 'AI' },
        permissions: ['ai.view']
      }
    ]
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    items: [
      {
        id: 'production',
        label: 'Production Control',
        icon: TruckIcon,
        path: '/production',
        shortcut: 'G P',
        description: 'Manufacturing operations',
        permissions: ['production.view'],
        subItems: [
          { id: 'jobs', label: 'Active Jobs', path: '/production/jobs' },
          { id: 'schedule', label: 'Schedule', path: '/production/schedule' },
          { id: 'capacity', label: 'Capacity Planning', path: '/production/capacity' }
        ]
      },
      {
        id: 'inventory',
        label: 'Inventory Management',
        icon: CubeIcon,
        path: '/inventory',
        shortcut: 'G N',
        description: 'Stock levels and optimization',
        permissions: ['inventory.view'],
        subItems: [
          { id: 'stock', label: 'Stock Levels', path: '/inventory/stock' },
          { id: 'movements', label: 'Movements', path: '/inventory/movements' },
          { id: 'optimization', label: 'Optimization', path: '/inventory/optimization' }
        ]
      },
      {
        id: 'quality',
        label: 'Quality Control',
        icon: BeakerIcon,
        path: '/quality',
        shortcut: 'G Q',
        description: 'Quality assurance metrics',
        permissions: ['quality.view']
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Planning',
    items: [
      {
        id: 'forecasting',
        label: 'Demand Forecasting',
        icon: ArrowTrendingUpIcon,
        path: '/forecasting',
        shortcut: 'G F',
        description: 'Predictive demand analysis',
        badge: { type: 'ml', text: 'ML' },
        permissions: ['forecasting.view']
      },
      {
        id: 'analytics',
        label: 'Advanced Analytics',
        icon: ChartBarIcon,
        path: '/analytics',
        shortcut: 'G A',
        description: 'Deep business intelligence',
        permissions: ['analytics.view'],
        subItems: [
          { id: 'reports', label: 'Reports', path: '/analytics/reports' },
          { id: 'visualizations', label: 'Visualizations', path: '/analytics/viz' },
          { id: 'export', label: 'Export Center', path: '/analytics/export' }
        ]
      }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Management',
    items: [
      {
        id: 'working-capital',
        label: 'Working Capital',
        icon: BanknotesIcon,
        path: '/working-capital',
        shortcut: 'G W',
        description: 'Cash flow optimization',
        badge: { type: 'critical', text: '$' },
        permissions: ['finance.view']
      },
      {
        id: 'what-if',
        label: 'What-If Analysis',
        icon: AdjustmentsHorizontalIcon,
        path: '/what-if',
        shortcut: 'G H',
        description: 'Scenario modeling',
        permissions: ['finance.analyze']
      },
      {
        id: 'pricing',
        label: 'Pricing Strategy',
        icon: CurrencyDollarIcon,
        path: '/pricing',
        description: 'Dynamic pricing models',
        permissions: ['pricing.view']
      }
    ]
  },
  {
    id: 'integration',
    title: 'Integrations',
    items: [
      {
        id: 'ecommerce',
        label: 'E-Commerce',
        icon: ShoppingCartIcon,
        path: '/integrations/ecommerce',
        description: 'Online sales channels',
        permissions: ['integrations.view'],
        subItems: [
          { id: 'shopify', label: 'Shopify', path: '/integrations/shopify' },
          { id: 'amazon', label: 'Amazon', path: '/integrations/amazon' },
          { id: 'woocommerce', label: 'WooCommerce', path: '/integrations/woocommerce' }
        ]
      },
      {
        id: 'erp',
        label: 'ERP Systems',
        icon: CircleStackIcon,
        path: '/integrations/erp',
        description: 'Enterprise resource planning',
        permissions: ['integrations.view']
      }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      {
        id: 'users',
        label: 'User Management',
        icon: UsersIcon,
        path: '/admin/users',
        shortcut: 'G U',
        description: 'Users and permissions',
        permissions: ['admin.users']
      },
      {
        id: 'settings',
        label: 'System Settings',
        icon: Cog6ToothIcon,
        path: '/admin/settings',
        shortcut: 'G S',
        description: 'Configuration and preferences',
        permissions: ['admin.settings']
      },
      {
        id: 'data-import',
        label: 'Data Import',
        icon: DocumentArrowUpIcon,
        path: '/data-import',
        shortcut: 'G D',
        description: 'Import and sync data',
        permissions: ['data.import']
      }
    ]
  }
];

// Sidebar Component
export const EnterpriseSidebar = ({ onClose = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthRole();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayoutStore();
  const { isDark } = useEnterpriseTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['overview', 'manufacturing']));
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('sentia-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [recentItems, setRecentItems] = useState(() => {
    const saved = localStorage.getItem('sentia-recent');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'flat' | 'compact'

  // Track visited pages
  useEffect(() => {
    const currentPath = location.pathname;
    const item = findItemByPath(currentPath);

    if (item) {
      const newRecent = [
        { ...item, visitedAt: Date.now() },
        ...recentItems.filter(r => r.path !== currentPath)
      ].slice(0, 5);

      setRecentItems(newRecent);
      localStorage.setItem('sentia-recent', JSON.stringify(newRecent));
    }
  }, [location.pathname]);

  // Helper function to find item by path
  const findItemByPath = (path) => {
    for (const section of navigationStructure) {
      for (const item of section.items) {
        if (item.path === path) return item;
        if (item.subItems) {
          const subItem = item.subItems.find(sub => sub.path === path);
          if (subItem) return { ...subItem, parent: item };
        }
      }
    }
    return null;
  };

  // Filter navigation based on permissions and search
  const filteredNavigation = useMemo(() => {
    return navigationStructure.map(section => {
      const filteredItems = section.items.filter(item => {
        // Check permissions
        if (item.permissions && !item.permissions.some(p => hasPermission(p))) {
          return false;
        }

        // Check search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesItem =
            item.label.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query);

          const matchesSubItems = item.subItems?.some(sub =>
            sub.label.toLowerCase().includes(query)
          );

          return matchesItem || matchesSubItems;
        }

        return true;
      });

      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  }, [searchQuery, hasPermission]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Toggle item expansion (for subitems)
  const toggleItem = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Toggle favorite
  const toggleFavorite = (item) => {
    const newFavorites = new Set(favorites);
    const key = item.path;

    if (newFavorites.has(key)) {
      newFavorites.delete(key);
    } else {
      newFavorites.add(key);
    }

    setFavorites(newFavorites);
    localStorage.setItem('sentia-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  // Keyboard navigation
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    document.getElementById('sidebar-search')?.focus();
  });

  // Setup navigation shortcuts
  navigationStructure.forEach(section => {
    section.items.forEach(item => {
      if (item.shortcut) {
        useHotkeys(item.shortcut.toLowerCase().replace(' ', '+'), (e) => {
          e.preventDefault();
          navigate(item.path);
        });
      }
    });
  });

  // Check if path is active
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        ${sidebarCollapsed ? 'w-20' : 'w-80'}
        h-full bg-white dark:bg-quantum-surface
        border-r border-gray-200 dark:border-quantum-border
        flex flex-col transition-all duration-300
        shadow-xl dark:shadow-2xl
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-quantum-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl
                          flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Sentia Enterprise
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manufacturing OS
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-quantum-hover rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-quantum-border">
          <div className="relative">
            <input
              id="sidebar-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search... (Ctrl+K)"
              className="w-full pl-10 pr-8 py-2 bg-gray-50 dark:bg-quantum-twilight
                       border border-gray-200 dark:border-quantum-border rounded-lg
                       text-sm text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 p-0.5 hover:bg-gray-200 dark:hover:bg-quantum-hover rounded"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      {!sidebarCollapsed && !searchQuery && (
        <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-quantum-border">
          <button
            onClick={() => setViewMode('grouped')}
            className={`p-1.5 rounded ${viewMode === 'grouped' ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            aria-label="Grouped view"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`p-1.5 rounded ${viewMode === 'flat' ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            aria-label="Flat view"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
          <div className="ml-auto">
            <button className="p-1.5 text-gray-400 hover:text-gray-600">
              <FunnelIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        {/* Favorites Section */}
        {!sidebarCollapsed && favorites.size > 0 && !searchQuery && (
          <div className="mb-4">
            <div className="px-4 py-1">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Favorites
              </h3>
            </div>
            <div className="px-2">
              {Array.from(favorites).map(path => {
                const item = findItemByPath(path);
                if (!item) return null;
                return (
                  <NavigationItem
                    key={path}
                    item={item}
                    isActive={isPathActive(path)}
                    isCollapsed={sidebarCollapsed}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(item)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Items */}
        {!sidebarCollapsed && recentItems.length > 0 && !searchQuery && viewMode === 'grouped' && (
          <div className="mb-4">
            <div className="px-4 py-1">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent
              </h3>
            </div>
            <div className="px-2">
              {recentItems.slice(0, 3).map((item, idx) => (
                <NavigationItem
                  key={`${item.path}-${idx}`}
                  item={item}
                  isActive={isPathActive(item.path)}
                  isCollapsed={sidebarCollapsed}
                  isFavorite={favorites.has(item.path)}
                  onToggleFavorite={() => toggleFavorite(item)}
                  isRecent={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        {filteredNavigation.map((section) => (
          <div key={section.id} className="mb-2">
            {/* Section Header */}
            {!sidebarCollapsed && viewMode === 'grouped' && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-1.5 flex items-center justify-between
                         hover:bg-gray-50 dark:hover:bg-quantum-hover transition-colors"
              >
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <ChevronDownIcon
                  className={`w-3 h-3 text-gray-400 transition-transform ${
                    expandedSections.has(section.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            {/* Section Items */}
            <AnimatePresence>
              {(viewMode !== 'grouped' || expandedSections.has(section.id)) && (
                <motion.div
                  initial={viewMode === 'grouped' ? { height: 0, opacity: 0 } : false}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={viewMode === 'grouped' ? { height: 0, opacity: 0 } : false}
                  transition={{ duration: 0.2 }}
                  className="px-2"
                >
                  {section.items.map((item) => (
                    <div key={item.id}>
                      <NavigationItem
                        item={item}
                        isActive={isPathActive(item.path)}
                        isCollapsed={sidebarCollapsed}
                        isExpanded={expandedItems.has(item.id)}
                        onToggleExpand={() => toggleItem(item.id)}
                        isFavorite={favorites.has(item.path)}
                        onToggleFavorite={() => toggleFavorite(item)}
                      />

                      {/* Sub Items */}
                      {item.subItems && expandedItems.has(item.id) && !sidebarCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-10 space-y-1"
                        >
                          {item.subItems.map((subItem) => (
                            <NavigationItem
                              key={subItem.id}
                              item={subItem}
                              isActive={isPathActive(subItem.path)}
                              isCollapsed={sidebarCollapsed}
                              isSubItem={true}
                              isFavorite={favorites.has(subItem.path)}
                              onToggleFavorite={() => toggleFavorite(subItem)}
                            />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-quantum-border space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-quantum-hover rounded-lg">
            <BellIcon className="w-4 h-4" />
            <span>Notifications</span>
            <span className="ml-auto bg-brand-primary text-white text-xs px-1.5 py-0.5 rounded-full">
              3
            </span>
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-quantum-hover rounded-lg">
            <CommandLineIcon className="w-4 h-4" />
            <span>Command Palette</span>
            <kbd className="ml-auto text-xs bg-gray-100 dark:bg-quantum-twilight px-1.5 py-0.5 rounded">
              Cmd+K
            </kbd>
          </button>
        </div>
      )}
    </motion.aside>
  );
};

// Navigation Item Component
const NavigationItem = ({
  item,
  isActive,
  isCollapsed,
  isExpanded,
  onToggleExpand,
  isFavorite,
  onToggleFavorite,
  isSubItem = false,
  isRecent = false
}) => {
  const Icon = item.icon;

  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="relative group"
    >
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-all duration-200
          ${isActive
            ? 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-quantum-hover hover:text-gray-900 dark:hover:text-white'
          }
          ${isSubItem ? 'text-sm' : ''}
        `}
      >
        {/* Icon */}
        {Icon && (
          <div className={`flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
            <Icon className={isSubItem ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
        )}

        {/* Label and Description */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className={`
                  px-1.5 py-0.5 text-xs font-medium rounded-md
                  ${item.badge.type === 'live' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                  ${item.badge.type === 'new' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                  ${item.badge.type === 'ml' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : ''}
                  ${item.badge.type === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                `}>
                  {item.badge.text}
                </span>
              )}
            </div>
            {item.description && !isSubItem && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Favorite Toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-quantum-hover rounded"
            >
              {isFavorite ? (
                <StarIconSolid className="w-4 h-4 text-yellow-500" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Expand Toggle for items with subitems */}
            {item.subItems && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleExpand();
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-quantum-hover rounded"
              >
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>
        )}

        {/* Shortcut Hint */}
        {!isCollapsed && item.shortcut && (
          <kbd className="hidden group-hover:block absolute right-2 text-xs
                        bg-gray-100 dark:bg-quantum-twilight px-1.5 py-0.5 rounded">
            {item.shortcut}
          </kbd>
        )}
      </Link>

      {/* Collapsed Tooltip */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm
                      rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none
                      transition-opacity whitespace-nowrap z-50">
          {item.label}
          {item.shortcut && (
            <span className="ml-2 text-xs text-gray-400">({item.shortcut})</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EnterpriseSidebar;
