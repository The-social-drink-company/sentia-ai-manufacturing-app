import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  CpuChipIcon,
  BanknotesIcon,
  BeakerIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  CubeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CloudIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  CalculatorIcon,
  ChartPieIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon
} from '@heroicons/react/24/outline';

const EnterpriseNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['dashboard', 'analytics']);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentItems, setRecentItems] = useState([]);

  // Navigation structure with enhanced enterprise features
  const navigationSections = [
    {
      id: 'dashboard',
      label: 'Dashboard & Overview',
      icon: HomeIcon,
      expandable: true,
      badge: 'Live',
      items: [
        { 
          path: '/dashboard', 
          label: 'Main Dashboard', 
          icon: ChartBarIcon, 
          description: 'Real-time manufacturing intelligence',
          keywords: ['dashboard', 'overview', 'main', 'home']
        },
        { 
          path: '/dashboard/enterprise', 
          label: 'Enterprise View', 
          icon: BuildingStorefrontIcon, 
          description: 'Advanced enterprise analytics',
          keywords: ['enterprise', 'advanced', 'analytics']
        },
        { 
          path: '/ai-analytics', 
          label: 'AI Analytics', 
          icon: CpuChipIcon, 
          description: 'AI-powered insights and predictions',
          badge: 'AI',
          keywords: ['ai', 'artificial intelligence', 'analytics', 'predictions']
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Intelligence',
      icon: PresentationChartLineIcon,
      expandable: true,
      badge: 'Smart',
      items: [
        { 
          path: '/forecasting', 
          label: 'Demand Forecasting', 
          icon: TruckIcon, 
          description: 'AI-powered demand predictions',
          badge: 'AI',
          keywords: ['demand', 'forecasting', 'predictions', 'supply']
        },
        { 
          path: '/what-if', 
          label: 'What-If Analysis', 
          icon: CalculatorIcon, 
          description: 'Interactive scenario modeling',
          badge: 'Interactive',
          keywords: ['what-if', 'scenarios', 'modeling', 'sliders', 'analysis']
        },
        { 
          path: '/working-capital/enhanced', 
          label: 'Enhanced Working Capital', 
          icon: BanknotesIcon, 
          description: 'Advanced financial analysis with sliders',
          badge: 'Pro',
          keywords: ['working capital', 'financial', 'cash flow', 'sliders', 'enhanced']
        },
        { 
          path: '/predictive-analytics', 
          label: 'Predictive Analytics', 
          icon: LightBulbIcon, 
          description: 'Machine learning predictions',
          badge: 'ML',
          keywords: ['predictive', 'machine learning', 'ml', 'predictions']
        }
      ]
    },
    {
      id: 'production',
      label: 'Production & Manufacturing',
      icon: CogIcon,
      expandable: true,
      items: [
        { 
          path: '/production', 
          label: 'Production Tracking', 
          icon: ClipboardDocumentListIcon, 
          description: 'Real-time production monitoring',
          keywords: ['production', 'tracking', 'manufacturing', 'monitoring']
        },
        { 
          path: '/inventory', 
          label: 'Inventory Management', 
          icon: CubeIcon, 
          description: 'Intelligent inventory optimization',
          keywords: ['inventory', 'stock', 'management', 'optimization']
        },
        { 
          path: '/quality', 
          label: 'Quality Control', 
          icon: BeakerIcon, 
          description: 'AI-enhanced quality assurance',
          badge: 'AI',
          keywords: ['quality', 'control', 'assurance', 'testing']
        },
        { 
          path: '/maintenance', 
          label: 'Predictive Maintenance', 
          icon: WrenchScrewdriverIcon, 
          description: 'Smart maintenance scheduling',
          badge: 'Smart',
          keywords: ['maintenance', 'predictive', 'scheduling', 'repair']
        }
      ]
    },
    {
      id: 'financial',
      label: 'Financial Management',
      icon: BanknotesIcon,
      expandable: true,
      items: [
        { 
          path: '/working-capital', 
          label: 'Working Capital', 
          icon: ArrowTrendingUpIcon, 
          description: 'Cash flow and working capital analysis',
          keywords: ['working capital', 'cash flow', 'financial']
        },
        { 
          path: '/financial-reports', 
          label: 'Financial Reports', 
          icon: DocumentDuplicateIcon, 
          description: 'Comprehensive financial reporting',
          badge: 'Xero',
          keywords: ['financial', 'reports', 'xero', 'accounting']
        },
        { 
          path: '/cost-analysis', 
          label: 'Cost Analysis', 
          icon: ChartPieIcon, 
          description: 'Advanced cost breakdown and optimization',
          keywords: ['cost', 'analysis', 'optimization', 'expenses']
        }
      ]
    },
    {
      id: 'integration',
      label: 'AI & Integration',
      icon: CpuChipIcon,
      expandable: true,
      badge: 'MCP',
      items: [
        { 
          path: '/mcp-status', 
          label: 'MCP Integration', 
          icon: CloudIcon, 
          description: 'Model Context Protocol status',
          badge: 'MCP',
          keywords: ['mcp', 'integration', 'protocol', 'ai']
        },
        { 
          path: '/ai-insights', 
          label: 'AI Insights', 
          icon: SparklesIcon, 
          description: 'Advanced AI recommendations',
          badge: 'AI',
          keywords: ['ai', 'insights', 'recommendations', 'intelligence']
        },
        { 
          path: '/automation', 
          label: 'Smart Automation', 
          icon: BoltIcon, 
          description: 'Intelligent process automation',
          badge: 'Auto',
          keywords: ['automation', 'smart', 'process', 'intelligent']
        }
      ]
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: ShieldCheckIcon,
      expandable: true,
      requiresRole: 'admin',
      items: [
        { 
          path: '/admin', 
          label: 'Admin Panel', 
          icon: UserGroupIcon, 
          description: 'System administration and user management',
          keywords: ['admin', 'administration', 'users', 'system']
        },
        { 
          path: '/settings', 
          label: 'System Settings', 
          icon: CogIcon, 
          description: 'Configure system parameters',
          keywords: ['settings', 'configuration', 'system']
        },
        { 
          path: '/audit-logs', 
          label: 'Audit Logs', 
          icon: DocumentDuplicateIcon, 
          description: 'Security and access logs',
          keywords: ['audit', 'logs', 'security', 'access']
        }
      ]
    }
  ];

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Handle navigation
  const handleNavigate = (path, label) => {
    navigate(path);
    // Add to recent items
    const newItem = { path, label, timestamp: Date.now() };
    setRecentItems(prev => [
      newItem,
      ...prev.filter(item => item.path !== path).slice(0, 4)
    ]);
  };

  // Filter items based on search
  const filteredSections = navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      searchTerm === '' || 
      item.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => searchTerm === '' || section.items.length > 0);

  // Check if current path matches
  const isActive = (path) => location.pathname === path;

  // Get user role for access control
  const userRole = user?.publicMetadata?.role || 'viewer';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.getElementById('nav-search')?.focus();
            break;
          case '\\':
            e.preventDefault();
            setCollapsed(!collapsed);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [collapsed]);

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-80'
    }`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Sentia</h2>
                <p className="text-xs text-gray-500">Manufacturing Intelligence</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand sidebar (Ctrl+\\)' : 'Collapse sidebar (Ctrl+\\)'}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        
        {/* Search Bar */}
        {!collapsed && (
          <div className="mt-4 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="nav-search"
              type="text"
              placeholder="Search navigation... (Ctrl+K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Items */}
        {!collapsed && recentItems.length > 0 && searchTerm === '' && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Recently Visited
            </h3>
            <div className="space-y-1">
              {recentItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path, item.label)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="p-2">
          {filteredSections.map((section) => {
            // Check role access
            if (section.requiresRole && userRole !== section.requiresRole && userRole !== 'admin') {
              return null;
            }

            const isExpanded = expandedSections.includes(section.id);
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="mb-4">
                {/* Section Header */}
                <button
                  onClick={() => !collapsed && toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    collapsed ? 'justify-center' : 'hover:bg-gray-50'
                  }`}
                  title={collapsed ? section.label : ''}
                >
                  <div className="flex items-center">
                    <SectionIcon className={`w-5 h-5 text-gray-600 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{section.label}</span>
                        {section.badge && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!collapsed && section.expandable && (
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>

                {/* Section Items */}
                {(isExpanded || collapsed) && (
                  <div className={`${collapsed ? 'space-y-1' : 'ml-8 mt-2 space-y-1'}`}>
                    {section.items.map((item, index) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <button
                          key={index}
                          onClick={() => handleNavigate(item.path, item.label)}
                          className={`w-full flex items-center p-3 rounded-lg transition-all group ${
                            active
                              ? 'bg-blue-100 text-blue-700 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } ${collapsed ? 'justify-center' : ''}`}
                          title={collapsed ? `${item.label}\n${item.description}` : ''}
                        >
                          <div className="flex items-center flex-1">
                            <ItemIcon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'} ${
                              collapsed ? '' : 'mr-3'
                            }`} />
                            
                            {!collapsed && (
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{item.label}</span>
                                  {item.badge && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                      item.badge === 'AI' ? 'bg-purple-100 text-purple-700' :
                                      item.badge === 'Pro' ? 'bg-green-100 text-green-700' :
                                      item.badge === 'MCP' ? 'bg-blue-100 text-blue-700' :
                                      item.badge === 'Smart' ? 'bg-orange-100 text-orange-700' :
                                      item.badge === 'ML' ? 'bg-indigo-100 text-indigo-700' :
                                      item.badge === 'Auto' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              </div>
                            )}
                          </div>
                          
                          {active && !collapsed && (
                            <div className="w-1 h-6 bg-blue-600 rounded-full ml-2"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.firstName || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole} Access</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => handleNavigate('/settings', 'Settings')}
                className="flex-1 flex items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Settings"
              >
                <CogIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => handleNavigate('/notifications', 'Notifications')}
                className="flex-1 flex items-center justify-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Notifications"
              >
                <BellIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Keyboard Shortcuts Info */}
            <div className="text-xs text-gray-400 text-center">
              Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+K</kbd> to search
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => handleNavigate('/settings', 'Settings')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <CogIcon className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
            <button 
              onClick={() => handleNavigate('/notifications', 'Notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <BellIcon className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterpriseNavigation;