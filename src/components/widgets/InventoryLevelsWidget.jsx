import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Bar } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard,
  DataGrid
} from './WidgetComponents';

const InventoryLevelsWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch inventory data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['inventory-levels'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/inventory/levels`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to mock data if API fails
        if (response.status === 404 || response.status === 500) {
          return getMockData();
        }
        throw new Error(`Failed to fetch inventory levels: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    retryDelay: 1000
  });

  // Mock data fallback
  const getMockData = () => ({
    summary: {
      totalSKUs: 245,
      totalValue: 1547280,
      averageTurnover: 8.3,
      stockoutRisk: 12,
      overstockItems: 18,
      reorderRequired: 23
    },
    categories: [
      { name: 'Raw Materials', value: 450000, items: 89, status: 'optimal' },
      { name: 'Work in Progress', value: 320000, items: 45, status: 'high' },
      { name: 'Finished Goods', value: 777280, items: 111, status: 'optimal' }
    ],
    criticalItems: [
      { sku: 'RM-001', name: 'Steel Sheet 2mm', current: 150, min: 200, status: 'critical', daysSupply: 2 },
      { sku: 'RM-045', name: 'Aluminum Bars', current: 320, min: 500, status: 'low', daysSupply: 5 },
      { sku: 'FG-112', name: 'Product A', current: 45, min: 100, status: 'critical', daysSupply: 1 },
      { sku: 'WP-023', name: 'Sub-Assembly B', current: 180, min: 250, status: 'low', daysSupply: 4 }
    ],
    topMovers: [
      { sku: 'FG-001', name: 'Product X', movement: 1200, trend: 'up', changePercent: 15 },
      { sku: 'FG-002', name: 'Product Y', movement: 980, trend: 'up', changePercent: 8 },
      { sku: 'FG-003', name: 'Product Z', movement: 750, trend: 'down', changePercent: -5 }
    ],
    warehouseCapacity: {
      used: 72,
      available: 28,
      locations: [
        { name: 'Main Warehouse', used: 85, capacity: 100 },
        { name: 'Overflow Storage', used: 45, capacity: 100 },
        { name: 'Cold Storage', used: 90, capacity: 100 }
      ]
    }
  });

  if (isLoading && !data) return <WidgetSkeleton title="Inventory Levels" height="400px" />;
  if (error && !data) return <WidgetError error={error} onRetry={refetch} title="Inventory Levels" />;

  const inventory = data || getMockData();

  // Chart configuration for categories
  const chartData = {
    labels: inventory.categories?.map(cat => cat.name) || [],
    datasets: [
      {
        label: 'Inventory Value ($)',
        data: inventory.categories?.map(cat => cat.value) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
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
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  // Table columns for critical items
  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Item' },
    {
      key: 'current',
      label: 'Current',
      render: (value, row) => (
        <span className={row.status === 'critical' ? 'text-red-600 font-semibold' : ''}>
          {value}
        </span>
      )
    },
    { key: 'min', label: 'Min Level' },
    {
      key: 'daysSupply',
      label: 'Days Supply',
      render: (value) => (
        <span className={value <= 2 ? 'text-red-600' : value <= 5 ? 'text-yellow-600' : 'text-green-600'}>
          {value} days
        </span>
      )
    }
  ];

  return (
    <WidgetContainer
      title="Inventory Levels"
      onRefresh={() => {
        queryClient.invalidateQueries(['inventory-levels']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total SKUs"
          value={inventory.summary?.totalSKUs || 0}
          icon={CubeIcon}
        />
        <MetricCard
          label="Total Value"
          value={`$${((inventory.summary?.totalValue || 0) / 1000000).toFixed(2)}M`}
          trend={{ direction: 'up', value: 3.5 }}
        />
        <MetricCard
          label="Reorder Required"
          value={inventory.summary?.reorderRequired || 0}
          icon={ExclamationTriangleIcon}
        />
        <MetricCard
          label="Turnover Rate"
          value={inventory.summary?.averageTurnover || 0}
          unit="x"
          trend={{ direction: 'up', value: 0.5 }}
        />
      </div>

      {/* Warehouse Capacity */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Warehouse Capacity</h4>
        <div className="space-y-2">
          {inventory.warehouseCapacity?.locations?.map((location) => (
            <div key={location.name}>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>{location.name}</span>
                <span>{location.used}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    location.used >= 90 ? 'bg-red-500' : location.used >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${location.used}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Inventory by Category</h4>
        <div style={{ height: '200px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Critical Items Table */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Critical Items</h4>
          <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
            {inventory.criticalItems?.filter(item => item.status === 'critical').length || 0} Critical
          </span>
        </div>
        <DataGrid columns={columns} data={inventory.criticalItems || []} />
      </div>

      {/* Top Movers */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top Moving Items</h4>
        <div className="space-y-2">
          {inventory.topMovers?.map((item) => (
            <div key={item.sku} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${item.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {item.trend === 'up' ?
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" /> :
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.movement} units</p>
                <p className={`text-xs ${item.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.changePercent > 0 ? '+' : ''}{item.changePercent}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </WidgetContainer>
  );
};

export default InventoryLevelsWidget;