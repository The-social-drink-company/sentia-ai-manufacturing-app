import React, { useEffect, useState } from 'react';
import { useProductionMetrics } from '../../hooks/useRealTimeData';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { TrendingUpIcon } from '@heroicons/react/24/outline';

const LiveProductionCounter = ({ className = '' }) => {
  const { metrics, realTimeStats, connectionState } = useProductionMetrics();
  const [previousTotal, setPreviousTotal] = useState(0);
  const [trend, setTrend] = useState('neutral');
  const [animateValue, setAnimateValue] = useState(false);

  useEffect(() => {
    if (realTimeStats?.totalUnits && realTimeStats.totalUnits !== previousTotal) {
      setTrend(realTimeStats.totalUnits > previousTotal ? 'up' : 'down');
      setPreviousTotal(realTimeStats.totalUnits);

      // Trigger animation
      setAnimateValue(true);
      setTimeout(() => setAnimateValue(false), 500);
    }
  }, [realTimeStats?.totalUnits, previousTotal]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100';
    if (efficiency >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (connectionState !== 'connected') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="relative">
            <span className="absolute -left-2 -top-1 h-3 w-3 bg-green-500 rounded-full animate-ping"></span>
            <span className="absolute -left-2 -top-1 h-3 w-3 bg-green-500 rounded-full"></span>
          </span>
          <span className="ml-2">Live Production</span>
        </h3>
        {realTimeStats?.timestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated {new Date(realTimeStats.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Counter */}
      <div className="mb-6">
        <div className={`text-4xl font-bold text-gray-900 dark:text-white transition-all duration-300 ${animateValue ? 'scale-110' : 'scale-100'}`}>
          {formatNumber(realTimeStats?.totalUnits || 0)}
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">
            units
          </span>
        </div>
        {trend && (
          <div className="mt-2 flex items-center">
            {trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? 'Increasing' : 'Decreasing'} production rate
            </span>
          </div>
        )}
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Efficiency</p>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${getEfficiencyColor(realTimeStats?.avgEfficiency)}`}>
            <TrendingUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">
              {realTimeStats?.avgEfficiency?.toFixed(1) || 0}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">OEE</p>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${getEfficiencyColor(realTimeStats?.avgOEE)}`}>
            <TrendingUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">
              {realTimeStats?.avgOEE?.toFixed(1) || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent Production Lines */}
      {metrics && metrics.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Production Lines
          </h4>
          <div className="space-y-2">
            {metrics.slice(0, 3).map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.line?.name || `Line ${metric.lineId}`}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatNumber(metric.unitsProduced)} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveProductionCounter;