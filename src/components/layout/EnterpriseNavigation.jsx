import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
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
  ArrowArrowTrendingUpIcon,
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          label: 'True Working Capital Requirements', 
          icon: BanknotesIcon, 
          description: 'Real-time calculations with live API data',
          badge: 'Live',
          keywords: ['working capital', 'financial', 'cash flow', 'requirements', 'real-time', 'api']
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
          icon: ArrowArrowTrendingUpIcon, 
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

  // Animation variants
  const sidebarVariants = {
    collapsed: {
      width: isMobile ? 0 : 80,
      x: isMobile ? -100 : 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    expanded: {
      width: isMobile ? 280 : 360,
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    hover: {
      scale: 1.02,
      x: 8,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, delay: 0.1, type: "spring", stiffness: 300 }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const searchVariants = {
    focus: {
      scale: 1.02,
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)",
      borderColor: "rgb(59 130 246)",
      transition: { duration: 0.2 }
    },
    blur: {
      scale: 1,
      boxShadow: "0 0 0px rgba(59, 130, 246, 0)",
      borderColor: "rgb(229 231 235)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && !collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setCollapsed(true)}
        />
      )}

      <motion.div
        variants={sidebarVariants}
        animate={collapsed ? "collapsed" : "expanded"}
        initial="expanded"
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white to-gray-50/50 shadow-2xl border-r border-gray-200/60 backdrop-blur-xl ${isMobile ? 'z-50' : 'z-50'} overflow-hidden`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
        }}
      >
      
      {/* Header */}
      <motion.div 
        className="p-6 border-b border-gradient-to-r from-gray-200/50 to-transparent relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                key="expanded-header"
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                    <motion.span 
                      className="text-white font-bold text-xl z-10 relative"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    >
                      S
                    </motion.span>
                    {/* Animated background pattern */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                      animate={{ 
                        background: [
                          'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                          'linear-gradient(225deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                          'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)'
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-30 blur-lg"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <motion.h2 
                    className="text-xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    Sentia Manufacturing
                  </motion.h2>
                  <motion.p 
                    className="text-sm text-gray-600 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    Enterprise Intelligence Platform
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            className="relative p-3 rounded-xl hover:bg-white/80 transition-all duration-200 group border border-transparent hover:border-gray-200/50 hover:shadow-md backdrop-blur-sm"
            title={collapsed ? 'Expand sidebar (Ctrl+\\)' : 'Collapse sidebar (Ctrl+\\)'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="expand"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRightIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapse"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDoubleLeftIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Hover effect background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
        
        {/* Search Bar */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className="mt-6 relative"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="relative group">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                  animate={{ 
                    scale: searchTerm ? [1, 1.2, 1] : 1,
                    color: searchTerm ? '#3B82F6' : '#9CA3AF'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <MagnifyingGlassIcon className="w-5 h-5 transition-colors" />
                </motion.div>
                
                <motion.input
                  id="nav-search"
                  type="text"
                  placeholder="Search navigation... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/60 border border-gray-200/50 rounded-2xl text-sm font-medium placeholder-gray-400 transition-all duration-200 backdrop-blur-sm focus:outline-none"
                  variants={searchVariants}
                  whileFocus="focus"
                  initial="blur"
                  animate={searchTerm ? "focus" : "blur"}
                />
                
                {/* Search highlight effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 pointer-events-none"
                  animate={{ opacity: searchTerm ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Keyboard shortcut indicator */}
                {!searchTerm && (
                  <motion.div 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-xs text-gray-400 font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-gray-500 shadow-sm">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded border text-gray-500 shadow-sm">K</kbd>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
        <motion.div 
          className="p-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSections.map((section, sectionIndex) => {
            // Check role access
            if (section.requiresRole && userRole !== section.requiresRole && userRole !== 'admin') {
              return null;
            }

            const isExpanded = expandedSections.includes(section.id);
            const SectionIcon = section.icon;

            return (
              <motion.div key={section.id} className="mb-4">
                {/* Section Header */}
                <motion.button
                  onClick={() => !collapsed && toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${
                    collapsed ? 'justify-center' : 'hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/50'
                  } mb-3`}
                  title={collapsed ? section.label : ''}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <motion.div className="flex items-center relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SectionIcon className={`w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-all ${collapsed ? '' : 'mr-4'}`} />
                    </motion.div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div 
                          className="flex items-center"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.span 
                            className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                          >
                            {section.label}
                          </motion.span>
                          <AnimatePresence>
                            {section.badge && (
                              <motion.span 
                                variants={badgeVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="pulse"
                                className={`ml-3 px-3 py-1 text-xs rounded-full font-bold shadow-md ${
                                  section.badge === 'Live' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                  section.badge === 'Smart' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                  section.badge === 'AI' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                                  section.badge === 'MCP' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                  'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                }`}
                              >
                                {section.badge}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && section.expandable && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                      >
                        <ChevronDownIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Section Items */}
                <AnimatePresence>
                  {(isExpanded || collapsed) && (
                    <motion.div 
                      className={`${collapsed ? 'space-y-2' : 'ml-6 mt-3 space-y-2'}`}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ staggerChildren: 0.05 }}
                    >
                    {section.items.map((item, index) => {
                      const ItemIcon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleNavigate(item.path, item.label)}
                          className={`relative w-full flex items-center p-4 rounded-2xl transition-all group overflow-hidden ${
                            active
                              ? 'text-white shadow-xl'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${collapsed ? 'justify-center' : ''}`}
                          title={collapsed ? `${item.label}\n${item.description}` : ''}
                          variants={itemVariants}
                          whileHover="hover"
                          whileTap="tap"
                          layout
                        >
                          {/* Active Background */}
                          {active && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl"
                              layoutId="activeBackground"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            />
                          )}

                          {/* Hover Background */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-gray-100/80 to-gray-50/80 rounded-2xl opacity-0 group-hover:opacity-100"
                            transition={{ duration: 0.2 }}
                          />

                          <motion.div className="flex items-center flex-1 relative z-10">
                            <motion.div
                              animate={active ? { 
                                scale: 1.1,
                                color: '#ffffff'
                              } : {
                                scale: 1,
                                color: collapsed ? '#6B7280' : '#9CA3AF'
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <ItemIcon className={`w-5 h-5 ${collapsed ? '' : 'mr-4'} transition-all group-hover:scale-110`} />
                            </motion.div>
                            
                            <AnimatePresence>
                              {!collapsed && (
                                <motion.div 
                                  className="flex-1 text-left"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <motion.span 
                                      className={`font-semibold text-base ${active ? 'text-white' : 'text-gray-900'} relative z-10`}
                                      whileHover={{ scale: 1.02 }}
                                    >
                                      {item.label}
                                    </motion.span>
                                    <AnimatePresence>
                                      {item.badge && (
                                        <motion.span 
                                          variants={badgeVariants}
                                          initial="hidden"
                                          animate="visible"
                                          whileHover="pulse"
                                          className={`px-2.5 py-1 text-xs rounded-full font-bold shadow-sm ${
                                            active ? 'bg-white/20 text-white' :
                                            item.badge === 'AI' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                                            item.badge === 'Pro' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                            item.badge === 'MCP' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                            item.badge === 'Smart' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                            item.badge === 'ML' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' :
                                            item.badge === 'Auto' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                            item.badge === 'Live' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' :
                                            item.badge === '24/7' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                                            item.badge === 'Interactive' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white' :
                                            item.badge === 'Xero' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' :
                                            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                          }`}
                                        >
                                          {item.badge}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  <motion.p 
                                    className={`text-sm ${active ? 'text-blue-100' : 'text-gray-500'} leading-relaxed`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                  >
                                    {item.description}
                                  </motion.p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          
                          {/* Active Indicator Line */}
                          {active && !collapsed && (
                            <motion.div 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/30 rounded-full"
                              layoutId="activeIndicator"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            />
                          )}

                          {/* Hover Glow Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl"
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                      );
                    })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
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
    </motion.div>
    </>
  );
};

export default EnterpriseNavigation;