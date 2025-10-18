import React, { useState } from 'react';
import { X, Download, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * DrilldownModal Component
 *
 * Detailed KPI drilldown modal with three view modes:
 * - By Market (UK, EU, US breakdown)
 * - By Channel (Amazon FBA, Shopify DTC breakdown)
 * - By Product (9 SKU performance table)
 *
 * Features:
 * - Time range selector (7d, 30d, 90d, 1y)
 * - Export functionality
 * - Chart visualizations (placeholders for now)
 * - Responsive design
 *
 * @param {Object} props
 * @param {Object} props.kpi - KPI data object with details
 * @param {Function} props.onClose - Close handler
 */
function DrilldownModal({ kpi, onClose }) {
  const [view, setView] = useState('market'); // market, channel, product
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  if (!kpi) return null;

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export drilldown data for:', kpi.id, view, timeRange);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                KPI Drilldown: {kpi.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Detailed breakdown and analysis
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* View selector */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setView('market')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'market'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              By Market
            </button>
            <button
              onClick={() => setView('channel')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'channel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              By Channel
            </button>
            <button
              onClick={() => setView('product')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              By Product
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Time range selector */}
              <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-1">
                {['7d', '30d', '90d', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {view === 'market' && <MarketBreakdown kpi={kpi} timeRange={timeRange} />}
          {view === 'channel' && <ChannelBreakdown kpi={kpi} timeRange={timeRange} />}
          {view === 'product' && <ProductBreakdown kpi={kpi} timeRange={timeRange} />}
        </div>
      </div>
    </div>
  );
}

/**
 * MarketBreakdown Component
 */
function MarketBreakdown({ kpi, timeRange }) {
  const markets = [
    { id: 'uk', name: 'United Kingdom', value: 42500, change: 12.5, share: 45 },
    { id: 'eu', name: 'European Union', value: 35200, change: 8.2, share: 37 },
    { id: 'us', name: 'United States', value: 17300, change: -2.1, share: 18 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Market</h3>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {markets.map((market) => (
          <div key={market.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              {market.name} ({market.share}%)
            </h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              £{market.value.toLocaleString()}
            </div>
            <TrendIndicator change={market.change} />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="font-medium">Market Trend Chart</p>
          <p className="text-sm">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ChannelBreakdown Component
 */
function ChannelBreakdown({ kpi, timeRange }) {
  const channels = [
    { id: 'amazon-fba', name: 'Amazon FBA', value: 58200, change: 15.3, share: 61 },
    { id: 'shopify-dtc', name: 'Shopify DTC', value: 36800, change: 9.7, share: 39 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Channel</h3>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              {channel.name} ({channel.share}%)
            </h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              £{channel.value.toLocaleString()}
            </div>
            <TrendIndicator change={channel.change} />

            {/* Share bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    channel.id === 'amazon-fba' ? 'bg-orange-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${channel.share}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="font-medium">Channel Trend Chart</p>
          <p className="text-sm">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductBreakdown Component
 */
function ProductBreakdown({ kpi, timeRange }) {
  const products = [
    { sku: 'PROD-001', name: 'Product A', value: 12500, change: 18.2 },
    { sku: 'PROD-002', name: 'Product B', value: 11200, change: 12.5 },
    { sku: 'PROD-003', name: 'Product C', value: 9800, change: -3.1 },
    { sku: 'PROD-004', name: 'Product D', value: 9100, change: 7.8 },
    { sku: 'PROD-005', name: 'Product E', value: 8500, change: 22.1 },
    { sku: 'PROD-006', name: 'Product F', value: 7600, change: -5.4 },
    { sku: 'PROD-007', name: 'Product G', value: 6900, change: 4.2 },
    { sku: 'PROD-008', name: 'Product H', value: 5400, change: 9.6 },
    { sku: 'PROD-009', name: 'Product I', value: 4000, change: -8.9 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Product</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Value</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Change</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Share</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const totalValue = products.reduce((sum, p) => sum + p.value, 0);
              const share = ((product.value / totalValue) * 100).toFixed(1);

              return (
                <tr key={product.sku} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm font-medium">{product.sku}</td>
                  <td className="py-3 px-4">{product.name}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    £{product.value.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <TrendIndicator change={product.change} compact />
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">{share}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
              <td className="py-3 px-4" colSpan="2">
                Total
              </td>
              <td className="py-3 px-4 text-right">
                £{products.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
              </td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * TrendIndicator Component
 */
function TrendIndicator({ change, compact = false }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          isNeutral
            ? 'text-gray-600'
            : isPositive
            ? 'text-green-600'
            : 'text-red-600'
        }`}
      >
        {!isNeutral && (isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
        <span className="font-semibold">
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${
        isNeutral
          ? 'bg-gray-100 text-gray-700'
          : isPositive
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {!isNeutral && (isPositive ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />)}
      <span className="font-semibold text-lg">
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
      <span className="text-sm">vs last period</span>
    </div>
  );
}

export default DrilldownModal;
