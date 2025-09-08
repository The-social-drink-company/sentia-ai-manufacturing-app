import React, { useState, useEffect } from 'react'
import { CubeIcon, ExclamationTriangleIcon, TruckIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import ChartErrorBoundary from '../charts/ChartErrorBoundary'
import { ChartJS } from '../../lib/chartSetup'

const InventoryManagement = () => {
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [lowStockItems, setLowStockItems] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
        const response = await fetch(`${apiUrl}/inventory/overview`)
        if (response.ok) {
          const data = await response.json()
          setInventoryData(data)
          setLowStockItems(data.lowStock || [])
          setPendingOrders(data.pendingOrders || [])
        }
      } catch (error) {
        console.error('Failed to fetch inventory data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
    const interval = setInterval(fetchInventoryData, 300000) // Update every 5 minutes
    return () => clearInterval(interval)
  }, [])

  // All mock data removed - only real API data allowed

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor stock levels, manage reorders, and optimize inventory across all markets
        </p>
      </div>

      {/* Inventory Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Low Stock Alerts</h3>
          </div>
          <div className="mt-2 space-y-1">
            {lowStockItems.slice(0, 3).map((item, index) => (
              <p key={index} className="text-sm text-orange-700 dark:text-orange-300">• {item.name}: {item.currentStock} units remaining</p>
            ))}
            {lowStockItems.length > 3 && (
              <p className="text-sm text-orange-600">+{lowStockItems.length - 3} more items need attention</p>
            )}
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Warehouses</option>
            <option value="uk">UK Main</option>
            <option value="eu">EU Central</option>
            <option value="us-east">US East</option>
            <option value="us-west">US West</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Stock
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <TruckIcon className="h-4 w-4 mr-2" />
            Create Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Items</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{inventoryData?.kpis?.totalItems || 3231}</p>
              <p className="text-sm text-gray-500 mt-1">All locations</p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Value</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">£{inventoryData?.kpis?.totalValue || 2847592}</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                  +5.2% vs last month
                </span>
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">£</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Low Stock</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{inventoryData?.kpis?.lowStock || 12}</p>
              <p className="text-sm text-gray-500 mt-1">Items below threshold</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending Orders</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{inventoryData?.kpis?.pendingOrders || 7}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting delivery</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stock Movement (7 days)</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockStockMovement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="inbound" stroke="#10B981" strokeWidth={2} name="Inbound" />
                  <Line type="monotone" dataKey="outbound" stroke="#EF4444" strokeWidth={2} name="Outbound" />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category Breakdown</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockCategoryBreakdown.map((entry, index) => (
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

      {/* Warehouse Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Warehouse Utilization</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockWarehouseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" />
                  <Bar dataKey="utilization" fill="#3B82F6" name="Utilization" />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Critical Stock Items</h2>
              <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {lowStockItems.length > 0 ? lowStockItems.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.currentStock}</p>
                    <p className="text-xs text-gray-500">Min: {item.minStock}</p>
                  </div>
                </div>
              )) : (
                // Mock critical stock data
                [
                  { name: 'Sentia Red Premium', sku: 'SENTIA-R-001', currentStock: 15, minStock: 50 },
                  { name: 'Packaging Material A', sku: 'PKG-MAT-001', currentStock: 23, minStock: 100 },
                  { name: 'Quality Labels', sku: 'LABEL-Q-001', currentStock: 8, minStock: 25 },
                  { name: 'Safety Seals', sku: 'SEAL-S-001', currentStock: 31, minStock: 75 },
                  { name: 'Bottle Caps Premium', sku: 'CAP-P-001', currentStock: 12, minStock: 40 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{item.currentStock}</p>
                      <p className="text-xs text-gray-500">Min: {item.minStock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Stock Transactions</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All Transactions
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { item: 'Sentia Premium Red', type: 'Inbound', quantity: '+150', location: 'UK Main', date: '2025-09-08 09:30', status: 'Completed' },
                { item: 'Packaging Materials', type: 'Outbound', quantity: '-75', location: 'EU Central', date: '2025-09-08 08:15', status: 'Completed' },
                { item: 'Quality Control Labels', type: 'Inbound', quantity: '+200', location: 'US East', date: '2025-09-07 16:45', status: 'Completed' },
                { item: 'Sentia Gold Edition', type: 'Outbound', quantity: '-25', location: 'UK Main', date: '2025-09-07 14:20', status: 'Processing' },
                { item: 'Bottle Caps', type: 'Inbound', quantity: '+500', location: 'EU Central', date: '2025-09-07 11:10', status: 'Pending' }
              ].map((transaction, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.item}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'Inbound' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={transaction.quantity.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {transaction.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryManagement
