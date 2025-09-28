import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import apiService from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const InventoryDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real inventory data from MCP server
  const { data: inventoryData, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', selectedCategory],
    queryFn: () => apiService.getInventoryData(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
  });

  // Fetch inventory optimization suggestions from AI
  const { data: optimizationData } = useQuery({
    queryKey: ['inventoryOptimization'],
    queryFn: () => apiService.getInventoryOptimization(),
    refetchInterval: 60000,
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  // Calculate inventory metrics
  const calculateMetrics = () => {
    if (!inventoryData) return {
      totalValue: 0,
      totalItems: 0,
      lowStockItems: 0,
      overstockItems: 0,
      turnoverRate: 0,
    };

    const items = inventoryData.items || [];
    const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockItems = items.filter(item => item.quantity <= item.reorderPoint).length;
    const overstockItems = items.filter(item => item.quantity > item.maxStock).length;
    const turnoverRate = inventoryData.turnoverRate || 4.2;

    return {
      totalValue,
      totalItems,
      lowStockItems,
      overstockItems,
      turnoverRate,
    };
  };

  const metrics = calculateMetrics();

  const runOptimization = async () => {
    try {
      const result = await apiService.getInventoryOptimization();
      console.log('Optimization results:', result);
      refetch();
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data from MCP Server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-700">Unable to load inventory data. Please check server connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Real-time inventory tracking and optimization</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={runOptimization}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700"
          >
            Optimize Stock Levels
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(metrics.totalValue)}
                </p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(metrics.totalItems)}
                </p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {metrics.lowStockItems}
                </p>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Overstock</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {metrics.overstockItems}
                </p>
              </div>
              <span className="text-2xl">📈</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Turnover Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {metrics.turnoverRate.toFixed(1)}x
                </p>
              </div>
              <span className="text-2xl">🔄</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="raw-materials">Raw Materials</option>
              <option value="work-in-progress">Work in Progress</option>
              <option value="finished-goods">Finished Goods</option>
              <option value="packaging">Packaging</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Inventory (Live Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product Name</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Value</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryData?.items || []).map((item, index) => (
                  <tr key={item.id || index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.sku}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatNumber(item.quantity)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(item.unitCost)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(item.value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.quantity <= item.reorderPoint
                          ? 'bg-red-100 text-red-800'
                          : item.quantity > item.maxStock
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.quantity <= item.reorderPoint
                          ? 'Low Stock'
                          : item.quantity > item.maxStock
                          ? 'Overstock'
                          : 'Optimal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!inventoryData?.items || inventoryData.items.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <p>Connecting to inventory system...</p>
                <p className="text-xs mt-2">MCP Server: https://mcp-server-tkyu.onrender.com</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Optimization Suggestions */}
      {optimizationData && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle>AI Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(optimizationData.recommendations || []).map((rec, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                  <h4 className="font-medium text-gray-900 mb-2">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      Savings: {rec.savings}
                    </span>
                    <button className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryDashboard;