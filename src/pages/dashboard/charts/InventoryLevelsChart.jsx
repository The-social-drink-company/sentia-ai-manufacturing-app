import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import ChartCard from './ChartCard';

/**
 * InventoryLevelsChart Component
 *
 * Displays inventory management metrics:
 * - Current stock levels by SKU
 * - Inventory value over time
 * - Reorder point indicators
 * - Stock turnover rate
 * - Days of inventory remaining
 *
 * @param {Object} props
 * @param {Array} props.data - Inventory time series data
 * @param {Array} props.skuData - Current inventory by SKU
 * @param {boolean} props.loading - Loading state
 * @param {Error} props.error - Error object
 * @param {Function} props.onRefresh - Refresh handler
 * @param {Function} props.onExport - Export handler
 */
function InventoryLevelsChart({
  data = [],
  skuData = [],
  loading = false,
  error = null,
  onRefresh,
  onExport,
}) {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
  const [view, setView] = useState('value'); // value, units, sku

  // Filter data based on time range
  const filteredData = filterDataByTimeRange(data, timeRange);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">
          {view === 'sku' ? label : formatDate(label)}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold">{formatValue(entry.value, entry.dataKey)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Time range selector
  const timeRangeActions = (
    <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
      {['7d', '30d', '90d'].map((range) => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            timeRange === range
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Inventory Levels"
      subtitle={`${getTimeRangeLabel(timeRange)} stock management overview`}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onExport={onExport}
      actions={timeRangeActions}
    >
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView('value')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'value'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Value
        </button>
        <button
          onClick={() => setView('units')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'units' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Units
        </button>
        <button
          onClick={() => setView('sku')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'sku' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          By SKU
        </button>
      </div>

      {/* Value View - Area chart of inventory value */}
      {view === 'value' && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="inventoryValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area
              type="monotone"
              dataKey="inventoryValue"
              name="Inventory Value"
              stroke="#8b5cf6"
              fill="url(#inventoryValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Units View - Line chart with reorder point indicators */}
      {view === 'units' && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            {/* Reorder point line */}
            <ReferenceLine
              y={calculateReorderPoint(filteredData)}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Reorder Point', position: 'insideTopRight', fill: '#ef4444' }}
            />
            {/* Safety stock line */}
            <ReferenceLine
              y={calculateSafetyStock(filteredData)}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Safety Stock', position: 'insideTopRight', fill: '#f59e0b' }}
            />
            <Line
              type="monotone"
              dataKey="totalUnits"
              name="Total Units"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* SKU View - Bar chart of current stock by SKU */}
      {view === 'sku' && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={skuData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="sku"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar
              dataKey="currentStock"
              name="Current Stock"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="reorderPoint"
              name="Reorder Point"
              fill="#e5e7eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Inventory Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Inventory Summary</h4>

        {/* Overall metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryMetric
            label="Total Value"
            value={calculateLatest(filteredData, 'inventoryValue')}
            prefix="£"
            color="purple"
          />
          <SummaryMetric
            label="Total Units"
            value={calculateLatest(filteredData, 'totalUnits')}
            suffix="units"
            color="blue"
          />
          <SummaryMetric
            label="Avg Turnover"
            value={calculateAverage(filteredData, 'turnoverRate')}
            suffix="days"
            decimals={1}
            color="green"
          />
          <SummaryMetric
            label="SKUs Below ROP"
            value={calculateBelowReorderPoint(skuData)}
            suffix={`/ ${skuData.length}`}
            color="red"
          />
        </div>

        {/* SKU Status breakdown */}
        {skuData.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-3">Stock Status by SKU</h5>
            <div className="grid md:grid-cols-3 gap-2">
              {skuData.slice(0, 6).map((sku) => (
                <SKUStatusCard key={sku.sku} sku={sku} />
              ))}
            </div>
            {skuData.length > 6 && (
              <div className="mt-2 text-center">
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  View all {skuData.length} SKUs
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ChartCard>
  );
}

/**
 * SummaryMetric Component
 */
function SummaryMetric({ label, value, prefix = '', suffix = '', decimals = 0, color }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClasses[color] || colorClasses.blue}`}>
        {prefix}
        {typeof value === 'number' ? value.toFixed(decimals).toLocaleString() : value}
        <span className="text-sm font-normal text-gray-600 ml-1">{suffix}</span>
      </div>
    </div>
  );
}

/**
 * SKUStatusCard Component
 */
function SKUStatusCard({ sku }) {
  const stockPercent = (sku.currentStock / sku.reorderPoint) * 100;
  let status = 'healthy';
  let statusColor = 'green';

  if (stockPercent < 50) {
    status = 'critical';
    statusColor = 'red';
  } else if (stockPercent < 100) {
    status = 'warning';
    statusColor = 'yellow';
  }

  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-medium">{sku.sku}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${colorClasses[statusColor]}`}>
          {status}
        </span>
      </div>
      <div className="text-sm font-semibold">{sku.currentStock} units</div>
      <div className="text-xs text-gray-600">ROP: {sku.reorderPoint}</div>
    </div>
  );
}

/**
 * Helper Functions
 */

function filterDataByTimeRange(data, range) {
  if (!data || data.length === 0) return [];

  const now = new Date();
  const ranges = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const daysAgo = ranges[range] || 30;
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return data.filter((item) => new Date(item.date) >= cutoffDate);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTick(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatValue(value, dataKey) {
  if (dataKey === 'inventoryValue') {
    return `£${value.toLocaleString()}`;
  }
  if (dataKey === 'currentStock' || dataKey === 'totalUnits' || dataKey === 'reorderPoint') {
    return `${value.toLocaleString()} units`;
  }
  return value.toLocaleString();
}

function getTimeRangeLabel(range) {
  const labels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };
  return labels[range] || 'Last 30 days';
}

function calculateLatest(data, key) {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1]?.[key] || 0;
}

function calculateAverage(data, key) {
  if (!data || data.length === 0) return 0;
  const total = data.reduce((sum, item) => sum + (item[key] || 0), 0);
  return total / data.length;
}

function calculateReorderPoint(data) {
  // Simple calculation: average of latest reorder points
  if (!data || data.length === 0) return 0;
  const recent = data.slice(-7); // Last 7 days
  return calculateAverage(recent, 'reorderPoint') || 500; // Default 500
}

function calculateSafetyStock(data) {
  // Safety stock is typically 30-50% of reorder point
  return calculateReorderPoint(data) * 0.4;
}

function calculateBelowReorderPoint(skuData) {
  if (!skuData || skuData.length === 0) return 0;
  return skuData.filter((sku) => sku.currentStock < sku.reorderPoint).length;
}

export default InventoryLevelsChart;
