import React, { useState, useEffect } from 'react';
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowUpIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

const AdvancedInventoryManagement = () => {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await fetch('/api/inventory/advanced');
        if (response.ok) {
          const data = await response.json();
          setInventoryData(data);
        } else {
          setInventoryData(mockAdvancedInventoryData);
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setInventoryData(mockAdvancedInventoryData);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
    const interval = setInterval(fetchInventoryData, 30000);
    return () => clearInterval(interval);
  }, []);

  const mockAdvancedInventoryData = {
    overview: {
      totalItems: 245,
      totalValue: 2847500,
      lowStockItems: 12,
      outOfStockItems: 3,
      reorderAlerts: 8,
      turnoverRate: 4.2,
      warehouseUtilization: 78.5,
      averageAge: 32.4
    },
    categories: [
      {
        name: 'Raw Materials',
        items: 89,
        value: 1250000,
        status: 'good',
        turnover: 5.2,
        lowStock: 4
      },
      {
        name: 'Work in Progress',
        items: 45,
        value: 680000,
        status: 'warning',
        turnover: 3.8,
        lowStock: 2
      },
      {
        name: 'Finished Goods',
        items: 78,
        value: 750000,
        status: 'critical',
        turnover: 3.2,
        lowStock: 5
      },
      {
        name: 'Packaging Materials',
        items: 33,
        value: 167500,
        status: 'good',
        turnover: 6.1,
        lowStock: 1
      }
    ],
    items: [
      {
        id: 'INV001',
        name: 'GABA Extract Premium',
        category: 'Raw Materials',
        sku: 'RM-GABA-001',
        currentStock: 450,
        reorderPoint: 200,
        maxStock: 1000,
        unitCost: 125.50,
        totalValue: 56475,
        supplier: 'BioExtract Ltd',
        location: 'A1-B3',
        status: 'good',
        lastOrder: '2025-09-01',
        leadTime: 14,
        avgUsage: 25,
        turnoverRate: 5.8,
        daysToStockout: 18
      },
      {
        id: 'INV002',
        name: 'Natural Flavoring - Berry',
        category: 'Raw Materials',
        sku: 'RM-FLAV-002',
        currentStock: 85,
        reorderPoint: 100,
        maxStock: 500,
        unitCost: 45.25,
        totalValue: 3846.25,
        supplier: 'Flavor Corp',
        location: 'B2-C1',
        status: 'low',
        lastOrder: '2025-08-28',
        leadTime: 7,
        avgUsage: 12,
        turnoverRate: 4.2,
        daysToStockout: 7
      },
      {
        id: 'INV003',
        name: 'Glass Bottles 500ml',
        category: 'Packaging Materials',
        sku: 'PKG-BTL-500',
        currentStock: 2400,
        reorderPoint: 1000,
        maxStock: 5000,
        unitCost: 1.25,
        totalValue: 3000,
        supplier: 'Glass Solutions',
        location: 'C1-D2',
        status: 'good',
        lastOrder: '2025-09-05',
        leadTime: 10,
        avgUsage: 180,
        turnoverRate: 7.2,
        daysToStockout: 13
      },
      {
        id: 'INV004',
        name: 'Sentia Red - Finished Product',
        category: 'Finished Goods',
        sku: 'FG-SENT-RED',
        currentStock: 0,
        reorderPoint: 50,
        maxStock: 500,
        unitCost: 25.00,
        totalValue: 0,
        supplier: 'Internal Production',
        location: 'D1-E1',
        status: 'out_of_stock',
        lastOrder: '2025-09-03',
        leadTime: 3,
        avgUsage: 45,
        turnoverRate: 12.5,
        daysToStockout: 0
      },
      {
        id: 'INV005',
        name: 'Quality Control Labels',
        category: 'Packaging Materials',
        sku: 'PKG-LBL-QC',
        currentStock: 15000,
        reorderPoint: 5000,
        maxStock: 20000,
        unitCost: 0.08,
        totalValue: 1200,
        supplier: 'Label Pro',
        location: 'E2-F1',
        status: 'good',
        lastOrder: '2025-08-30',
        leadTime: 5,
        avgUsage: 850,
        turnoverRate: 8.9,
        daysToStockout: 18
      }
    ],
    recentMovements: [
      {
        id: 'MOV001',
        item: 'GABA Extract Premium',
        type: 'out',
        quantity: 125,
        timestamp: '2025-09-08T10:30:00Z',
        reference: 'Production Order #2025-001',
        user: 'Production Team'
      },
      {
        id: 'MOV002',
        item: 'Glass Bottles 500ml',
        type: 'in',
        quantity: 2000,
        timestamp: '2025-09-08T08:15:00Z',
        reference: 'Purchase Order #PO-2025-089',
        user: 'Warehouse Staff'
      },
      {
        id: 'MOV003',
        item: 'Natural Flavoring - Berry',
        type: 'out',
        quantity: 35,
        timestamp: '2025-09-08T07:45:00Z',
        reference: 'Production Order #2025-002',
        user: 'Production Team'
      }
    ],
    valueTrend: [
      { date: '2025-09-01', value: 2650000 },
      { date: '2025-09-02', value: 2720000 },
      { date: '2025-09-03', value: 2780000 },
      { date: '2025-09-04', value: 2825000 },
      { date: '2025-09-05', value: 2810000 },
      { date: '2025-09-06', value: 2835000 },
      { date: '2025-09-07', value: 2847500 }
    ],
    turnoverAnalysis: [
      { category: 'Raw Materials', turnover: 5.2, target: 6.0 },
      { category: 'Work in Progress', turnover: 3.8, target: 4.0 },
      { category: 'Finished Goods', turnover: 3.2, target: 8.0 },
      { category: 'Packaging Materials', turnover: 6.1, target: 7.0 }
    ],
    stockLevelDistribution: [
      { status: 'Good', count: 185, color: '#10B981' },
      { status: 'Low Stock', count: 43, color: '#F59E0B' },
      { status: 'Critical', count: 12, color: '#EF4444' },
      { status: 'Out of Stock', count: 5, color: '#DC2626' }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'low':
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
      case 'out_of_stock':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const filteredItems = inventoryData?.items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = inventoryData || mockAdvancedInventoryData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Inventory Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive inventory control with real-time tracking and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <DocumentArrowUpIcon className="h-4 w-4" />
            <span>Import Data</span>
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <ArrowPathIcon className="h-4 w-4" />
            <span>Sync System</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.totalItems.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">Active inventory items</p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.overview.totalValue)}
              </p>
              <p className="text-sm text-blue-600">Current stock value</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reorder Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.reorderAlerts}
              </p>
              <p className="text-sm text-red-600">Items need reordering</p>
            </div>
            <BellAlertIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Turnover Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.turnoverRate}x
              </p>
              <p className="text-sm text-purple-600">Annual inventory turns</p>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Inventory Value Trend
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.valueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Stock Level Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Stock Level Distribution
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.stockLevelDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.stockLevelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>

      {/* Turnover Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Inventory Turnover Analysis
        </h3>
        <div className="h-64">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.turnoverAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="turnover" fill="#3B82F6" name="Actual Turnover" />
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} name="Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {data.categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="good">Good</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="currentStock-desc">Stock High-Low</option>
              <option value="currentStock-asc">Stock Low-High</option>
              <option value="totalValue-desc">Value High-Low</option>
              <option value="daysToStockout-asc">Days to Stockout</option>
            </select>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days to Stockout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.sku} • {item.category}
                      </div>
                      <div className="text-xs text-gray-400">
                        Location: {item.location} • Supplier: {item.supplier}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.currentStock.toLocaleString()} units
                    </div>
                    <div className="text-xs text-gray-500">
                      Reorder: {item.reorderPoint} • Max: {item.maxStock}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          item.currentStock <= item.reorderPoint 
                            ? 'bg-red-600' 
                            : item.currentStock <= item.reorderPoint * 1.5
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{
                          width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.totalValue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Unit: {formatCurrency(item.unitCost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">
                        {item.status === 'out_of_stock' ? 'Out of Stock' :
                         item.status === 'low' ? 'Low Stock' :
                         item.status === 'critical' ? 'Critical' : 'Good'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      item.daysToStockout <= 7 ? 'text-red-600' :
                      item.daysToStockout <= 14 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {item.daysToStockout === 0 ? 'Out of Stock' : `${item.daysToStockout} days`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg usage: {item.avgUsage}/day
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {selectedItems.length} items selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Bulk Reorder
                </button>
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                  Update Stock
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                  Export Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Stock Movements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Stock Movements
          </h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Movements
          </button>
        </div>
        <div className="space-y-3">
          {data.recentMovements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  movement.type === 'in' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {movement.type === 'in' ? (
                    <ArrowArrowTrendingUpIcon className={`h-4 w-4 ${
                      movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  ) : (
                    <ArrowTrendingDownIcon className={`h-4 w-4 ${
                      movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {movement.item}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {movement.reference} • {movement.user}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium text-sm ${
                  movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(movement.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedInventoryManagement;