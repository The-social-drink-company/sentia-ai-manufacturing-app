import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowRightIcon,
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  CogIcon,
  DocumentArrowDownIcon,
  GlobeAmericasIcon,
  CommandLineIcon,
  XMarkIcon,
  KeyboardIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'export' | 'market' | 'system' | 'recent';
  icon: React.ReactNode;
  action: () => void | Promise<void>;
  keywords: string[];
  shortcut?: string;
  url?: string;
  disabled?: boolean;
}

interface RecentAction {
  id: string;
  title: string;
  timestamp: string;
  url: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_ACTIONS_KEY = 'sentia-recent-actions';
const MAX_RECENT_ACTIONS = 10;

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load recent actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_ACTIONS_KEY);
    if (saved) {
      try {
        setRecentActions(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent actions:', error);
      }
    }
  }, []);

  // Save recent action
  const saveRecentAction = useCallback((action: Omit<RecentAction, 'timestamp'>) => {
    const newAction: RecentAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };
    
    setRecentActions(prev => {
      const filtered = prev.filter(a => a.id !== action.id);
      const updated = [newAction, ...filtered].slice(0, MAX_RECENT_ACTIONS);
      localStorage.setItem(RECENT_ACTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Navigation helper
  const navigateToPage = useCallback((path: string, title: string) => {
    navigate(path);
    saveRecentAction({ id: path, title, url: path });
    onClose();
  }, [navigate, saveRecentAction, onClose]);

  // Export helper
  const exportData = useCallback(async (type: string, title: string) => {
    try {
      const response = await fetch(`/api/export/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentia-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      saveRecentAction({ id: `export-${type}`, title, url: '#' });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      // Could add toast notification here
    }
  }, [saveRecentAction, onClose]);

  // Market switch helper
  const switchMarket = useCallback(async (market: string) => {
    try {
      // Update market selection in your state management
      // This would integrate with your Zustand store
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      saveRecentAction({ 
        id: `market-${market}`, 
        title: `Switch to ${market}`, 
        url: `#market=${market}` 
      });
      onClose();
    } catch (error) {
      console.error('Market switch failed:', error);
    }
  }, [queryClient, saveRecentAction, onClose]);

  // Define all available actions
  const allActions = useMemo((): QuickAction[] => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Go to main dashboard',
      category: 'navigation',
      icon: <HomeIcon className="h-4 w-4" />,
      action: () => navigateToPage('/dashboard', 'Dashboard'),
      keywords: ['dashboard', 'home', 'main'],
      shortcut: 'g d',
    },
    {
      id: 'nav-working-capital',
      title: 'Working Capital',
      description: 'View working capital management',
      category: 'navigation',
      icon: <ChartBarIcon className="h-4 w-4" />,
      action: () => navigateToPage('/working-capital', 'Working Capital'),
      keywords: ['working', 'capital', 'finance', 'cash', 'flow'],
      shortcut: 'g w',
    },
    {
      id: 'nav-inventory',
      title: 'Inventory Management',
      description: 'Manage inventory and stock levels',
      category: 'navigation',
      icon: <CubeIcon className="h-4 w-4" />,
      action: () => navigateToPage('/inventory', 'Inventory'),
      keywords: ['inventory', 'stock', 'warehouse', 'products'],
      shortcut: 'g i',
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      category: 'navigation',
      icon: <ChartBarIcon className="h-4 w-4" />,
      action: () => navigateToPage('/analytics', 'Analytics'),
      keywords: ['analytics', 'reports', 'charts', 'insights'],
      shortcut: 'g a',
    },
    {
      id: 'nav-admin',
      title: 'Admin Panel',
      description: 'System administration',
      category: 'navigation',
      icon: <UserGroupIcon className="h-4 w-4" />,
      action: () => navigateToPage('/admin', 'Admin Panel'),
      keywords: ['admin', 'settings', 'users', 'system'],
      shortcut: 'g s',
    },

    // Exports
    {
      id: 'export-dashboard',
      title: 'Export Dashboard Data',
      description: 'Download current dashboard data as Excel',
      category: 'export',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      action: () => exportData('dashboard', 'Export Dashboard Data'),
      keywords: ['export', 'download', 'excel', 'dashboard', 'data'],
    },
    {
      id: 'export-inventory',
      title: 'Export Inventory Report',
      description: 'Download inventory levels and movements',
      category: 'export',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      action: () => exportData('inventory', 'Export Inventory Report'),
      keywords: ['export', 'inventory', 'stock', 'report'],
    },
    {
      id: 'export-financial',
      title: 'Export Financial Summary',
      description: 'Download working capital and financial metrics',
      category: 'export',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      action: () => exportData('financial', 'Export Financial Summary'),
      keywords: ['export', 'financial', 'working', 'capital', 'cash'],
    },
    {
      id: 'export-orders',
      title: 'Export Orders Data',
      description: 'Download orders and sales data',
      category: 'export',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      action: () => exportData('orders', 'Export Orders Data'),
      keywords: ['export', 'orders', 'sales', 'customers'],
    },

    // Market Switching
    {
      id: 'market-us',
      title: 'Switch to US Market',
      description: 'View US market data',
      category: 'market',
      icon: <GlobeAmericasIcon className="h-4 w-4" />,
      action: () => switchMarket('US'),
      keywords: ['market', 'us', 'america', 'switch'],
    },
    {
      id: 'market-uk',
      title: 'Switch to UK Market',
      description: 'View UK market data',
      category: 'market',
      icon: <GlobeAmericasIcon className="h-4 w-4" />,
      action: () => switchMarket('UK'),
      keywords: ['market', 'uk', 'britain', 'switch'],
    },
    {
      id: 'market-de',
      title: 'Switch to Germany Market',
      description: 'View German market data',
      category: 'market',
      icon: <GlobeAmericasIcon className="h-4 w-4" />,
      action: () => switchMarket('DE'),
      keywords: ['market', 'germany', 'de', 'switch'],
    },
    {
      id: 'market-au',
      title: 'Switch to Australia Market',
      description: 'View Australian market data',
      category: 'market',
      icon: <GlobeAmericasIcon className="h-4 w-4" />,
      action: () => switchMarket('AU'),
      keywords: ['market', 'australia', 'au', 'switch'],
    },

    // System Actions
    {
      id: 'refresh-data',
      title: 'Refresh All Data',
      description: 'Force refresh all dashboard data',
      category: 'system',
      icon: <SparklesIcon className="h-4 w-4" />,
      action: () => {
        queryClient.invalidateQueries();
        saveRecentAction({ id: 'refresh-data', title: 'Refresh All Data', url: '#' });
        onClose();
      },
      keywords: ['refresh', 'reload', 'update', 'sync'],
      shortcut: 'cmd r',
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      category: 'system',
      icon: <CogIcon className="h-4 w-4" />,
      action: () => {
        // This would integrate with your theme system
        document.documentElement.classList.toggle('dark');
        saveRecentAction({ id: 'toggle-theme', title: 'Toggle Dark Mode', url: '#' });
        onClose();
      },
      keywords: ['theme', 'dark', 'light', 'mode'],
      shortcut: 'cmd shift t',
    },
  ], [navigateToPage, exportData, switchMarket, queryClient, saveRecentAction, onClose]);

  // Add recent actions to the actions list
  const actionsWithRecent = useMemo(() => {
    const recentActionsConverted: QuickAction[] = recentActions.map(recent => ({
      id: recent.id,
      title: recent.title,
      description: `Recent action from ${new Date(recent.timestamp).toLocaleDateString()}`,
      category: 'recent' as const,
      icon: <ClockIcon className="h-4 w-4" />,
      action: () => {
        if (recent.url.startsWith('/')) {
          navigate(recent.url);
        }
        onClose();
      },
      keywords: [recent.title.toLowerCase()],
    }));

    return [...recentActionsConverted, ...allActions];
  }, [recentActions, allActions, navigate, onClose]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      return actionsWithRecent.slice(0, 20); // Show recent + top actions when no query
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    return actionsWithRecent.filter(action => {
      const matchesTitle = action.title.toLowerCase().includes(normalizedQuery);
      const matchesDescription = action.description.toLowerCase().includes(normalizedQuery);
      const matchesKeywords = action.keywords.some(keyword => 
        keyword.toLowerCase().includes(normalizedQuery)
      );
      
      return matchesTitle || matchesDescription || matchesKeywords;
    }).slice(0, 10); // Limit to 10 results
  }, [query, actionsWithRecent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredActions.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            setShowShortcuts(!showShortcuts);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose, showShortcuts]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setShowShortcuts(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-lg transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
          {/* Header */}
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              className="h-12 w-full border-0 bg-transparent pl-11 pr-16 text-gray-800 placeholder-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Search for actions, pages, or data exports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-2 top-2 flex items-center gap-2">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Show keyboard shortcuts"
              >
                <KeyboardIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          {!showShortcuts ? (
            <div ref={listRef} className="max-h-96 scroll-py-3 overflow-y-auto p-3">
              {filteredActions.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm sm:px-14">
                  <CommandLineIcon className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-4 font-semibold text-gray-900">No actions found</p>
                  <p className="mt-2 text-gray-500">
                    Try searching for pages, exports, or system actions.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-1">
                  {Object.entries(
                    filteredActions.reduce((groups, action) => {
                      const category = action.category;
                      if (!groups[category]) groups[category] = [];
                      groups[category].push(action);
                      return groups;
                    }, {} as Record<string, QuickAction[]>)
                  ).map(([category, actions], categoryIndex) => (
                    <div key={category}>
                      {filteredActions.length > 5 && (
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {category === 'recent' ? 'Recent' : 
                           category === 'navigation' ? 'Navigation' :
                           category === 'export' ? 'Export Data' :
                           category === 'market' ? 'Switch Market' :
                           category === 'system' ? 'System' : category}
                        </div>
                      )}
                      {actions.map((action, actionIndex) => {
                        const globalIndex = filteredActions.indexOf(action);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <button
                            key={action.id}
                            className={`group flex w-full items-center rounded-lg px-4 py-3 text-left transition-colors ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-900 hover:bg-gray-100'
                            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !action.disabled && action.action()}
                            disabled={action.disabled}
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                              isSelected 
                                ? 'bg-blue-700 text-white' 
                                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                            }`}>
                              {action.icon}
                            </div>
                            
                            <div className="ml-4 flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {action.title}
                              </div>
                              <div className={`text-sm truncate ${
                                isSelected ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {action.description}
                              </div>
                            </div>
                            
                            <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                              {action.shortcut && (
                                <kbd className={`px-2 py-1 text-xs rounded-md ${
                                  isSelected 
                                    ? 'bg-blue-700 text-blue-100' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {action.shortcut}
                                </kbd>
                              )}
                              <ArrowRightIcon className={`h-4 w-4 ${
                                isSelected ? 'text-blue-100' : 'text-gray-400'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+K</kbd>
                    <span className="ml-2 text-gray-600">Open command palette</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                    <span className="ml-2 text-gray-600">Close palette</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd>
                    <span className="ml-2 text-gray-600">Navigate options</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                    <span className="ml-2 text-gray-600">Execute action</span>
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Navigation</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">g d</kbd> Dashboard</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">g w</kbd> Working Capital</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">g i</kbd> Inventory</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">g a</kbd> Analytics</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center bg-gray-50 px-4 py-2.5 text-xs text-gray-700">
            <span>
              Type to search, use <kbd className="mx-1 px-1.5 py-0.5 bg-white border rounded">↑</kbd>
              <kbd className="mx-1 px-1.5 py-0.5 bg-white border rounded">↓</kbd> to navigate,
              <kbd className="mx-1 px-1.5 py-0.5 bg-white border rounded">Enter</kbd> to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}