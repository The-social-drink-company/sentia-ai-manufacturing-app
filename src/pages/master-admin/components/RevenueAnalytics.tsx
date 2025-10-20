/**
 * Revenue Analytics Component
 *
 * Visualizes revenue trends, tier breakdown, and tenant growth metrics.
 * Uses recharts for interactive, responsive charts.
 *
 * @module src/pages/master-admin/components/RevenueAnalytics
 * @epic PHASE-5.1-MASTER-ADMIN-DASHBOARD
 * @story ADMIN-006
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useMasterAdminRevenue } from '../hooks/useMasterAdmin';

const TIER_COLORS = {
  starter: '#3B82F6', // blue
  professional: '#A855F7', // purple
  enterprise: '#F97316', // orange
};

export function RevenueAnalytics() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data, isLoading, error } = useMasterAdminRevenue();

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-48 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 h-32 rounded"></div>
            <div className="bg-gray-200 h-32 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-900 text-sm">Failed to load revenue analytics</p>
          <p className="text-red-700 text-xs mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  const revenue = data.data;

  // Calculate total MRR from byTier data
  const totalMRR = revenue.byTier?.reduce((sum, tier) => sum + (tier.mrr || 0), 0) || 0;
  const totalARR = totalMRR * 12;

  // Format trend data for line chart (reverse to show oldest first)
  const trendData =
    revenue.trend
      ?.map((item: any) => ({
        month: new Date(item.month).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        newSubscriptions: Number(item.new_subscriptions || 0),
        tier: item.tier,
      }))
      .reverse() || [];

  // Aggregate by month (combine all tiers per month)
  const monthlyData = trendData.reduce((acc: any[], curr) => {
    const existing = acc.find((item) => item.month === curr.month);
    if (existing) {
      existing.newSubscriptions += curr.newSubscriptions;
    } else {
      acc.push({
        month: curr.month,
        newSubscriptions: curr.newSubscriptions,
      });
    }
    return acc;
  }, []);

  // Format byTier data for pie chart
  const tierPieData =
    revenue.byTier?.map((tier) => ({
      name: tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1),
      value: tier.mrr || 0,
      count: tier.count || 0,
      color: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] || '#6B7280',
    })) || [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
              <p className="text-sm text-gray-600">
                {totalMRR > 0
                  ? `$${totalMRR.toLocaleString()} MRR • $${totalARR.toLocaleString()} ARR`
                  : 'No revenue data available'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Charts (Collapsible) */}
      {isExpanded && (
        <div className="p-6 space-y-8">
          {/* MRR Trend Line Chart */}
          {monthlyData.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                12-Month Subscription Trend
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="newSubscriptions"
                    name="New Subscriptions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">
                No subscription trend data available yet
              </p>
            </div>
          )}

          {/* Revenue by Tier - Pie Chart & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            {tierPieData.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Revenue by Tier
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={tierPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.name} ($${entry.value.toLocaleString()})`
                      }
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600 text-sm">
                  No tier revenue data available
                </p>
              </div>
            )}

            {/* Tier Stats Table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Tier Breakdown
              </h4>
              <div className="space-y-3">
                {tierPieData.map((tier) => (
                  <div
                    key={tier.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tier.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {tier.count} tenant{tier.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${tier.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        ${(tier.value * 12).toLocaleString()} ARR
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Total MRR
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    ${totalMRR.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm text-gray-600">Total ARR</div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${totalARR.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
