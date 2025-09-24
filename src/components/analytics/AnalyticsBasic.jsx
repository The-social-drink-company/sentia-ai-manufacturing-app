import React, { useState } from 'react';

const AnalyticsBasic = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Business intelligence and performance metrics for Sentia Manufacturing
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">£2,850,000</p>
                <p className="text-sm text-green-600">↗ 12.5% from last {selectedPeriod}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">£</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,847</p>
                <p className="text-sm text-green-600">↗ 8.3% from last {selectedPeriod}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">542</p>
                <p className="text-sm text-green-600">↗ 15.2% from last {selectedPeriod}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">£1,543</p>
                <p className="text-sm text-green-600">↗ 3.8% from last {selectedPeriod}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">Revenue Chart</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Interactive chart showing revenue trends for {selectedPeriod}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Performance</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">Product Chart</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Sales breakdown by product category
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Sales</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Sentia GABA Red 500ml</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">45,000</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">£1,282,500</td>
                  <td className="py-3 px-4 text-green-600 dark:text-green-400">42%</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Sentia GABA Clear 500ml</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">38,000</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">£1,083,000</td>
                  <td className="py-3 px-4 text-green-600 dark:text-green-400">38%</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Sentia GABA Red 250ml</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">28,000</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">£798,000</td>
                  <td className="py-3 px-4 text-green-600 dark:text-green-400">40%</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Starter Kits</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">15,000</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">£427,500</td>
                  <td className="py-3 px-4 text-green-600 dark:text-green-400">35%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Accessories</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">8,000</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">£228,000</td>
                  <td className="py-3 px-4 text-green-600 dark:text-green-400">55%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analytics Dashboard • Updated every 15 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsBasic;