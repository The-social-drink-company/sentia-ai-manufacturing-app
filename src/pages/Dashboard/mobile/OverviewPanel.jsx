import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const OverviewPanel = ({ production, quality, inventory, financial }) => {
  const kpiCards = [
    {
      title: 'Production Rate',
      value: `${production?.oee || 85.2}%`,
      change: '+5.2%',
      trend: 'up',
      color: 'blue',
      icon: <ArrowTrendingUpIcon className="w-5 h-5" />
    },
    {
      title: 'Quality Score',
      value: `${quality?.rate || 98.7}%`,
      change: '-0.3%',
      trend: 'down',
      color: 'green',
      icon: <CheckCircleIcon className="w-5 h-5" />
    },
    {
      title: 'Inventory Turns',
      value: inventory?.turns || 12.4,
      change: '+2.1',
      trend: 'up',
      color: 'purple',
      icon: <ClockIcon className="w-5 h-5" />
    },
    {
      title: 'Working Capital',
      value: `$${((financial?.workingCapital || 2450000) / 1000000).toFixed(1)}M`,
      change: '+8.7%',
      trend: 'up',
      color: 'orange',
      icon: <ArrowTrendingUpIcon className="w-5 h-5" />
    },
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Low inventory warning',
      message: 'Raw materials running below threshold',
      time: '5 min ago'
    },
    {
      id: 2,
      type: 'success',
      title: 'Production target achieved',
      message: 'Line 3 exceeded daily target by 12%',
      time: '1 hour ago'
    },
    {
      id: 3,
      type: 'info',
      title: 'Maintenance scheduled',
      message: 'Line 2 maintenance tomorrow at 2 PM',
      time: '2 hours ago'
    },
  ];

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Welcome message */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
        <p className="opacity-90">Your factory is operating at optimal efficiency</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-75">Overall Health</p>
            <p className="text-2xl font-bold">94.5%</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-900/20`}>
                  {card.icon}
                </div>
                <span className={`text-xs font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {card.title}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center space-y-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Reports</span>
          </button>

          <button className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center space-y-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Quality</span>
          </button>

          <button className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center space-y-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Schedule</span>
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  alert.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {alert.type === 'warning' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : alert.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 001 1h.01a1 1 0 100-2H10V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {alert.time}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;