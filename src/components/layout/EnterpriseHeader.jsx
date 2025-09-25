import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  BookmarkIcon,
  SparklesIcon,
  LightBulbIcon,
  Bars3Icon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const EnterpriseHeader = ({ sidebarCollapsed, onToggleSidebar }) => {
  const { user, mode } = useBulletproofAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Production Target Achieved', message: 'Bottling line exceeded daily target by 12%', time: '2 min ago', unread: true },
    { id: 2, type: 'warning', title: 'Inventory Alert', message: 'Raw materials below reorder point', time: '15 min ago', unread: true },
    { id: 3, type: 'info', title: 'AI Insight', message: 'Demand forecast updated with new trends', time: '1 hour ago', unread: false },
    { id: 4, type: 'alert', title: 'System Update', message: 'New features available in v2.1', time: '3 hours ago', unread: false }
  ]);

  // Live time update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick Actions
  const quickActions = [
    { icon: ChartBarIcon, label: 'Export Report', action: () => console.log('Export report'), color: 'blue' },
    { icon: ShareIcon, label: 'Share Dashboard', action: () => console.log('Share dashboard'), color: 'green' },
    { icon: BookmarkIcon, label: 'Save Layout', action: () => console.log('Save layout'), color: 'purple' },
    { icon: BoltIcon, label: 'Run Analysis', action: () => console.log('Run analysis'), color: 'orange' },
    { icon: SparklesIcon, label: 'AI Insights', action: () => console.log('AI insights'), color: 'pink' },
    { icon: LightBulbIcon, label: 'Optimization', action: () => console.log('Optimization'), color: 'yellow' }
  ];

  const headerVariants = {
    collapsed: { paddingLeft: isMobile ? '0' : '5rem' },
    expanded: { paddingLeft: isMobile ? '0' : '23rem' }
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  };

  const quickActionVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.1, y: -2 }
  };

  return (
    <motion.header
      variants={headerVariants}
      animate={sidebarCollapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 right-0 left-0 h-16 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 z-30"
    >
      
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Mobile Menu & Breadcrumbs & Live Stats */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          {isMobile && (
            <motion.button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span>Dashboard</span>
              <span className="mx-2">•</span>
              <span className="text-gray-900 dark:text-white font-medium">Manufacturing</span>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">All Systems Operational</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <motion.div 
            className={`relative ${isMobile ? 'hidden' : 'hidden md:block'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </motion.div>

          {/* Quick Actions Button */}
          <motion.div className="relative">
            <motion.button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BoltIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </motion.button>

            {/* Quick Actions Dropdown */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  variants={notificationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                    <p className="text-sm text-gray-600">Shortcuts to common tasks</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        variants={quickActionVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: index * 0.05 }}
                        onClick={action.action}
                        className={`p-3 rounded-lg text-left transition-all hover:shadow-md ${
                          action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30' :
                          action.color === 'green' ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30' :
                          action.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30' :
                          action.color === 'orange' ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30' :
                          action.color === 'pink' ? 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/30' :
                          'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
                        }`}
                      >
                        <action.icon className={`w-5 h-5 mb-2 ${
                          action.color === 'blue' ? 'text-blue-600' :
                          action.color === 'green' ? 'text-green-600' :
                          action.color === 'purple' ? 'text-purple-600' :
                          action.color === 'orange' ? 'text-orange-600' :
                          action.color === 'pink' ? 'text-pink-600' :
                          'text-yellow-600'
                        }`} />
                        <div className="text-sm font-semibold text-gray-900">{action.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Notifications */}
          <motion.div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {notifications.filter(n => n.unread).length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {notifications.filter(n => n.unread).length}
                  </span>
                </div>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  variants={notificationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">System events</p>
                  </div>
                  
                  <div className="divide-y divide-gray-200/50">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                          notification.unread ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'alert' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {"User"} {user?.lastName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {user?.publicMetadata?.role || 'User'}
              </div>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              {mode === 'clerk' && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" title="Authenticated" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showQuickActions) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowNotifications(false);
            setShowQuickActions(false);
          }}
        />
      )}
    </motion.header>
  );
};

export default EnterpriseHeader;