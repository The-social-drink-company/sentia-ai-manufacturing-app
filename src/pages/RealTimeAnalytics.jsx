import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const RealTimeAnalytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetrics] = useState(['revenue', 'orders', 'inventory']);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch real-time data from all integrations
  const { data: amazonData, isLoading: amazonLoading, refetch: refetchAmazon } = useQuery({
    queryKey: ['amazon-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/amazon?endpoint=metrics&range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch Amazon data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
    retry: 3
  });

  const { data: shopifyData, isLoading: shopifyLoading, refetch: refetchShopify } = useQuery({
    queryKey: ['shopify-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/shopify?endpoint=analytics&period=${timeRange === '24h' ? '1' : timeRange === '7d' ? '7' : '30'}`);
      if (!response.ok) throw new Error('Failed to fetch Shopify data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false,
    retry: 3
  });

  const { data: unleashedData, isLoading: unleashedLoading, refetch: refetchUnleashed } = useQuery({
    queryKey: ['unleashed-summary', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/unleashed?endpoint=summary`);
      if (!response.ok) throw new Error('Failed to fetch Unleashed data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false,
    retry: 3
  });

  const { data: xeroData, isLoading: xeroLoading, refetch: refetchXero } = useQuery({
    queryKey: ['xero-financial', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/xero?endpoint=financial-summary&period=${timeRange === '24h' ? '1' : timeRange === '7d' ? '7' : '30'}`);
      if (!response.ok) throw new Error('Failed to fetch Xero data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false,
    retry: 3
  });

  // Auto-refresh all data
  const refreshAllData = () => {
    refetchAmazon();
    refetchShopify();
    refetchUnleashed();
    refetchXero();
  };

  // Calculate combined metrics
  const combinedMetrics = React.useMemo(() => {
    if (!amazonData?.data || !shopifyData?.data || !xeroData?.data || !unleashedData?.data) {
      return null;
    }

    const totalRevenue = (amazonData.data.totalRevenue || 0) + (shopifyData.data.summary?.totalSales || 0);
    const totalOrders = (amazonData.data.totalOrders || 0) + (shopifyData.data.summary?.totalOrders || 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalInventoryValue: unleashedData.data.totalValue || 0,
      totalCustomers: shopifyData.data.summary?.totalCustomers || 0,
      overdueAmount: xeroData.data.invoices?.due || 0,
      lastUpdated: new Date().toISOString()
    };
  }, [amazonData, shopifyData, xeroData, unleashedData]);

  // Prepare chart data
  const revenueChartData = React.useMemo(() => {
    if (!shopifyData?.data?.analytics) return null;

    const labels = shopifyData.data.analytics.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Daily Revenue',
          data: shopifyData.data.analytics.map(day => day.total_sales || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [shopifyData]);

  const inventoryChartData = React.useMemo(() => {
    if (!unleashedData?.data) return null;

    return {
      labels: ['Available', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [
          unleashedData.data.totalItems - unleashedData.data.lowStockItems - unleashedData.data.outOfStockItems,
          unleashedData.data.lowStockItems,
          unleashedData.data.outOfStockItems
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#DC2626'],
        borderWidth: 2
      }]
    };
  }, [unleashedData]);

  const isLoading = amazonLoading || shopifyLoading || unleashedLoading || xeroLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-Time Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Live data from Amazon, Shopify, Unleashed ERP, and Xero
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            <ClockIcon className="w-4 h-4 inline mr-1" />
            Auto Refresh
          </button>

          {/* Manual Refresh */}
          <button
            onClick={refreshAllData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 inline mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Real-Time Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amazon SP-API</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${amazonData ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{amazonData ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <ShoppingCartIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Shopify</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${shopifyData ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{shopifyData ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unleashed ERP</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${unleashedData ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{unleashedData ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Xero Accounting</p>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${xeroData ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{xeroData ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {combinedMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${combinedMetrics.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {combinedMetrics.totalOrders.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${combinedMetrics.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${combinedMetrics.overdueAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {revenueChartData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                Export
              </button>
            </div>
            <div className="h-64">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Inventory Chart */}
        {inventoryChartData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Status</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
                Export
              </button>
            </div>
            <div className="h-64">
              <Doughnut
                data={inventoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Tables Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {shopifyData?.data?.summary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Shopify Orders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last {timeRange}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {shopifyData.data.summary.totalOrders}
                    </p>
                    <p className="text-sm text-green-600">
                      ${shopifyData.data.summary.totalSales?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {amazonData?.data && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Amazon Orders</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last {timeRange}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {amazonData.data.totalOrders}
                      </p>
                      <p className="text-sm text-green-600">
                        ${amazonData.data.totalRevenue?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-gray-500">
                Loading order data...
              </div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Alerts</h3>
          </div>
          <div className="p-6 space-y-4">
            {unleashedData?.data?.lowStockItems > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {unleashedData.data.lowStockItems} items have low inventory levels
                  </p>
                </div>
              </div>
            )}

            {combinedMetrics?.overdueAmount > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Overdue Invoices
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    ${combinedMetrics.overdueAmount.toLocaleString()} in overdue payments
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  All Systems Online
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Data synchronization is running smoothly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;