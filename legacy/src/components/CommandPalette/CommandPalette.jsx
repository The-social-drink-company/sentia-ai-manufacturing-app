import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightIcon,
  CommandLineIcon,
  FolderIcon,
  DocumentTextIcon,
  UserIcon,
  CogIcon,
  LightBulbIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useNavigation } from '../../navigation';
import { useTheme } from '../../theming';
import { useHotkeys } from 'react-hotkeys-hook';

// Command categories with icons
const COMMAND_CATEGORIES = {
  pages: { label: 'Pages', icon: FolderIcon },
  actions: { label: 'Actions', icon: CommandLineIcon },
  content: { label: 'Content', icon: DocumentTextIcon },
  users: { label: 'Users', icon: UserIcon },
  settings: { label: 'Settings', icon: CogIcon },
  suggestions: { label: 'Suggestions', icon: LightBulbIcon },
  recent: { label: 'Recent', icon: ClockIcon },
  tags: { label: 'Tags', icon: TagIcon }
};

// Global command registry
const GLOBAL_COMMANDS = [
  // Navigation commands
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    subtitle: 'Main dashboard overview',
    category: 'pages',
    path: '/dashboard',
    keywords: ['dashboard', 'home', 'overview'],
    permissions: []
  },
  {
    id: 'nav-working-capital',
    title: 'Go to Working Capital',
    subtitle: 'Financial analysis and management',
    category: 'pages',
    path: '/working-capital',
    keywords: ['working capital', 'finance', 'cash flow'],
    permissions: ['workingcapital.view']
  },
  {
    id: 'nav-forecasting',
    title: 'Go to Demand Forecasting',
    subtitle: 'AI-powered demand predictions',
    category: 'pages',
    path: '/forecasting',
    keywords: ['forecasting', 'demand', 'ai', 'prediction'],
    permissions: ['forecasting.view']
  },
  {
    id: 'nav-inventory',
    title: 'Go to Inventory Management',
    subtitle: 'Stock levels and optimization',
    category: 'pages',
    path: '/inventory',
    keywords: ['inventory', 'stock', 'warehouse'],
    permissions: ['inventory.view']
  },
  {
    id: 'nav-production',
    title: 'Go to Production',
    subtitle: 'Manufacturing operations',
    category: 'pages',
    path: '/production',
    keywords: ['production', 'manufacturing', 'operations'],
    permissions: ['production.view']
  },
  {
    id: 'nav-quality',
    title: 'Go to Quality Control',
    subtitle: 'Quality management system',
    category: 'pages',
    path: '/quality',
    keywords: ['quality', 'control', 'qms'],
    permissions: ['quality.view']
  },
  {
    id: 'nav-what-if',
    title: 'Go to What-If Analysis',
    subtitle: 'Scenario planning and modeling',
    category: 'pages',
    path: '/what-if',
    keywords: ['what if', 'scenario', 'analysis'],
    permissions: ['whatif.analyze']
  },
  {
    id: 'nav-admin',
    title: 'Go to Admin Panel',
    subtitle: 'System administration',
    category: 'pages',
    path: '/admin',
    keywords: ['admin', 'administration', 'management'],
    permissions: ['admin.access']
  },
  
  // Action commands
  {
    id: 'action-export',
    title: 'Export Current Data',
    subtitle: 'Download data as JSON',
    category: 'actions',
    action: 'export',
    keywords: ['export', 'download', 'data'],
    permissions: []
  },
  {
    id: 'action-refresh',
    title: 'Refresh Page',
    subtitle: 'Reload current page',
    category: 'actions',
    action: 'refresh',
    keywords: ['refresh', 'reload', 'update'],
    permissions: []
  },
  {
    id: 'action-share',
    title: 'Share Current Page',
    subtitle: 'Copy link to clipboard',
    category: 'actions',
    action: 'share',
    keywords: ['share', 'copy', 'link'],
    permissions: []
  },
  {
    id: 'action-customize-layout',
    title: 'Customize Dashboard Layout',
    subtitle: 'Rearrange widgets and components',
    category: 'actions',
    action: 'customize-layout',
    keywords: ['layout', 'customize', 'dashboard'],
    permissions: []
  },
  
  // Settings commands
  {
    id: 'settings-theme-toggle',
    title: 'Toggle Dark/Light Theme',
    subtitle: 'Switch between dark and light themes',
    category: 'settings',
    action: 'toggle-theme',
    keywords: ['theme', 'dark', 'light', 'appearance'],
    permissions: []
  },
  {
    id: 'settings-preferences',
    title: 'User Preferences',
    subtitle: 'Personal settings and preferences',
    category: 'settings',
    path: '/preferences',
    keywords: ['preferences', 'settings', 'user'],
    permissions: []
  }
];

