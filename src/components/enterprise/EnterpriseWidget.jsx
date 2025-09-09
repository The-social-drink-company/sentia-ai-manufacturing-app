import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowArrowTrendingUpIcon,
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
    if (trend === 'up') return ArrowArrowTrendingUpIcon;
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
        className={`relative bg-white/60 backdrop-blur-xl rounded-3xl border ${colors.border} p-8 shadow-xl overflow-hidden ${className}`}
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
      className={`relative bg-white/60 backdrop-blur-xl rounded-3xl border ${colors.border} overflow-hidden shadow-xl group ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.6) 100%)`
      }}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`} />
      
      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `linear-gradient(45deg, transparent, ${colors.accent}20, transparent)`,
          backgroundSize: '400% 400%'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {Icon && (
              <motion.div
                className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={`w-7 h-7 ${colors.icon}`} />
              </motion.div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <EllipsisHorizontalIcon className="w-6 h-6 text-gray-600" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50"
                >
                  {allActions.map((action, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        action.action();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors"
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
              <span className="text-4xl font-bold text-gray-900">
                {typeof value === 'string' ? value : value.toLocaleString()}
              </span>
              
              {TrendIcon && trendPercentage && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: animationDelay + 0.4 }}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    trend === 'up' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
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
                className="text-sm text-gray-600 mt-2"
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
              className="mt-6 pt-6 border-t border-gray-200/50"
            >
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Detailed Analytics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-2xl p-4">
                    <div className="text-sm text-gray-600">This Period</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">
                      {value || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-2xl p-4">
                    <div className="text-sm text-gray-600">Previous Period</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">
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