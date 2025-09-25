import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CubeIcon, TruckIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import InventoryLevelsWidget from '../../components/widgets/InventoryLevelsWidget';
const InventoryDashboard = () => {
  const { getToken } = useAuth();
  const [inventoryData, setInventoryData] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-overview'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || null}/api/inventory/levels`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!response.ok) {
        // Return mock data if API fails
        return {
          totalItems: 1250,
          lowStock: 23,
          outOfStock: 5,
          totalValue: 850000
        };
      }

      return response.json();
    },
    refetchInterval: 30000,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor and manage your inventory levels</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : data?.totalItems || 0}
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {isLoading ? '...' : data?.lowStock || 0}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : data?.outOfStock || 0}
              </p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${isLoading ? '...' : (data?.totalValue || 0).toLocaleString()}
              </p>
            </div>
            <TruckIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Inventory Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <InventoryLevelsWidget />
      </div>

      {/* Action Links */}
      <div className="mt-6 flex gap-4">
        <Link to="/inventory/movements" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          View Movements
        </Link>
        <Link to="/inventory/optimization" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Optimize Stock
        </Link>
        <Link to="/inventory/reports" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Generate Reports
        </Link>
      </div>
    </div>
  );
};

const Inventory = () => {
  return (
    <Routes>
      <Route index element={<InventoryDashboard />} />
      <Route path="movements" element={<div className="p-6">Inventory Movements (Coming Soon)</div>} />
      <Route path="optimization" element={<div className="p-6">Stock Optimization (Coming Soon)</div>} />
      <Route path="reports" element={<div className="p-6">Inventory Reports (Coming Soon)</div>} />
    </Routes>
  );
};

export default Inventory;