export const CommandPalette = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState(() => {
    const saved = localStorage.getItem('sentia-recent-commands');
    return saved ? JSON.parse(saved) : [];
  });
  
  const searchInputRef = useRef(null);
  const { navigateToPath, executeQuickAction, suggestions } = useNavigation();
  const { hasPermission } = useAuthRole();
  const { resolvedTheme, toggleTheme } = useTheme();
  
  // Hotkey to open/close command palette
  useHotkeys('cmd+k, ctrl+k', (event) => {
    event.preventDefault();
    if (isOpen) {
      onClose();
    } else {
      // Trigger open from parent
      window.dispatchEvent(new CustomEvent('sentia-open-command-palette'));
    }
  }, { enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'] });
  
  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Generate dynamic commands from suggestions and recent visits
  const dynamicCommands = useMemo(() => {
    const commands = [];
    
    // Add suggestion-based commands
    suggestions.forEach((suggestion, index) => {
      commands.push({
        id: `suggestion-${index}`,
        title: `Go to ${suggestion.label}`,
        subtitle: suggestion.reason ? `Suggested: ${suggestion.reason}` : 'Recommended for you',
        category: 'suggestions',
        path: suggestion.path,
        keywords: suggestion.label.toLowerCase().split(' '),
        permissions: [],
        priority: 10 // High priority for suggestions
      });
    });
    
    // Add recent commands
    recentCommands.forEach((cmd, index) => {
      if (index < 5) { // Limit recent commands
        commands.push({
          ...cmd,
          id: `recent-${cmd.id}`,
          category: 'recent',
          priority: 8 // High priority for recent
        });
      }
    });
    
    return commands;
  }, [suggestions, recentCommands]);
  
  // Filter and sort commands based on search query
  const filteredCommands = useMemo(() => {
    const allCommands = [...GLOBAL_COMMANDS, ...dynamicCommands];
    
    // Filter by permissions
    const permittedCommands = allCommands.filter(cmd => 
      cmd.permissions.length === 0 || 
      cmd.permissions.some(permission => hasPermission(permission))
    );
    
    if (!searchQuery.trim()) {
      // Show recent and suggestions first, then others
      return permittedCommands
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 20);
    }
    
    const query = searchQuery.toLowerCase();
    
    // Score commands based on relevance
    const scoredCommands = permittedCommands.map(cmd => {
      let score = 0;
      
      // Exact title match
      if (cmd.title.toLowerCase().includes(query)) {
        score += 100;
      }
      
      // Keyword matches
      if (cmd.keywords) {
        cmd.keywords.forEach(keyword => {
          if (keyword.includes(query)) {
            score += 50;
          }
        });
      }
      
      // Subtitle match
      if (cmd.subtitle && cmd.subtitle.toLowerCase().includes(query)) {
        score += 30;
      }
      
      // Category match
      if (COMMAND_CATEGORIES[cmd.category]?.label.toLowerCase().includes(query)) {
        score += 20;
      }
      
      // Priority bonus
      score += cmd.priority || 0;
      
      return { ...cmd, score };
    });
    
    return scoredCommands
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [searchQuery, hasPermission, dynamicCommands]);
  
  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);
  
  // Execute selected command
  const executeCommand = async (command) => {
    // Add to recent commands
    const updatedRecent = [
      command,
      ...recentCommands.filter(cmd => cmd.id !== command.id)
    ].slice(0, 10);
    
    setRecentCommands(updatedRecent);
    localStorage.setItem('sentia-recent-commands', JSON.stringify(updatedRecent));
    
    // Execute the command
    if (command.path) {
      navigateToPath(command.path);
    } else if (command.action) {
      switch (command.action) {
        case 'toggle-theme':
          toggleTheme();
          break;
        default:
          executeQuickAction(command.action);
      }
    }
    
    // Track command execution
    window.dispatchEvent(new CustomEvent('sentia-command-executed', {
      detail: { command }
    }));
    
    onClose();
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };
  
  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);
  
  if (!isOpen) return null;
  
  const overlayClasses = `
    fixed inset-0 z-50 flex items-start justify-center pt-[20vh]
    bg-black bg-opacity-50 backdrop-blur-sm
  `;
  
  const paletteClasses = `
    w-full max-w-2xl mx-4 rounded-lg shadow-2xl
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border border-slate-700'
      : 'bg-white border border-gray-200'
    }
  `;
  
  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className={overlayClasses} onClick={onClose}>
      <div 
        className={paletteClasses}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className={`
          flex items-center px-4 py-3 border-b
          ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <MagnifyingGlassIcon className={`w-5 h-5 mr-3 ${textMutedClasses}`} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search commands, pages, and actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              flex-1 bg-transparent outline-none text-sm
              ${textPrimaryClasses}
              placeholder-gray-400
            `}
          />
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${textMutedClasses}`}>
              {filteredCommands.length} results
            </span>
            <button
              onClick={onClose}
              className={`
                p-1 rounded hover:bg-opacity-75
                ${resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}
              `}
            >
              <XMarkIcon className={`w-4 h-4 ${textMutedClasses}`} />
            </button>
          </div>
        </div>
        
        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length > 0 ? (
            Object.entries(groupedCommands).map(([category, commands]) => {
              const CategoryIcon = COMMAND_CATEGORIES[category]?.icon || FolderIcon;
              
              return (
                <div key={category} className="py-2">
                  {/* Category Header */}
                  <div className={`
                    px-4 py-2 text-xs font-semibold uppercase tracking-wider
                    ${textMutedClasses}
                  `}>
                    <div className="flex items-center">
                      <CategoryIcon className="w-3 h-3 mr-2" />
                      {COMMAND_CATEGORIES[category]?.label || category}
                    </div>
                  </div>
                  
                  {/* Commands in Category */}
                  {commands.map((command, cmdIndex) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={command.id}
                        onClick={() => executeCommand(command)}
                        className={`
                          w-full flex items-center px-4 py-3 text-left
                          transition-colors duration-150
                          ${isSelected
                            ? resolvedTheme === 'dark'
                              ? 'bg-slate-700'
                              : 'bg-gray-100'
                            : resolvedTheme === 'dark'
                              ? 'hover:bg-slate-700'
                              : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${textPrimaryClasses}`}>
                            {command.title}
                          </div>
                          {command.subtitle && (
                            <div className={`text-sm ${textSecondaryClasses} mt-0.5`}>
                              {command.subtitle}
                            </div>
                          )}
                        </div>
                        
                        <ArrowRightIcon className={`
                          w-4 h-4 ml-3 transition-transform
                          ${textMutedClasses}
                          ${isSelected ? 'translate-x-1' : ''}
                        `} />
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <MagnifyingGlassIcon className={`w-8 h-8 mx-auto mb-3 ${textMutedClasses}`} />
              <p className={`${textSecondaryClasses} mb-1`}>
                No commands found
              </p>
              <p className={`text-sm ${textMutedClasses}`}>
                Try searching for pages, actions, or settings
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`
          px-4 py-3 border-t text-xs flex justify-between items-center
          ${resolvedTheme === 'dark' 
            ? 'border-slate-700 bg-slate-900' 
            : 'border-gray-200 bg-gray-50'
          }
          ${textMutedClasses}
        `}>
          <div className="flex items-center space-x-4">
            <span>â†‘â†“ Navigate</span>
            <span>â†µ Select</span>
            <span>âŽ‹ Close</span>
          </div>
          <div>
            âŒ˜K to open
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
