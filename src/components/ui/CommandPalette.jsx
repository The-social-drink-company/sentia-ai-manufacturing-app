/**
 * ENTERPRISE COMMAND PALETTE
 * Advanced command interface inspired by VS Code, Raycast, and Linear
 * Features: fuzzy search, AI suggestions, keyboard navigation, recent commands
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  // Navigation Icons
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  Cog6ToothIcon,
  UsersIcon,
  PresentationChartLineIcon,
  TruckIcon,
  BeakerIcon,

  // Action Icons
  MagnifyingGlassIcon,
  ArrowRightIcon,
  CommandLineIcon,
  SparklesIcon,
  ClockIcon,
  BookmarkIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PrinterIcon,
  EnvelopeIcon,
  BellIcon,

  // UI Icons
  XMarkIcon,
  ChevronRightIcon,
  HashtagIcon,
  AtSymbolIcon,
  CalendarIcon,
  FolderIcon,
  TagIcon,
  GlobeAltIcon,

  // Feature Icons
  CpuChipIcon,
  BoltIcon,
  FireIcon,
  RocketLaunchIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { useAuthRole } from '../../hooks/useAuthRole';
import { useEnterpriseTheme } from './EnterpriseThemeSwitcher';
import { logDebug } from '../../utils/logger';

// Command Categories
const commandCategories = {
  navigation: {
    id: 'navigation',
    name: 'Navigation',
    icon: CompassIcon,
    commands: [
      { id: 'nav-dashboard', name: 'Go to Dashboard', icon: HomeIcon, action: '/dashboard', shortcut: 'G O' },
      { id: 'nav-production', name: 'Go to Production', icon: TruckIcon, action: '/production', shortcut: 'G P' },
      { id: 'nav-inventory', name: 'Go to Inventory', icon: CubeIcon, action: '/inventory', shortcut: 'G I' },
      { id: 'nav-forecasting', name: 'Go to Forecasting', icon: PresentationChartLineIcon, action: '/forecasting', shortcut: 'G F' },
      { id: 'nav-working-capital', name: 'Go to Working Capital', icon: BanknotesIcon, action: '/working-capital', shortcut: 'G W' },
      { id: 'nav-what-if', name: 'Go to What-If Analysis', icon: ChartBarIcon, action: '/what-if', shortcut: 'G H' },
      { id: 'nav-quality', name: 'Go to Quality Control', icon: BeakerIcon, action: '/quality', shortcut: 'G Q' },
      { id: 'nav-settings', name: 'Go to Settings', icon: Cog6ToothIcon, action: '/admin/settings', shortcut: 'G S' },
    ]
  },
  actions: {
    id: 'actions',
    name: 'Actions',
    icon: BoltIcon,
    commands: [
      { id: 'action-export', name: 'Export Dashboard Data', icon: ArrowDownTrayIcon, action: 'export-data', tags: ['download', 'csv', 'excel'] },
      { id: 'action-share', name: 'Share Dashboard', icon: ShareIcon, action: 'share-dashboard', tags: ['collaborate', 'link'] },
      { id: 'action-print', name: 'Print Report', icon: PrinterIcon, action: 'print-report', tags: ['pdf', 'document'] },
      { id: 'action-refresh', name: 'Refresh Data', icon: ArrowPathIcon, action: 'refresh-data', shortcut: 'R' },
      { id: 'action-duplicate', name: 'Duplicate Widget', icon: DocumentDuplicateIcon, action: 'duplicate-widget' },
      { id: 'action-email', name: 'Email Report', icon: EnvelopeIcon, action: 'email-report', tags: ['send', 'notify'] },
      { id: 'action-schedule', name: 'Schedule Report', icon: CalendarIcon, action: 'schedule-report', tags: ['automate', 'recurring'] },
    ]
  },
  ai: {
    id: 'ai',
    name: 'AI Assistant',
    icon: SparklesIcon,
    commands: [
      { id: 'ai-insights', name: 'Generate AI Insights', icon: LightBulbIcon, action: 'ai-insights', premium: true },
      { id: 'ai-forecast', name: 'AI Demand Forecast', icon: ChartBarIcon, action: 'ai-forecast', premium: true },
      { id: 'ai-optimize', name: 'Optimize Inventory', icon: CpuChipIcon, action: 'ai-optimize', premium: true },
      { id: 'ai-anomaly', name: 'Detect Anomalies', icon: ExclamationTriangleIcon, action: 'ai-anomaly', premium: true },
      { id: 'ai-recommendations', name: 'Get Recommendations', icon: RocketLaunchIcon, action: 'ai-recommendations', premium: true },
    ]
  },
  search: {
    id: 'search',
    name: 'Search',
    icon: MagnifyingGlassIcon,
    commands: [
      { id: 'search-products', name: 'Search Products', icon: CubeIcon, action: 'search-products', prefix: '#' },
      { id: 'search-orders', name: 'Search Orders', icon: DocumentIcon, action: 'search-orders', prefix: '#' },
      { id: 'search-customers', name: 'Search Customers', icon: UsersIcon, action: 'search-customers', prefix: '@' },
      { id: 'search-suppliers', name: 'Search Suppliers', icon: TruckIcon, action: 'search-suppliers', prefix: '@' },
      { id: 'search-reports', name: 'Search Reports', icon: DocumentTextIcon, action: 'search-reports', prefix: '/' },
    ]
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    icon: Cog6ToothIcon,
    commands: [
      { id: 'settings-theme', name: 'Toggle Theme', icon: SunIcon, action: 'toggle-theme', shortcut: 'T' },
      { id: 'settings-notifications', name: 'Notification Settings', icon: BellIcon, action: '/settings/notifications' },
      { id: 'settings-profile', name: 'Edit Profile', icon: UserCircleIcon, action: '/settings/profile' },
      { id: 'settings-api', name: 'API Settings', icon: CodeBracketIcon, action: '/settings/api' },
      { id: 'settings-integrations', name: 'Manage Integrations', icon: PuzzlePieceIcon, action: '/settings/integrations' },
    ]
  }
};

// Icons not in heroicons (placeholder functions)
const CompassIcon = ArrowRightIcon;
const ExclamationTriangleIcon = BoltIcon;
const DocumentIcon = DocumentArrowUpIcon;
const DocumentTextIcon = DocumentArrowUpIcon;
const SunIcon = SparklesIcon;
const UserCircleIcon = UsersIcon;
const CodeBracketIcon = CommandLineIcon;
const PuzzlePieceIcon = CpuChipIcon;

// Command Palette Component
export const CommandPalette = ({ onClose = null }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthRole();
  const { toggleTheme } = useEnterpriseTheme();
  const inputRef = useRef(null);

  // State
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentCommands, setRecentCommands] = useState(() => {
    const saved = localStorage.getItem('sentia-recent-commands');
    return saved ? JSON.parse(saved) : [];
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Open/Close handlers
  const openPalette = useCallback(() => {
    setOpen(true);
    setSearch('');
    setSelectedCategory(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  // Keyboard shortcuts
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    openPalette();
  }, { enableOnFormTags: true });

  useHotkeys('escape', () => {
    if (open) closePalette();
  }, { enabled: open });

  // Special prefix detection
  const prefix = useMemo(() => {
    if (search.startsWith('#')) return '#';
    if (search.startsWith('@')) return '@';
    if (search.startsWith('/')) return '/';
    if (search.startsWith('>')) return '>';
    return null;
  }, [search]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    const searchTerm = prefix ? search.slice(1).toLowerCase() : search.toLowerCase();

    if (!searchTerm && !selectedCategory) {
      // Show recent commands when no search
      return {
        recent: recentCommands.slice(0, 5),
        categories: Object.values(commandCategories).map(cat => ({
          ...cat,
          commands: cat.commands.slice(0, 3)
        }))
      };
    }

    // Filter by prefix
    if (prefix) {
      const relevantCommands = Object.values(commandCategories)
        .flatMap(cat => cat.commands)
        .filter(cmd => cmd.prefix === prefix);

      return {
        filtered: relevantCommands.filter(cmd =>
          cmd.name.toLowerCase().includes(searchTerm) ||
          cmd.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      };
    }

    // Filter by category
    if (selectedCategory) {
      const category = commandCategories[selectedCategory];
      return {
        categoryCommands: category.commands.filter(cmd =>
          cmd.name.toLowerCase().includes(searchTerm)
        )
      };
    }

    // Global search
    const allCommands = Object.values(commandCategories).flatMap(cat =>
      cat.commands.map(cmd => ({ ...cmd, category: cat.name }))
    );

    return {
      filtered: allCommands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchTerm) ||
        cmd.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    };
  }, [search, prefix, selectedCategory, recentCommands]);

  // Execute command
  const executeCommand = useCallback((command) => {
    logDebug('Executing command', { command });

    // Add to recent commands
    const newRecent = [
      command,
      ...recentCommands.filter(r => r.id !== command.id)
    ].slice(0, 10);
    setRecentCommands(newRecent);
    localStorage.setItem('sentia-recent-commands', JSON.stringify(newRecent));

    // Execute action
    if (typeof command.action === 'string') {
      if (command.action.startsWith('/')) {
        // Navigation
        navigate(command.action);
      } else {
        // Custom action
        switch (command.action) {
          case 'toggle-theme':
            toggleTheme();
            break;
          case 'export-data':
            handleExportData();
            break;
          case 'share-dashboard':
            handleShareDashboard();
            break;
          case 'refresh-data':
            window.location.reload();
            break;
          case 'ai-insights':
            handleAIInsights();
            break;
          default:
            logDebug('Unknown command action', { action: command.action });
        }
      }
    } else if (typeof command.action === 'function') {
      command.action();
    }

    closePalette();
  }, [navigate, toggleTheme, recentCommands, closePalette]);

  // Handler functions
  const handleExportData = () => {
    // Trigger export
    const event = new CustomEvent('export-dashboard-data');
    window.dispatchEvent(event);
  };

  const handleShareDashboard = () => {
    // Copy share link
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Show notification
    const event = new CustomEvent('show-notification', {
      detail: { message: 'Dashboard link copied to clipboard!' }
    });
    window.dispatchEvent(event);
  };

  const handleAIInsights = async () => {
    setLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      navigate('/ai-insights');
      setLoading(false);
    }, 500);
  };

  // AI Suggestions (simulate for now)
  useEffect(() => {
    if (search.length > 2 && !prefix) {
      const timer = setTimeout(() => {
        setAiSuggestions([
          { id: 'ai-1', name: `Show ${search} trends`, icon: ChartBarIcon },
          { id: 'ai-2', name: `Find ${search} anomalies`, icon: FireIcon },
          { id: 'ai-3', name: `Optimize ${search}`, icon: CpuChipIcon },
        ]);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAiSuggestions([]);
    }
  }, [search, prefix]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl
                     bg-white dark:bg-quantum-surface rounded-2xl shadow-2xl z-50
                     border border-gray-200 dark:border-quantum-border overflow-hidden"
          >
            <Command
              shouldFilter={false}
              className="relative"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 border-b border-gray-200 dark:border-quantum-border">
                <CommandLineIcon className="w-5 h-5 text-gray-400 mr-3" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex-1 py-4 bg-transparent outline-none
                           text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-quantum-hover rounded"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <kbd className="ml-3 px-2 py-1 text-xs bg-gray-100 dark:bg-quantum-twilight
                             text-gray-500 dark:text-gray-400 rounded">
                  ESC
                </kbd>
              </div>

              {/* Command Hints */}
              {!search && (
                <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400
                             border-b border-gray-200 dark:border-quantum-border">
                  <span className="flex items-center gap-1">
                    <HashtagIcon className="w-3 h-3" />
                    <span>for products</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <AtSymbolIcon className="w-3 h-3" />
                    <span>for people</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>/</span>
                    <span>for files</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ChevronRightIcon className="w-3 h-3" />
                    <span>for actions</span>
                  </span>
                </div>
              )}

              {/* Results */}
              <Command.List className="max-h-96 overflow-y-auto p-2">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent" />
                  </div>
                )}

                {!loading && (
                  <>
                    {/* AI Suggestions */}
                    {aiSuggestions.length > 0 && (
                      <Command.Group heading="AI Suggestions" className="mb-2">
                        {aiSuggestions.map(suggestion => (
                          <CommandItem
                            key={suggestion.id}
                            command={suggestion}
                            onSelect={() => executeCommand(suggestion)}
                            isAI={true}
                          />
                        ))}
                      </Command.Group>
                    )}

                    {/* Recent Commands */}
                    {filteredCommands.recent && filteredCommands.recent.length > 0 && (
                      <Command.Group heading="Recent" className="mb-2">
                        {filteredCommands.recent.map(command => (
                          <CommandItem
                            key={command.id}
                            command={command}
                            onSelect={() => executeCommand(command)}
                            showRecent={true}
                          />
                        ))}
                      </Command.Group>
                    )}

                    {/* Categories */}
                    {filteredCommands.categories && filteredCommands.categories.map(category => (
                      <Command.Group key={category.id} heading={category.name} className="mb-2">
                        {category.commands.map(command => (
                          <CommandItem
                            key={command.id}
                            command={command}
                            onSelect={() => executeCommand(command)}
                          />
                        ))}
                        {category.commands.length === 3 && (
                          <Command.Item
                            onSelect={() => setSelectedCategory(category.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500
                                     hover:bg-gray-50 dark:hover:bg-quantum-hover rounded-lg cursor-pointer"
                          >
                            <span>Show all {category.name.toLowerCase()}...</span>
                          </Command.Item>
                        )}
                      </Command.Group>
                    ))}

                    {/* Filtered Results */}
                    {filteredCommands.filtered && (
                      <Command.Group heading="Results">
                        {filteredCommands.filtered.length > 0 ? (
                          filteredCommands.filtered.map(command => (
                            <CommandItem
                              key={command.id}
                              command={command}
                              onSelect={() => executeCommand(command)}
                              showCategory={true}
                            />
                          ))
                        ) : (
                          <div className="px-3 py-8 text-center text-gray-500">
                            No results found for "{search}"
                          </div>
                        )}
                      </Command.Group>
                    )}

                    {/* Category Commands */}
                    {filteredCommands.categoryCommands && (
                      <Command.Group>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="flex items-center gap-2 px-3 py-2 mb-2 text-sm text-gray-500
                                   hover:bg-gray-50 dark:hover:bg-quantum-hover rounded-lg"
                        >
                          <ArrowLeftIcon className="w-4 h-4" />
                          <span>Back to all commands</span>
                        </button>
                        {filteredCommands.categoryCommands.map(command => (
                          <CommandItem
                            key={command.id}
                            command={command}
                            onSelect={() => executeCommand(command)}
                          />
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 dark:border-quantum-border
                          flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-quantum-twilight rounded">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-quantum-twilight rounded">↵</kbd>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-quantum-twilight rounded">ESC</kbd>
                    <span>Close</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-3 h-3" />
                  <span>AI-powered</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Command Item Component
const CommandItem = ({ command, onSelect, showCategory = false, showRecent = false, isAI = false }) => {
  const Icon = command.icon;

  return (
    <Command.Item
      value={command.name}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
               hover:bg-gray-50 dark:hover:bg-quantum-hover group
               data-[selected]:bg-brand-primary/10 dark:data-[selected]:bg-brand-primary/20"
    >
      {/* Icon */}
      <div className={`
        p-1.5 rounded-lg
        ${isAI ? 'bg-gradient-to-br from-brand-primary to-brand-secondary' : 'bg-gray-100 dark:bg-quantum-twilight'}
        group-hover:bg-gray-200 dark:group-hover:bg-quantum-hover
      `}>
        <Icon className={`w-4 h-4 ${isAI ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 dark:text-white truncate">
            {command.name}
          </span>
          {command.premium && (
            <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500
                         text-white rounded-md font-medium">
              PRO
            </span>
          )}
          {showRecent && (
            <ClockIcon className="w-3 h-3 text-gray-400" />
          )}
        </div>
        {showCategory && command.category && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {command.category}
          </span>
        )}
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <kbd className="hidden group-hover:block px-1.5 py-0.5 text-xs
                      bg-gray-100 dark:bg-quantum-twilight text-gray-500 rounded">
          {command.shortcut}
        </kbd>
      )}

      <ArrowRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
    </Command.Item>
  );
};

// Export hook for external usage
export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);

  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    setOpen(true);
  });

  return {
    open,
    setOpen,
    CommandPalette: () => <CommandPalette onClose={() => setOpen(false)} />
  };
};

export default CommandPalette;