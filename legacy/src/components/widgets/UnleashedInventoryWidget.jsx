import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExclamationTriangleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const UnleashedInventoryWidget = ({ config = {} }) => {
  const { data: inventoryData, isLoading, error } = useQuery({
    queryKey: ['unleashed-inventory-data'],
    queryFn: async () => {
      const response = await fetch('/api/unleashed/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory data');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 55000,
  });

  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAlerts: 0,
    lowStock: 0,
    outOfStock: 0,
    overstock: 0
  });

  useEffect(() => {
    if (inventoryData) {
      // Transform low stock items to alerts format
      const lowStockItems = inventoryData.inventory?.lowStockItems || [];
      const inventoryAlerts = lowStockItems.map(item => ({
        productCode: item.product,
        description: `Reorder point: ${item.reorderPoint}`,
        currentStock: item.current,
        minLevel: item.reorderPoint,
        location: 'Main Warehouse'
      }));

      setAlerts(inventoryAlerts);

      // Count alert types
      const lowStockCount = inventoryAlerts.filter(a => a.currentStock > 0 && a.currentStock < a.minLevel).length;
      const outOfStockCount = inventoryAlerts.filter(a => a.currentStock === 0).length;
      const overstockCount = inventoryAlerts.filter(a => a.currentStock > (a.minLevel * 3)).length;

      setMetrics({
        totalAlerts: inventoryAlerts.length,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        overstock: overstockCount
      });
    }
  }, [inventoryData]);

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">Unleashed Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Loading inventory data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">Unleashed Inventory</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check Unleashed connection</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockLevelColor = (current, min) => {
    if (current === 0) return 'text-red-600';
    if (current < min) return 'text-orange-500';
    if (current > min * 3) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStockLevelIcon = (current, min) => {
    if (current === 0) return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
    if (current < min) return <ArrowTrendingDownIcon className="w-4 h-4 text-orange-500" />;
    if (current > min * 3) return <ArrowTrendingUpIcon className="w-4 h-4 text-blue-600" />;
    return null;
  };

  return (
    <Card className="sentia-card h-full">
      <CardHeader className="sentia-card-header">
        <CardTitle className="sentia-widget-title">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
              Unleashed Inventory Status
            </div>
            {metrics.totalAlerts > 0 && (
              <span className="text-sm font-normal text-orange-500">
                {metrics.totalAlerts} Alerts
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="sentia-card-content">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-600">
              {inventoryData?.inventory?.stockOnHand?.total?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-blue-800">Stock on Hand</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xl font-bold text-green-600">
              {inventoryData?.metrics?.totalSKUs || '0'}
            </div>
            <div className="text-xs text-green-800">Total SKUs</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xl font-bold text-orange-600">{metrics.lowStock}</div>
            <div className="text-xs text-orange-800">Low Stock</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-600">
              {inventoryData?.inventory?.turnoverRate?.toFixed(1) || '0'}
            </div>
            <div className="text-xs text-purple-800">Turnover Rate</div>
          </div>
        </div>

        {/* Inventory Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">Critical Items</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {alerts.slice(0, 10).map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStockLevelIcon(alert.currentStock, alert.minLevel)}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{alert.productCode}</div>
                      <div className="text-xs text-gray-500 truncate">{alert.description}</div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className={`font-semibold text-sm ${getStockLevelColor(alert.currentStock, alert.minLevel)}`}>
                      {alert.currentStock} units
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {alert.minLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-600 font-semibold">All Inventory Levels Optimal</div>
            <div className="text-sm text-gray-500 mt-2">No stock alerts at this time</div>
          </div>
        )}

        {/* Location Summary */}
        {alerts.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Affected Locations</h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(alerts.map(a => a.location).filter(Boolean))].slice(0, 5).map((location, index) => (
                <span key={index} className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                  {location}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {inventoryData?.lastUpdated ? new Date(inventoryData.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnleashedInventoryWidget;
