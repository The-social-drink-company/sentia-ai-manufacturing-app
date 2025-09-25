import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableViews from 'react-swipeable-views';
import { useSwipeable } from 'react-swipeable';
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  CogIcon,
  BellIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CubeIcon as CubeIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid';

// Import panels
import OverviewPanel from './mobile/OverviewPanel';
import AnalyticsPanel from './mobile/AnalyticsPanel';
import InventoryPanel from './mobile/InventoryPanel';
import SettingsPanel from './mobile/SettingsPanel';

// Import hooks
import { useProductionMetrics } from '../../hooks/useProductionMetrics';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { useInventoryMetrics } from '../../hooks/useInventoryMetrics';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';

const MobileDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState(3);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch metrics
  const productionMetrics = useProductionMetrics();
  const qualityMetrics = useQualityMetrics();
  const inventoryMetrics = useInventoryMetrics();
  const financialMetrics = useFinancialMetrics();

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (window.scrollY === 0 && eventData.deltaY > 100) {
        handleRefresh();
      }
    },
  });

  const tabs = [
    {
      name: 'Overview',
      icon: HomeIcon,
      iconActive: HomeIconSolid,
      badge: null
    },
    {
      name: 'Analytics',
      icon: ChartBarIcon,
      iconActive: ChartBarIconSolid,
      badge: null
    },
    {
      name: 'Inventory',
      icon: CubeIcon,
      iconActive: CubeIconSolid,
      badge: null
    },
    {
      name: 'Settings',
      icon: CogIcon,
      iconActive: CogIconSolid,
      badge: notifications
    },
  ];

  return (
    <div className="mobile-dashboard min-h-screen bg-gray-50 dark:bg-gray-900" {...swipeHandlers}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-40 safe-area-inset">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Sentia Factory
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2">
              <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* User avatar */}
            <button className="p-2">
              <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Pull to refresh indicator */}
        <AnimatePresence>
          {refreshing && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 4 }}
              exit={{ height: 0 }}
              className="bg-blue-600"
            >
              <div className="h-full bg-white/30 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20">
        <SwipeableViews
          index={activeTab}
          onChangeIndex={setActiveTab}
          enableMouseEvents
          className="min-h-screen"
        >
          <div className="swipe-panel">
            <OverviewPanel
              production={productionMetrics}
              quality={qualityMetrics}
              inventory={inventoryMetrics}
              financial={financialMetrics}
            />
          </div>

          <div className="swipe-panel">
            <AnalyticsPanel
              production={productionMetrics}
              quality={qualityMetrics}
              financial={financialMetrics}
            />
          </div>

          <div className="swipe-panel">
            <InventoryPanel
              inventory={inventoryMetrics}
            />
          </div>

          <div className="swipe-panel">
            <SettingsPanel />
          </div>
        </SwipeableViews>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-inset">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab, index) => {
            const Icon = activeTab === index ? tab.iconActive : tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`flex flex-col items-center justify-center py-2 px-3 flex-1 relative ${
                  activeTab === index
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <motion.div
                  animate={{
                    scale: activeTab === index ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>

                <span className="text-xs mt-1 font-medium">{tab.name}</span>

                {tab.badge && (
                  <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}

                {/* Active indicator */}
                {activeTab === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Action Button */}
      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center z-30"
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          // Open quick actions
        }}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </motion.button>

      {/* Offline indicator */}
      <AnimatePresence>
        {!navigator.onLine && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">You're offline. Data may be outdated.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileDashboard;