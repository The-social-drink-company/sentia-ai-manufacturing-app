import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  EyeIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

const EnterpriseWidget = ({
  title,
  subtitle,
  value,
  previousValue,
  trend = 'up',
  trendPercentage,
  icon: Icon,
  color = 'blue',
  children,
  actions = [],
  fullscreen = false,
  loading = false,
  className = '',
  animationDelay = 0
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const colorClasses = {
    blue: {
      bg: 'from-blue-500/10 to-blue-600/10',
      border: 'border-blue-200/50',
      text: 'text-blue-600',
      icon: 'text-blue-600',
      accent: 'bg-blue-600'
    },
    green: {
      bg: 'from-green-500/10 to-green-600/10',
      border: 'border-green-200/50',
      text: 'text-green-600',
      icon: 'text-green-600',
      accent: 'bg-green-600'
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/10',
      border: 'border-purple-200/50',
      text: 'text-purple-600',
      icon: 'text-purple-600',
      accent: 'bg-purple-600'
    },
    orange: {
      bg: 'from-orange-500/10 to-orange-600/10',
      border: 'border-orange-200/50',
      text: 'text-orange-600',
      icon: 'text-orange-600',
      accent: 'bg-orange-600'
    },
    red: {
      bg: 'from-red-500/10 to-red-600/10',
      border: 'border-red-200/50',
      text: 'text-red-600',
      icon: 'text-red-600',
      accent: 'bg-red-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    if (trend === 'up') return ArrowTrendingUpIcon;
    if (trend === 'down') return ArrowTrendingDownIcon;
    return null;
  };

  const TrendIcon = getTrendIcon();

  const defaultActions = [
    { icon: EyeIcon, label: 'View Details', action: () => setIsExpanded(!isExpanded) },
    { icon: ShareIcon, label: 'Share', action: () => console.log('Share widget') },
    { icon: BookmarkIcon, label: 'Bookmark', action: () => console.log('Bookmark widget') },
    { icon: ArrowsPointingOutIcon, label: 'Fullscreen', action: () => console.log('Fullscreen') }
  ];

  const allActions = [...actions, ...defaultActions];

  const widgetVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: animationDelay,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const loadingVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (loading) {
    return (
      <motion.div
        variants={widgetVariants}
        initial="hidden"
        animate="visible"
        className={`relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm overflow-hidden ${className}`}
      >
        <motion.div
          variants={loadingVariants}
          animate="animate"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={widgetVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {Icon && (
              <motion.div
                className={`w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </motion.div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  {allActions.map((action, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        action.action();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Value Display */}
        {value !== undefined && (
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: animationDelay + 0.2 }}
              className="flex items-end space-x-4"
            >
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'string' ? value : value.toLocaleString()}
              </span>
              
              {TrendIcon && trendPercentage && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: animationDelay + 0.4 }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                    trend === 'up'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <TrendIcon className="w-4 h-4" />
                  <span>{trendPercentage}</span>
                </motion.div>
              )}
            </motion.div>
            
            {previousValue && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: animationDelay + 0.3 }}
                className="text-xs text-gray-500 dark:text-gray-400 mt-2"
              >
                Previous: {typeof previousValue === 'string' ? previousValue : previousValue.toLocaleString()}
              </motion.p>
            )}
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: animationDelay + 0.4 }}
        >
          {children}
        </motion.div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Detailed Analytics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">This Period</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {value || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Previous Period</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {previousValue || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-20 rounded-3xl blur-xl`}
        transition={{ duration: 0.3 }}
      />

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  );
};

export default EnterpriseWidget;