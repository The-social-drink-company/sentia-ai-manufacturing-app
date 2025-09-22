import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Calculator, 
  TrendingUp, 
  FileText, 
  Settings, 
  Users, 
  Bell, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Database,
  Brain,
  Target,
  Zap,
  Shield,
  Download,
  Upload
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange, isCollapsed, onToggleCollapse, user }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: Home,
      badge: null,
      description: 'Overview and key metrics'
    },
    {
      id: 'analytics',
      label: 'Financial Analytics',
      icon: BarChart3,
      badge: 'Pro',
      description: 'Advanced financial analysis'
    },
    {
      id: 'calculator',
      label: 'Working Capital Calculator',
      icon: Calculator,
      badge: 'AI',
      description: 'Intelligent cash flow optimization'
    },
    {
      id: 'forecasting',
      label: 'Cash Flow Forecasting',
      icon: TrendingUp,
      badge: 'New',
      description: '12-month projections and scenarios'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Brain,
      badge: 'Beta',
      description: 'Machine learning recommendations'
    },
    {
      id: 'benchmarking',
      label: 'Industry Benchmarking',
      icon: Target,
      badge: null,
      description: 'Compare against industry standards'
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: Database,
      badge: null,
      description: 'Import and export financial data'
    },
    {
      id: 'reports',
      label: 'Enterprise Reports',
      icon: FileText,
      badge: null,
      description: 'Board-ready presentations'
    }
  ];

  const bottomMenuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Application preferences'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      description: 'Documentation and support'
    }
  ];

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  const MenuItem = ({ item, isBottom = false }) => {
    const isActive = activeView === item.id;
    const isHovered = hoveredItem === item.id;

    return (
      <motion.div
        className="relative"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          onClick={() => onViewChange(item.id)}
          className={`w-full justify-start h-12 px-3 mb-1 transition-all duration-200 ${
            isActive 
              ? 'bg-white/20 text-white border-l-4 border-blue-400' 
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={itemVariants}
                transition={{ duration: 0.2 }}
                className="flex-1 flex items-center justify-between min-w-0"
              >
                <span className="font-medium truncate">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 text-xs ${
                      item.badge === 'AI' ? 'bg-purple-600/30 text-purple-200 border-purple-400/30' :
                      item.badge === 'Pro' ? 'bg-blue-600/30 text-blue-200 border-blue-400/30' :
                      item.badge === 'New' ? 'bg-green-600/30 text-green-200 border-green-400/30' :
                      item.badge === 'Beta' ? 'bg-orange-600/30 text-orange-200 border-orange-400/30' :
                      'bg-gray-600/30 text-gray-200 border-gray-400/30'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Tooltip for collapsed state */}
        <AnimatePresence>
          {isCollapsed && isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-2 z-50"
            >
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-white/20 whitespace-nowrap">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={`mt-1 text-xs ${
                      item.badge === 'AI' ? 'bg-purple-600/30 text-purple-200 border-purple-400/30' :
                      item.badge === 'Pro' ? 'bg-blue-600/30 text-blue-200 border-blue-400/30' :
                      item.badge === 'New' ? 'bg-green-600/30 text-green-200 border-green-400/30' :
                      item.badge === 'Beta' ? 'bg-orange-600/30 text-orange-200 border-orange-400/30' :
                      'bg-gray-600/30 text-gray-200 border-gray-400/30'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-white/10 flex flex-col relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={itemVariants}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-white">📊</span>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Sentia Manufacturing</h2>
                  <p className="text-gray-400 text-xs">Enterprise Dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={itemVariants}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="p-4 border-b border-white/10"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.firstName?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'Enterprise User'}
                </p>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Quick Actions */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={itemVariants}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="mt-8 px-2"
            >
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-white/10 p-2">
        {bottomMenuItems.map((item) => (
          <MenuItem key={item.id} item={item} isBottom={true} />
        ))}
      </div>

      {/* Enterprise Badge */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={itemVariants}
            transition={{ duration: 0.2, delay: 0.3 }}
            className="p-4 border-t border-white/10"
          >
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold text-sm">Enterprise</span>
              </div>
              <p className="text-gray-300 text-xs mb-2">
                SOC 2 certified with advanced security features
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;
