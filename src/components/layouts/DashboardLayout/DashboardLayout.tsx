// Dashboard Layout with collapsible sidebar and command palette

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, 
  X, 
  Search, 
  Command,
  ChevronDown,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Cog,
  Sun,
  Moon,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  disabled?: boolean;
}

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  action: () => void;
  category?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  user?: UserProfile;
  commands?: CommandItem[];
  title?: string;
  showBreadcrumbs?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
  showCommandPalette?: boolean;
  onThemeToggle?: () => void;
  theme?: 'light' | 'dark';
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
  className?: string;
  'data-testid'?: string;
}

const defaultCommands: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Go to Dashboard',
    description: 'Navigate to main dashboard',
    icon: Home,
    shortcut: ['g', 'd'],
    action: () => console.log('Navigate to dashboard'),
    category: 'Navigation'
  },
  {
    id: 'analytics',
    title: 'Open Analytics',
    description: 'View detailed analytics',
    icon: BarChart3,
    shortcut: ['g', 'a'],
    action: () => console.log('Open analytics'),
    category: 'Navigation'
  },
  {
    id: 'settings',
    title: 'Open Settings',
    description: 'Access application settings',
    icon: Settings,
    shortcut: ['g', 's'],
    action: () => console.log('Open settings'),
    category: 'Navigation'
  }
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation,
  user,
  commands = defaultCommands,
  title,
  showBreadcrumbs = true,
  breadcrumbs = [],
  sidebarCollapsed = false,
  onSidebarToggle,
  showCommandPalette = true,
  onThemeToggle,
  theme = 'light',
  showNotifications = true,
  notificationCount = 0,
  onNotificationClick,
  fullscreen = false,
  onFullscreenToggle,
  className,
  'data-testid': testId
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(sidebarCollapsed);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    onSidebarToggle?.(newCollapsed);
  }, [isSidebarCollapsed, onSidebarToggle]);

  // Filter commands based on query
  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(commandQuery.toLowerCase()) ||
    command.description?.toLowerCase().includes(commandQuery.toLowerCase()) ||
    command.category?.toLowerCase().includes(commandQuery.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    const category = command.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Command palette navigation
      if (isCommandPaletteOpen) {
        if (e.key === 'Escape') {
          setIsCommandPaletteOpen(false);
          setCommandQuery('');
          setSelectedCommandIndex(0);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCommandIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCommandIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedCommand = filteredCommands[selectedCommandIndex];
          if (selectedCommand) {
            selectedCommand.action();
            setIsCommandPaletteOpen(false);
            setCommandQuery('');
            setSelectedCommandIndex(0);
          }
        }
        return;
      }

      // Global shortcuts
      commands.forEach(command => {
        if (command.shortcut) {
          const isMatch = command.shortcut.every((key, index) => {
            if (index === 0 && key === 'g') {
              return e.key === 'g';
            }
            // For sequential shortcuts, we'd need more complex logic
            return false;
          });
          
          if (isMatch) {
            e.preventDefault();
            command.action();
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedCommandIndex, commands]);

  // Close command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(event.target as Node)) {
        setIsCommandPaletteOpen(false);
      }
    };

    if (isCommandPaletteOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCommandPaletteOpen]);

  // Render navigation item
  const renderNavItem = (item: NavigationItem, level: number = 0) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <button
          type="button"
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            } else {
              item.onClick?.();
            }
          }}
          disabled={item.disabled}
          className={cn(
            'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            item.isActive && 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
            item.disabled && 'opacity-50 cursor-not-allowed',
            level > 0 && 'ml-4'
          )}
          data-testid={`${testId}-nav-${item.id}`}
        >
          {item.icon && (
            <item.icon className={cn(
              'flex-shrink-0',
              isSidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'
            )} />
          )}
          
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              
              {item.badge && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {item.badge}
                </span>
              )}
              
              {hasChildren && (
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )} />
              )}
            </>
          )}
        </button>
        
        {hasChildren && isExpanded && !isSidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarWidth = isSidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div 
      className={cn(
        'flex h-screen bg-gray-50 dark:bg-gray-900',
        fullscreen && 'fixed inset-0 z-50',
        className
      )}
      data-testid={testId}
    >
      {/* Sidebar */}
      <div className={cn(
        'hidden md:flex md:flex-shrink-0',
        sidebarWidth,
        'transition-all duration-300'
      )}>
        <div className="flex flex-col w-full">
          {/* Sidebar Header */}
          <div className="flex items-center h-16 px-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSidebarToggle}
                className="h-8 w-8"
                data-testid={`${testId}-sidebar-toggle`}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {!isSidebarCollapsed && (
                <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title || 'Dashboard'}
                </h1>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {navigation.map(item => renderNavItem(item))}
          </nav>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                
                {!isSidebarCollapsed && (
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            {/* Mobile navigation content would go here */}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden h-8 w-8 mr-2"
              >
                <Menu className="h-4 w-4" />
              </Button>

              {/* Breadcrumbs */}
              {showBreadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && (
                          <span className="mx-2 text-gray-400">/</span>
                        )}
                        <span className={cn(
                          'text-sm',
                          index === breadcrumbs.length - 1 
                            ? 'text-gray-900 dark:text-gray-100 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        )}>
                          {crumb.label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Command palette trigger */}
              {showCommandPalette && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden sm:flex items-center space-x-2"
                  data-testid={`${testId}-command-palette-trigger`}
                >
                  <Search className="h-4 w-4" />
                  <span className="text-xs">Search</span>
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
              )}

              {/* Theme toggle */}
              {onThemeToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onThemeToggle}
                  className="h-8 w-8"
                  data-testid={`${testId}-theme-toggle`}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Notifications */}
              {showNotifications && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNotificationClick}
                  className="h-8 w-8 relative"
                  data-testid={`${testId}-notifications`}
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Fullscreen toggle */}
              {onFullscreenToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFullscreenToggle}
                  className="h-8 w-8"
                  data-testid={`${testId}-fullscreen-toggle`}
                >
                  {fullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-16 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div
              ref={commandPaletteRef}
              className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg"
            >
              {/* Search Input */}
              <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <Input
                  leftIcon={<Command className="h-4 w-4" />}
                  placeholder="Search for commands..."
                  value={commandQuery}
                  onChange={setCommandQuery}
                  className="w-full"
                  data-testid={`${testId}-command-search`}
                  autoFocus
                />
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto py-2">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="px-2">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {category}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      return (
                        <button
                          key={command.id}
                          type="button"
                          onClick={() => {
                            command.action();
                            setIsCommandPaletteOpen(false);
                            setCommandQuery('');
                            setSelectedCommandIndex(0);
                          }}
                          className={cn(
                            'flex items-center w-full px-3 py-2 text-sm rounded-md',
                            'hover:bg-gray-100 dark:hover:bg-gray-700',
                            globalIndex === selectedCommandIndex && 'bg-blue-100 dark:bg-blue-900'
                          )}
                          data-testid={`${testId}-command-${command.id}`}
                        >
                          {command.icon && (
                            <command.icon className="h-4 w-4 mr-3 text-gray-400" />
                          )}
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {command.title}
                            </div>
                            {command.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className="flex space-x-1">
                              {command.shortcut.map((key, keyIndex) => (
                                <kbd
                                  key={keyIndex}
                                  className="inline-flex items-center px-1.5 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                
                {filteredCommands.length === 0 && (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No commands found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DashboardLayout };
export type { 
  DashboardLayoutProps, 
  NavigationItem, 
  CommandItem, 
  UserProfile 
};