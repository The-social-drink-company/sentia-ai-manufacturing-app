import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const AmazonSPAPIWidget = ({ config = {} }) => {
  const { data: amazonData, isLoading, error } = useQuery({
    queryKey: ['amazon-sp-api-data'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/amazon-sp-api');
      if (!response.ok) throw new Error('Failed to fetch Amazon SP-API data');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });

  const [metrics, setMetrics] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    salesVelocity: 0,
    fbaStock: 0
  });

  useEffect(() => {
    if (amazonData) {
      setMetrics({
        totalInventory: amazonData.inventory?.total || 0,
        lowStockItems: amazonData.inventory?.lowStock || 0,
        salesVelocity: amazonData.sales?.velocity || 0,
        fbaStock: amazonData.fba?.stock || 0
      });
    }
  }, [amazonData]);

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">Amazon SP-API</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Loading Amazon data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">Amazon SP-API</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check API configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sentia-card h-full">
      <CardHeader className="sentia-card-header">
        <CardTitle className="sentia-widget-title">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            Amazon SP-API Live Data
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="sentia-card-content">
        <div className="grid grid-cols-2 gap-4">
          <div className="sentia-metric-card">
            <div className="sentia-metric-value">{metrics.totalInventory.toLocaleString()}</div>
            <div className="sentia-metric-label">Total Inventory</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value text-amber-600">{metrics.lowStockItems}</div>
            <div className="sentia-metric-label">Low Stock Items</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value text-green-600">
              {metrics.salesVelocity.toFixed(1)}/day
            </div>
            <div className="sentia-metric-label">Sales Velocity</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value text-blue-600">{metrics.fbaStock.toLocaleString()}</div>
            <div className="sentia-metric-label">FBA Stock</div>
          </div>
        </div>
        
        {amazonData?.reorderAlerts && amazonData.reorderAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">Reorder Alerts</h4>
            <div className="space-y-1">
              {amazonData.reorderAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="text-sm text-amber-700">
                  {alert.sku}: {alert.currentStock} units (reorder at {alert.reorderPoint})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {amazonData?.lastUpdated ? new Date(amazonData.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default AmazonSPAPIWidget;
