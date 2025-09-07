import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyPoundIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      current: 2800000,
      previous: 2600000,
      change: 7.7
    },
    profit: {
      current: 700000,
      previous: 580000,
      change: 20.7
    },
    margins: {
      current: 25.0,
      previous: 22.3,
      change: 2.7
    },
    efficiency: {
      current: 89.2,
      previous: 85.4,
      change: 3.8
    }
  });

  const [timeRange, setTimeRange] = useState('monthly');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const renderMetricCard = (title, icon, current, previous, change, isPercentage = false, isCurrency = false) => {
    const Icon = icon;
    const isPositive = change > 0;
    const formattedCurrent = isCurrency 
      ? formatCurrency(current)
      : isPercentage 
      ? formatPercentage(current)
      : current.toLocaleString();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedCurrent}</p>
            <div className="flex items-center mt-2">
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`ml-1 text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="ml-1 text-sm text-gray-500">vs last {timeRange.slice(0, -2)}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive financial performance analysis and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Total Revenue',
          CurrencyPoundIcon,
          analyticsData.revenue.current,
          analyticsData.revenue.previous,
          analyticsData.revenue.change,
          false,
          true
        )}
        
        {renderMetricCard(
          'Net Profit',
          ArrowTrendingUpIcon,
          analyticsData.profit.current,
          analyticsData.profit.previous,
          analyticsData.profit.change,
          false,
          true
        )}
        
        {renderMetricCard(
          'Profit Margin',
          ChartBarIcon,
          analyticsData.margins.current,
          analyticsData.margins.previous,
          analyticsData.margins.change,
          true,
          false
        )}
        
        {renderMetricCard(
          'Efficiency Rate',
          ClockIcon,
          analyticsData.efficiency.current,
          analyticsData.efficiency.previous,
          analyticsData.efficiency.change,
          true,
          false
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization would be rendered here</p>
              <p className="text-sm">Integration with charting library pending</p>
            </div>
          </div>
        </div>

        {/* Profit Analysis Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profit Analysis
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ArrowTrendingUpIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization would be rendered here</p>
              <p className="text-sm">Integration with charting library pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(analyticsData.revenue.current)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total Revenue
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercentage(analyticsData.margins.current)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Average Margin
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatPercentage(analyticsData.efficiency.current)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Operational Efficiency
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;