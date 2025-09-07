import { devLog } from '../lib/devLog.js';\nimport React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronRightIcon,
  HomeIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { useAuthRole } from '../../hooks/useAuthRole';
import { useLayoutStore } from '../../stores/layoutStore';
import { cn } from '../../lib/utils';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import SearchModal from './SearchModal';

// Breadcrumb navigation mapping
const breadcrumbMap = {
  '/': { label: 'Home', icon: HomeIcon },
  '/dashboard': { label: 'Dashboard', icon: HomeIcon },
  '/production': { label: 'Production Tracking', parent: '/dashboard' },
  '/quality': { label: 'Quality Control', parent: '/dashboard' },
  '/inventory': { label: 'Inventory Management', parent: '/dashboard' },
  '/forecasting': { label: 'Demand Forecasting', parent: '/dashboard' },
  '/ai-analytics': { label: 'AI Analytics', parent: '/dashboard' },
  '/working-capital': { label: 'Working Capital', parent: '/dashboard' },
  '/what-if': { label: 'What-If Analysis', parent: '/dashboard' },
  '/data-import': { label: 'Data Import', parent: '/dashboard' },
  '/admin': { label: 'Admin Panel', parent: '/dashboard' },
  '/settings': { label: 'System Configuration', parent: '/admin' }
};

const EnterpriseLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, hasPermission } = useAuthRole();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Generate breadcrumb path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/dashboard', icon: HomeIcon }];
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const breadcrumbInfo = breadcrumbMap[currentPath];
      
      if (breadcrumbInfo) {
        breadcrumbs.push({
          label: breadcrumbInfo.label,
          path: currentPath,
          icon: breadcrumbInfo.icon
        });
      } else {
        // Fallback: convert segment to readable label
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        breadcrumbs.push({
          label,
          path: currentPath
        });
      }
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  // Keyboard shortcuts
  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    setSearchOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+shift+p', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+/', () => {
    // Show keyboard shortcuts help
    devLog.log('Keyboard shortcuts help');
  }, { enableOnFormTags: false });

  // Get page title and description
  const getPageInfo = () => {
    const pageMap = {
      '/dashboard': {
        title: 'Manufacturing Dashboard',
        description: 'Overview of your manufacturing operations and key metrics'
      },
      '/production': {
        title: 'Production Tracking',
        description: 'Real-time production monitoring and line control'
      },
      '/quality': {
        title: 'Quality Control',
        description: 'Quality assurance and test management'
      },
      '/inventory': {
        title: 'Inventory Management',
        description: 'Stock levels, movements, and forecasting'
      },
      '/forecasting': {
        title: 'Demand Forecasting',
        description: 'AI-powered demand predictions and planning'
      },
      '/ai-analytics': {
        title: 'AI Analytics',
        description: 'Advanced analytics and machine learning insights'
      },
      '/working-capital': {
        title: 'Working Capital',
        description: 'Financial management and cash flow analysis'
      },
      '/what-if': {
        title: 'What-If Analysis',
        description: 'Interactive scenario modeling for working capital optimization'
      },
      '/data-import': {
        title: 'Data Import',
        description: 'Import and synchronize data from external systems'
      }
    };

    return pageMap[location.pathname] || {
      title: currentPage?.label || 'Dashboard',
      description: 'Manufacturing Intelligence Platform'
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "relative z-30 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Breadcrumbs */}
            <div className="flex items-center space-x-4 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 min-w-0">
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.path} className="flex items-center">
                    {index > 0 && (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
                    )}
                    <button
                      onClick={() => navigate(breadcrumb.path)}
                      className={cn(
                        "flex items-center space-x-1 text-sm font-medium rounded-md px-2 py-1 transition-colors",
                        index === breadcrumbs.length - 1
                          ? "text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      {breadcrumb.icon && (
                        <breadcrumb.icon className="h-4 w-4" />
                      )}
                      <span className="truncate max-w-32">{breadcrumb.label}</span>
                    </button>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="hidden md:inline">Search</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Command Palette */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Command Palette (Ctrl+Shift+P)"
              >
                <CommandLineIcon className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User role indicator */}
              {role && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="capitalize">{role}</span>
                </div>
              )}

              {/* User Button */}
              <button 
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pageInfo.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {pageInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Modals */}
      {searchOpen && (
        <SearchModal 
          isOpen={searchOpen} 
          onClose={() => setSearchOpen(false)}
        />
      )}
      
      {notificationsOpen && (
        <NotificationCenter
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs space-y-1 opacity-0 hover:opacity-100 transition-opacity">
          <div>⌘K - Search</div>
          <div>Ctrl+B - Toggle Sidebar</div>
          <div>Ctrl+Shift+P - Command Palette</div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLayout;