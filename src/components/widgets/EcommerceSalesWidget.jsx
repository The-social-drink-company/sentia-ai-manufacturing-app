import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function EcommerceSalesWidget() {
  // Fetch combined sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['ecommerce-sales'],
    queryFn: async () => {
      const [shopify, amazon] = await Promise.all([
        fetch('/api/shopify/metrics').then(r => r.json()),
        fetch('/api/amazon/sales').then(r => r.json())
      ]);

      return {
        shopify: shopify.data,
        amazon: amazon.metrics,
        combined: {
          totalRevenue: (shopify.data?.totalRevenue30Days || 0) + (amazon.metrics?.totalRevenue || 0),
          totalOrders: (shopify.data?.orderCount || 0) + (amazon.ordersProcessed || 0)
        }
      };
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) return <div>Loading sales data...</div>;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">E-commerce Sales Overview</h2>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Revenue (30d)"
          value={`$${(salesData?.combined.totalRevenue || 0).toLocaleString()}`}
          change="+12.5%"
          color="green"
        />
        <MetricCard
          title="Shopify Revenue"
          value={`$${(salesData?.shopify?.totalRevenue30Days || 0).toLocaleString()}`}
          subtitle={`${salesData?.shopify?.orderCount || 0} orders`}
        />
        <MetricCard
          title="Amazon Revenue"
          value={`$${(salesData?.amazon?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`FBA: ${salesData?.amazon?.fbaVsMerchantFulfilled?.fba || 0} orders`}
        />
      </div>

      {/* Top Products */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Top Selling Products</h3>
        <div className="space-y-2">
          {salesData?.shopify?.topProducts?.slice(0, 5).map((product, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{product[1].name}</span>
              <div className="text-right">
                <div className="font-bold">${product[1].revenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">{product[1].quantity} units</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h3 className="font-semibold text-yellow-800">Inventory Alerts</h3>
        <ul className="mt-2 text-sm">
          <li>• Low stock: SKU-123 (12 units remaining)</li>
          <li>• Reorder needed: SKU-456 (below threshold)</li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, change, color = "blue" }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
      {change && (
        <div className={`text-sm mt-1 text-${color}-600`}>{change}</div>
      )}
    </div>
  );
}

export default EcommerceSalesWidget;