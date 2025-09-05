import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const ShopifyMultiStoreWidget = ({ config = {} }) => {
  const { data: shopifyData, isLoading, error } = useQuery({
    queryKey: ['shopify-multistore-data'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/shopify-multistore');
      if (!response.ok) throw new Error('Failed to fetch Shopify multi-store data');
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const [storeMetrics, setStoreMetrics] = useState([]);
  const [totalMetrics, setTotalMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    if (shopifyData?.stores) {
      setStoreMetrics(shopifyData.stores);
      
      const totals = shopifyData.stores.reduce((acc, store) => ({
        totalSales: acc.totalSales + (store.sales || 0),
        totalOrders: acc.totalOrders + (store.orders || 0),
        totalCustomers: acc.totalCustomers + (store.customers || 0),
        avgOrderValue: acc.avgOrderValue + (store.avgOrderValue || 0)
      }), { totalSales: 0, totalOrders: 0, totalCustomers: 0, avgOrderValue: 0 });

      totals.avgOrderValue = shopifyData.stores.length > 0 ? totals.avgOrderValue / shopifyData.stores.length : 0;
      setTotalMetrics(totals);
    }
  }, [shopifyData]);

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">Shopify Multi-Store</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Loading Shopify stores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">Shopify Multi-Store</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check store connections</p>
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
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Shopify Multi-Store Analytics
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="sentia-card-content">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="sentia-metric-card">
            <div className="sentia-metric-value">${totalMetrics.totalSales.toLocaleString()}</div>
            <div className="sentia-metric-label">Total Sales</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value">{totalMetrics.totalOrders.toLocaleString()}</div>
            <div className="sentia-metric-label">Total Orders</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value">{totalMetrics.totalCustomers.toLocaleString()}</div>
            <div className="sentia-metric-label">Total Customers</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value">${totalMetrics.avgOrderValue.toFixed(2)}</div>
            <div className="sentia-metric-label">Avg Order Value</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm">Store Performance</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {storeMetrics.map((store, index) => (
              <div key={store.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${store.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium text-sm">{store.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">${(store.sales || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{store.orders || 0} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {shopifyData?.syncStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">Inventory Sync Status</span>
            </div>
            <div className="mt-1 text-sm text-blue-700">
              {shopifyData.syncStatus.inSync ? 'All stores synchronized' : `${shopifyData.syncStatus.pendingItems} items pending sync`}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {shopifyData?.lastUpdated ? new Date(shopifyData.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyMultiStoreWidget;