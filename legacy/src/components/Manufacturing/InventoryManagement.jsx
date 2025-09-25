import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CardSkeleton } from '../LoadingStates';
import { LineChart, DoughnutChart, inventoryColors } from '../charts';
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Minus, Search, Upload,
  BarChart3, PieChart, RefreshCw
} from 'lucide-react';

const InventoryManagement = () => {
  const { data: session } = ();
  const user = session?.user;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const { data: inventoryData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['inventory-data', selectedCategory, searchTerm, sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/dashboard?category=${selectedCategory}&search=${searchTerm}&sort=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken || ''}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventory data');
      }
      return response.json();
    },
    refetchInterval: 30000,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const data = inventoryData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="mt-2 text-gray-600">Real-time inventory tracking and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={() => refetch()}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="raw-materials">Raw Materials</option>
                <option value="packaging">Packaging</option>
                <option value="finished-goods">Finished Goods</option>
                <option value="chemicals">Chemicals</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="value">Sort by Value</option>
                <option value="lastUpdated">Sort by Last Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isError ? 'Unable to Load Inventory Data' : 'No Inventory Data Available'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {isError 
                ? `Error: ${error?.message || 'Failed to fetch inventory data from server'}`
                : 'No inventory data has been imported yet. Please import your inventory data to get started.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/data-import'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import Inventory Data
              </button>
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* Inventory Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InventoryMetric
            title="Total Items"
            value={data.totalItems.toLocaleString()}
            change={`+${data.totalItemsChange}`}
            trend="up"
            icon={<Package className="w-6 h-6" />}
            color="blue"
          />
          <InventoryMetric
            title="Total Value"
            value={`$${(data.totalValue / 1000000).toFixed(1)}M`}
            change={`+${data.totalValueChange}%`}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <InventoryMetric
            title="Low Stock Items"
            value={data.lowStockItems}
            change={`-${data.lowStockChange}`}
            trend="up"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
          />
          <InventoryMetric
            title="Out of Stock"
            value={data.outOfStockItems}
            change={`-${data.outOfStockChange}`}
            trend="up"
            icon={<Package className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <InventoryTable items={data.items} />
          </div>
          <div className="space-y-8">
            <StockAlerts alerts={data.alerts} />
            <InventoryDistribution distribution={data.distribution} />
          </div>
        </div>

        {/* Movement History and Forecasting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MovementHistory movements={data.recentMovements} />
          <StockForecast forecast={data.forecast} />
        </div>
        </>
        )}
      </div>
    </div>
  );
};

const InventoryMetric = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center mt-1">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ml-1 ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryTable = ({ items }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Inventory Items</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${(item.currentStock * item.unitPrice).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                    item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Minus className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Stock Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-3 rounded-lg border ${
            alert.severity === 'high' ? 'bg-red-50 border-red-200' :
            alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                alert.severity === 'high' ? 'text-red-600' :
                alert.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <div className={`font-medium ${
                  alert.severity === 'high' ? 'text-red-900' :
                  alert.severity === 'medium' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>{alert.title}</div>
                <div className={`text-sm mt-1 ${
                  alert.severity === 'high' ? 'text-red-700' :
                  alert.severity === 'medium' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{alert.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InventoryDistribution = ({ distribution }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Inventory Distribution</h3>
      <div className="space-y-4">
        {distribution.map((category) => (
          <div key={category.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-sm font-medium text-gray-900">{category.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{category.percentage}%</div>
              <div className="text-xs text-gray-500">${(category.value / 1000).toFixed(0)}K</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-32 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <PieChart className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Distribution Chart</p>
        </div>
      </div>
    </div>
  );
};

const MovementHistory = ({ movements }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Recent Movements</h3>
      <div className="space-y-3">
        {movements.map((movement, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                movement.type === 'in' ? 'bg-green-100' :
                movement.type === 'out' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {movement.type === 'in' ? (
                  <Plus className={`w-4 h-4 text-green-600`} />
                ) : movement.type === 'out' ? (
                  <Minus className={`w-4 h-4 text-red-600`} />
                ) : (
                  <RefreshCw className={`w-4 h-4 text-blue-600`} />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{movement.item}</div>
                <div className="text-sm text-gray-500">{movement.reason}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${
                movement.type === 'in' ? 'text-green-600' :
                movement.type === 'out' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : 'Â±'}{movement.quantity}
              </div>
              <div className="text-xs text-gray-500">{movement.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StockForecast = ({ forecast: _forecast }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Stock Forecast</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <p>Stock forecast visualization</p>
          <p className="text-sm">(AI-powered predictions)</p>
        </div>
      </div>
    </div>
  );
};


export default InventoryManagement;
