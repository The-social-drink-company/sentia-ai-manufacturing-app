import { devLog } from '../lib/devLog.js';\nimport React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  FireIcon,
  HashtagIcon,
  DocumentIcon,
  UserIcon,
  ChartBarIcon,
  CogIcon,
  HomeIcon,
  Cog8ToothIcon,
  ShieldCheckIcon,
  CubeIcon,
  PresentationChartLineIcon,
  CpuChipIcon,
  BanknotesIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthRole();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Search data
  const searchData = [
    // Pages
    { 
      id: 'dashboard', 
      title: 'Main Dashboard', 
      description: 'Manufacturing overview and key metrics',
      url: '/dashboard', 
      icon: HomeIcon, 
      type: 'page',
      keywords: ['home', 'overview', 'main', 'dashboard', 'metrics'],
      permission: 'dashboard.view'
    },
    { 
      id: 'production', 
      title: 'Production Tracking', 
      description: 'Real-time production monitoring',
      url: '/production', 
      icon: Cog8ToothIcon, 
      type: 'page',
      keywords: ['production', 'manufacturing', 'tracking', 'lines', 'efficiency'],
      permission: 'production.view'
    },
    { 
      id: 'quality', 
      title: 'Quality Control', 
      description: 'Quality assurance and testing',
      url: '/quality', 
      icon: ShieldCheckIcon, 
      type: 'page',
      keywords: ['quality', 'control', 'testing', 'qa', 'assurance', 'defects'],
      permission: 'quality.view'
    },
    { 
      id: 'inventory', 
      title: 'Inventory Management', 
      description: 'Stock levels and movements',
      url: '/inventory', 
      icon: CubeIcon, 
      type: 'page',
      keywords: ['inventory', 'stock', 'warehouse', 'materials', 'supplies'],
      permission: 'inventory.view'
    },
    { 
      id: 'forecasting', 
      title: 'Demand Forecasting', 
      description: 'AI-powered demand predictions',
      url: '/forecasting', 
      icon: PresentationChartLineIcon, 
      type: 'page',
      keywords: ['forecast', 'demand', 'prediction', 'planning', 'ai'],
      permission: 'forecast.view'
    },
    { 
      id: 'analytics', 
      title: 'AI Analytics', 
      description: 'Advanced analytics and insights',
      url: '/ai-analytics', 
      icon: CpuChipIcon, 
      type: 'page',
      keywords: ['analytics', 'ai', 'insights', 'machine learning', 'data'],
      permission: 'analytics.view'
    },
    { 
      id: 'working-capital', 
      title: 'Working Capital', 
      description: 'Financial management',
      url: '/working-capital', 
      icon: BanknotesIcon, 
      type: 'page',
      keywords: ['finance', 'working capital', 'cash flow', 'financial'],
      permission: 'workingcapital.view'
    },
    { 
      id: 'data-import', 
      title: 'Data Import', 
      description: 'Import data from external systems',
      url: '/data-import', 
      icon: DocumentArrowUpIcon, 
      type: 'page',
      keywords: ['import', 'data', 'upload', 'sync', 'integration'],
      permission: 'import.view'
    },
    { 
      id: 'admin', 
      title: 'Admin Panel', 
      description: 'System administration',
      url: '/admin', 
      icon: UserIcon, 
      type: 'page',
      keywords: ['admin', 'administration', 'users', 'settings', 'management'],
      permission: 'users.manage'
    },

    // Actions
    { 
      id: 'export-data', 
      title: 'Export Data', 
      description: 'Export dashboard data to Excel/CSV',
      action: () => devLog.log('Export data'), 
      icon: DocumentIcon, 
      type: 'action',
      keywords: ['export', 'download', 'csv', 'excel', 'data']
    },
    { 
      id: 'refresh-dashboard', 
      title: 'Refresh Dashboard', 
      description: 'Reload all dashboard data',
      action: () => window.location.reload(), 
      icon: ClockIcon, 
      type: 'action',
      keywords: ['refresh', 'reload', 'update', 'sync']
    },
    { 
      id: 'toggle-theme', 
      title: 'Toggle Dark Mode', 
      description: 'Switch between light and dark theme',
      action: () => devLog.log('Toggle theme'), 
      icon: CogIcon, 
      type: 'action',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance']
    },

    // Recent searches (would come from localStorage)
    { 
      id: 'recent-production', 
      title: 'Production Line A', 
      description: 'Recently viewed',
      url: '/production?line=a', 
      icon: ClockIcon, 
      type: 'recent',
      keywords: ['production', 'line a', 'recent']
    },
    { 
      id: 'recent-quality', 
      title: 'Quality Reports', 
      description: 'Recently accessed',
      url: '/quality?tab=reports', 
      icon: ClockIcon, 
      type: 'recent',
      keywords: ['quality', 'reports', 'recent']
    }
  ];

  // Filter results based on query and permissions
  const filteredResults = query.length === 0 
    ? searchData.filter(item => item.type === 'recent').slice(0, 5)
    : searchData.filter(item => {
        // Check permissions
        if (item.permission && !hasPermission(item.permission)) {
          return false;
        }
        
        // Check if query matches
        const searchTerms = query.toLowerCase().split(' ');
        const searchableText = [
          item.title,
          item.description,
          ...(item.keywords || [])
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      }).slice(0, 10);

  // Handle navigation
  const handleSelect = (item) => {
    if (item.url) {
      navigate(item.url);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'page': return HashtagIcon;
      case 'action': return FireIcon;
      case 'recent': return ClockIcon;
      default: return DocumentIcon;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'page': return 'text-blue-500';
      case 'action': return 'text-green-500';
      case 'recent': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 flex items-start justify-center p-4 pt-20">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, actions, and more..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 ml-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Clear search</span>
                    âœ•
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filteredResults.length === 0 && query ? (
                  <div className="px-4 py-8 text-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No results found for "{query}"
                    </p>
                  </div>
                ) : filteredResults.length === 0 && !query ? (
                  <div className="px-4 py-8 text-center">
                    <ChartBarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Quick navigation
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Type to search pages, actions, and more
                    </p>
                  </div>
                ) : (
                  <ul className="py-2">
                    {filteredResults.map((item, index) => {
                      const Icon = item.icon;
                      const TypeIcon = getTypeIcon(item.type);
                      const isSelected = index === selectedIndex;
                      
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleSelect(item)}
                            className={cn(
                              "w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                              isSelected && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="flex-shrink-0 p-2 mr-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <TypeIcon className={cn("h-4 w-4", getTypeColor(item.type))} />
                              {isSelected && (
                                <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border">
                                  âŽ
                                </kbd>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border rounded mr-1">â†‘â†“</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center">
                      <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border rounded mr-1">âŽ</kbd>
                      Select
                    </span>
                    <span className="flex items-center">
                      <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 border rounded mr-1">ESC</kbd>
                      Close
                    </span>
                  </div>
                  <span>Search by Sentia AI</span>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SearchModal;
