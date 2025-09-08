import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, UserButton } from '@clerk/clerk-react';
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
  LightBulbIcon
} from '@heroicons/react/24/outline';

const EnterpriseHeader = ({ sidebarCollapsed, onToggleSidebar }) => {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    collapsed: { paddingLeft: '5rem' },
    expanded: { paddingLeft: '23rem' }
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
      className="fixed top-0 right-0 left-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-30"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
      
      <div className="flex items-center justify-between h-full px-8 relative z-10">
        {/* Left Section - Breadcrumbs & Live Stats */}
        <div className="flex items-center space-x-6">
          {/* Dynamic Breadcrumbs */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-sm text-gray-500">
              <span>Dashboard</span>
              <span className="mx-2">•</span>
              <span className="text-gray-900 font-semibold">Manufacturing Intelligence</span>
            </div>
          </motion.div>

          {/* Live System Status */}
          <motion.div 
            className="flex items-center space-x-4 pl-6 border-l border-gray-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-sm font-medium text-gray-600">All Systems Operational</span>
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleTimeString()}
            </div>
          </motion.div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <motion.div 
            className="relative hidden md:block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-80 pl-12 pr-6 py-3 bg-white/60 border border-gray-200/50 rounded-2xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all backdrop-blur-sm"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-xs text-gray-400 font-mono">
              <kbd className="px-2 py-1 bg-gray-100 rounded border text-gray-500">⌘</kbd>
              <span>K</span>
            </div>
          </motion.div>

          {/* Quick Actions Button */}
          <motion.div className="relative">
            <motion.button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="relative p-3 rounded-2xl bg-white/60 border border-gray-200/50 hover:bg-white/80 transition-all backdrop-blur-sm group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BoltIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.button>

            {/* Quick Actions Dropdown */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  variants={notificationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-4"
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
                        className={`p-4 rounded-xl text-left transition-all group bg-gradient-to-r ${
                          action.color === 'blue' ? 'from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20' :
                          action.color === 'green' ? 'from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20' :
                          action.color === 'purple' ? 'from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20' :
                          action.color === 'orange' ? 'from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20' :
                          action.color === 'pink' ? 'from-pink-500/10 to-pink-600/10 hover:from-pink-500/20 hover:to-pink-600/20' :
                          'from-yellow-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:to-yellow-600/20'
                        }`}
                      >
                        <action.icon className={`w-6 h-6 mb-2 ${
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
              className="relative p-3 rounded-2xl bg-white/60 border border-gray-200/50 hover:bg-white/80 transition-all backdrop-blur-sm group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
              {notifications.filter(n => n.unread).length > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-xs font-bold text-white">
                    {notifications.filter(n => n.unread).length}
                  </span>
                </motion.div>
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
                  className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-gray-200/50">
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600">Stay updated with system events</p>
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
            className="p-3 rounded-2xl bg-white/60 border border-gray-200/50 hover:bg-white/80 transition-all backdrop-blur-sm group"
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
                  <SunIcon className="w-6 h-6 text-yellow-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MoonIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User Profile */}
          <motion.div 
            className="flex items-center space-x-3 pl-4 border-l border-gray-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {user?.publicMetadata?.role || 'User'} • Enterprise
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-12 h-12 rounded-2xl shadow-lg border-2 border-white/50"
                  }
                }}
              />
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-30 blur-lg"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
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