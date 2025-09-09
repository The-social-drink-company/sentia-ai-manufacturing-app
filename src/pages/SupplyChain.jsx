import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  ArrowArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { supplyChainService } from '../services/SupplyChainService.js';

const SupplyChain = () => {
  const [supplyChainData, setSupplyChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    const initializeSupplyChain = async () => {
      try {
        setLoading(true);
        await supplyChainService.initialize();
        await fetchSupplyChainData();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize supply chain: ${err.message}`);
        console.error('Supply chain initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeSupplyChain();
  }, []);

  const fetchSupplyChainData = async () => {
    try {
      const data = await supplyChainService.getSupplyChainDashboard();
      setSupplyChainData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch supply chain data: ${err.message}`);
      console.error('Supply chain data error:', err);
    }
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchSupplyChainData, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'strategic':
        return '⭐⭐⭐';
      case 'preferred':
        return '⭐⭐';
      case 'approved':
        return '⭐';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading supply chain data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Supply Chain Error</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSupplyChainData}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <TruckIcon className="h-8 w-8 text-blue-600" />
              <span>Supply Chain Management</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Supplier relationships, procurement, and logistics optimization
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="suppliers">Suppliers</option>
              <option value="orders">Purchase Orders</option>
              <option value="inventory">Inventory</option>
              <option value="risks">Risk Assessment</option>
            </select>
            <button
              onClick={fetchSupplyChainData}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Suppliers</p>
              <p className="text-3xl font-bold text-blue-600">
                {supplyChainData?.summary?.totalSuppliers || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {supplyChainData?.summary?.activeSuppliers || 0} active
              </p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Spend</p>
              <p className="text-3xl font-bold text-green-600">
                ${(supplyChainData?.summary?.totalSpend || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Avg: ${(supplyChainData?.summary?.averageOrderValue || 0).toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">On-Time Delivery</p>
              <p className="text-3xl font-bold text-yellow-600">
                {Math.round(supplyChainData?.summary?.onTimeDeliveryRate || 0)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Quality: {Math.round((supplyChainData?.summary?.qualityScore || 0) * 20)}%
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Active Alerts</p>
              <p className="text-3xl font-bold text-red-600">
                {(supplyChainData?.summary?.alerts?.lowStock || 0) + 
                 (supplyChainData?.summary?.alerts?.criticalRisks || 0) + 
                 (supplyChainData?.summary?.alerts?.overdueDeliveries || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {supplyChainData?.summary?.alerts?.pendingOrders || 0} pending orders
              </p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Alert Panel */}
      {supplyChainData?.summary?.alerts && (
        (supplyChainData.summary.alerts.lowStock > 0 || 
         supplyChainData.summary.alerts.criticalRisks > 0 || 
         supplyChainData.summary.alerts.overdueDeliveries > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <span>Active Alerts</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supplyChainData.summary.alerts.lowStock > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CubeIcon className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-900">Low Stock Items</span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-2">
                  {supplyChainData.summary.alerts.lowStock}
                </p>
                <p className="text-sm text-red-600">Require immediate reorder</p>
              </div>
            )}
            {supplyChainData.summary.alerts.criticalRisks > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <ShieldExclamationIcon className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-orange-900">Critical Risks</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 mt-2">
                  {supplyChainData.summary.alerts.criticalRisks}
                </p>
                <p className="text-sm text-orange-600">High-risk suppliers</p>
              </div>
            )}
            {supplyChainData.summary.alerts.overdueDeliveries > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-900">Overdue Deliveries</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 mt-2">
                  {supplyChainData.summary.alerts.overdueDeliveries}
                </p>
                <p className="text-sm text-yellow-600">Past due date</p>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Main Content Based on Selected View */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Suppliers */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Suppliers</h2>
            <div className="space-y-4">
              {supplyChainData?.suppliers?.slice(0, 3).map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <span className="text-sm">{getTierIcon(supplier.tier)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{supplier.category} • {supplier.location}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">
                        Rating: {supplier.rating}/5
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(supplier.riskLevel)}`}>
                        {supplier.riskLevel} risk
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Purchase Orders</h2>
            <div className="space-y-4">
              {supplyChainData?.purchaseOrders?.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{order.id}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.supplierName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-gray-900">
                        ${order.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Due: {new Date(order.expectedDelivery).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'suppliers' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Supplier Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplyChainData?.suppliers?.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">{supplier.name}</div>
                            <span className="text-sm">{getTierIcon(supplier.tier)}</span>
                          </div>
                          <div className="text-sm text-gray-500">{supplier.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.rating}/5</div>
                        <div className="text-xs text-gray-500">{supplier.tier}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        OTD: {supplier.performance.onTimeDelivery}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(supplier.riskLevel)}`}>
                          {supplier.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Panel */}
      {supplyChainData?.recommendations?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Supply Chain Recommendations</h2>
          <div className="space-y-4">
            {supplyChainData.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-lg ${
                  rec.type === 'urgent' ? 'border-red-500 bg-red-50' :
                  rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {rec.type === 'urgent' ? (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-blue-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                        rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.impact} Impact
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Action: {rec.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(rec.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChain;