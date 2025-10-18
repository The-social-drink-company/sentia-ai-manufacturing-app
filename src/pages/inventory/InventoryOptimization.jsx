/**
 * Inventory Optimization Component
 *
 * Advanced inventory planning with:
 * - Economic Order Quantity (EOQ) calculations
 * - Safety stock recommendations
 * - Reorder point (ROP) optimization
 * - Forecast integration (from Forecasting Dashboard)
 * - Multi-constraint optimization
 * - Purchase order approval workflow
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Play,
  Download,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
// TODO: Add real-time optimization updates via SSE
// import { useSSE } from '../../hooks/useSSE';

/**
 * EOQ Calculation Card
 */
function EOQCalculationCard({ sku, eoqData }) {
  const {
    eoq,
    annualDemand,
    orderingCost,
    holdingCost,
    totalCost,
    numberOfOrders,
  } = eoqData;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        EOQ Calculation - {sku}
      </h3>

      {/* Formula Display */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Economic Order Quantity Formula:</p>
        <p className="font-mono text-lg text-center">
          EOQ = √((2 × D × S) / H)
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600">
          <div>D = Annual Demand</div>
          <div>S = Ordering Cost</div>
          <div>H = Holding Cost</div>
        </div>
      </div>

      {/* Calculation Inputs */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Annual Demand (D)</p>
          <p className="text-xl font-bold text-gray-900">{annualDemand?.toLocaleString()} units</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Ordering Cost (S)</p>
          <p className="text-xl font-bold text-gray-900">£{orderingCost}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Holding Cost (H)</p>
          <p className="text-xl font-bold text-gray-900">£{holdingCost}/unit/year</p>
        </div>
      </div>

      {/* EOQ Result */}
      <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Optimal Order Quantity</p>
            <p className="text-3xl font-bold text-green-600">{eoq} units</p>
          </div>
          <Calculator className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Number of Orders/Year</p>
          <p className="text-lg font-semibold text-gray-900">{numberOfOrders}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Total Annual Cost</p>
          <p className="text-lg font-semibold text-gray-900">£{totalCost?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Safety Stock Calculation Card
 */
function SafetyStockCard({ sku, safetyStockData }) {
  const {
    safetyStock,
    serviceLevel,
    zScore,
    leadTime,
    // eslint-disable-next-line no-unused-vars
    leadTimeVariability, // TODO: Display lead time variability in advanced metrics
    demandVariability,
  } = safetyStockData;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Safety Stock Calculation - {sku}
      </h3>

      {/* Formula Display */}
      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Safety Stock Formula:</p>
        <p className="font-mono text-lg text-center">
          SS = Z × σ × √LT
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600">
          <div>Z = Z-score (service level)</div>
          <div>σ = Demand std dev</div>
          <div>LT = Lead time</div>
        </div>
      </div>

      {/* Calculation Inputs */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Service Level</p>
          <p className="text-xl font-bold text-gray-900">{serviceLevel}%</p>
          <p className="text-xs text-gray-500">Z = {zScore}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Lead Time</p>
          <p className="text-xl font-bold text-gray-900">{leadTime} days</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Demand Std Dev (σ)</p>
          <p className="text-xl font-bold text-gray-900">{demandVariability}</p>
        </div>
      </div>

      {/* Safety Stock Result */}
      <div className="p-4 bg-orange-50 border-2 border-orange-500 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Recommended Safety Stock</p>
            <p className="text-3xl font-bold text-orange-600">{safetyStock} units</p>
          </div>
          <AlertTriangle className="w-12 h-12 text-orange-600" />
        </div>
      </div>
    </div>
  );
}

/**
 * Reorder Point Card
 */
function ReorderPointCard({ sku, ropData }) {
  const {
    reorderPoint,
    leadTimeDemand,
    safetyStock,
    currentStock,
    daysUntilReorder,
  } = ropData;

  const needsReorder = currentStock <= reorderPoint;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Reorder Point - {sku}
      </h3>

      {/* Formula Display */}
      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Reorder Point Formula:</p>
        <p className="font-mono text-lg text-center">
          ROP = (Daily Demand × Lead Time) + Safety Stock
        </p>
      </div>

      {/* Calculation Components */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Lead Time Demand</p>
          <p className="text-xl font-bold text-gray-900">{leadTimeDemand} units</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Safety Stock</p>
          <p className="text-xl font-bold text-gray-900">{safetyStock} units</p>
        </div>
      </div>

      {/* ROP Result */}
      <div className={`p-4 border-2 rounded-lg mb-4 ${
        needsReorder ? 'bg-red-50 border-red-500' : 'bg-purple-50 border-purple-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Reorder Point</p>
            <p className={`text-3xl font-bold ${needsReorder ? 'text-red-600' : 'text-purple-600'}`}>
              {reorderPoint} units
            </p>
          </div>
          <Package className={`w-12 h-12 ${needsReorder ? 'text-red-600' : 'text-purple-600'}`} />
        </div>
      </div>

      {/* Current Stock Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3 rounded ${needsReorder ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-600 mb-1">Current Stock</p>
          <p className={`text-lg font-semibold ${needsReorder ? 'text-red-600' : 'text-green-600'}`}>
            {currentStock} units
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Days Until Reorder</p>
          <p className="text-lg font-semibold text-gray-900">
            {needsReorder ? 'REORDER NOW' : `${daysUntilReorder} days`}
          </p>
        </div>
      </div>

      {needsReorder && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700 font-medium">
            Stock level is below reorder point. Order recommended.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Forecast Integration Panel
 */
function ForecastIntegrationPanel({ forecastData }) {
  if (!forecastData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Forecast Integration
        </h3>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No forecast data loaded</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Load from Forecasting Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Forecast Integration
        </h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded border border-green-300">
          Forecast Loaded
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Forecast Model</p>
          <p className="text-lg font-semibold text-gray-900">{forecastData.model}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Forecast Accuracy</p>
          <p className="text-lg font-semibold text-gray-900">{forecastData.accuracy}%</p>
        </div>
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-xs text-gray-600 mb-1">Horizon</p>
          <p className="text-lg font-semibold text-gray-900">{forecastData.horizon} days</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={forecastData.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })} />
          <YAxis />
          <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
          <Legend />

          <Area type="monotone" dataKey="confidence_lower" fill="#93c5fd" fillOpacity={0.3} stroke="none" />
          <Area type="monotone" dataKey="confidence_upper" fill="#93c5fd" fillOpacity={0.3} stroke="none" />
          <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} name="Forecast" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Optimization Results Table
 */
function OptimizationResultsTable({ results, onApprove }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Optimization Results
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EOQ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <tr key={result.sku} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{result.sku}</div>
                  <div className="text-xs text-gray-500">{result.productName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.currentStock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.eoq}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.safetyStock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.reorderPoint}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-sm font-medium rounded ${
                    result.recommendedOrder > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {result.recommendedOrder} units
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  £{result.orderCost?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.recommendedOrder > 0 ? (
                    <button
                      onClick={() => onApprove(result)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve PO
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">No order needed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Main Inventory Optimization Component
 */
export default function InventoryOptimization() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if forecast data was passed from Forecasting Dashboard
  // eslint-disable-next-line no-unused-vars
  const [forecastData, setForecastData] = useState(location.state?.forecastModel || null); // TODO: Use forecast data in optimization
  // eslint-disable-next-line no-unused-vars
  const [selectedSKUs, setSelectedSKUs] = useState([]); // TODO: Add SKU selector UI
  const [optimizationConfig, setOptimizationConfig] = useState({
    serviceLevel: 95,
    orderingCost: 50,
    holdingCostPercent: 20,
  });

  // Fetch optimization data
  // eslint-disable-next-line no-unused-vars
  const { data, isLoading } = useQuery({ // TODO: Show loading state
    queryKey: ['inventory', 'optimization', selectedSKUs],
    queryFn: async () => {
      const params = new URLSearchParams({ skus: selectedSKUs.join(',') });
      const response = await fetch(`/api/v1/inventory/optimization?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch optimization data');
      const result = await response.json();
      return result.data;
    },
    enabled: selectedSKUs.length > 0,
  });

  // Run optimization mutation
  const runOptimizationMutation = useMutation({
    mutationFn: async (config) => {
      const response = await fetch('/api/v1/inventory/optimization/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skus: selectedSKUs,
          config,
          forecastData,
        }),
      });
      if (!response.ok) throw new Error('Failed to run optimization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', 'optimization']);
    },
  });

  // Approve PO mutation
  const approvePOMutation = useMutation({
    mutationFn: async (orderDetails) => {
      const response = await fetch('/api/v1/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderDetails),
      });
      if (!response.ok) throw new Error('Failed to create purchase order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', 'optimization']);
      // Show success message
    },
  });

  const optimizationResults = data?.results || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Optimization</h1>
          <p className="text-gray-600 mt-1">
            EOQ, Safety Stock, and Reorder Point calculations with forecast integration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/forecasting')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Load Forecast
          </button>
          <button
            onClick={() => runOptimizationMutation.mutate(optimizationConfig)}
            disabled={selectedSKUs.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run Optimization
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Optimization Configuration
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Level (%)
            </label>
            <input
              type="number"
              value={optimizationConfig.serviceLevel}
              onChange={(e) => setOptimizationConfig({ ...optimizationConfig, serviceLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="90"
              max="99.9"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordering Cost (£)
            </label>
            <input
              type="number"
              value={optimizationConfig.orderingCost}
              onChange={(e) => setOptimizationConfig({ ...optimizationConfig, orderingCost: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holding Cost (% of unit cost/year)
            </label>
            <input
              type="number"
              value={optimizationConfig.holdingCostPercent}
              onChange={(e) => setOptimizationConfig({ ...optimizationConfig, holdingCostPercent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Forecast Integration */}
      <ForecastIntegrationPanel forecastData={forecastData} />

      {/* Optimization Results */}
      {optimizationResults.length > 0 && (
        <>
          {/* Individual SKU Details */}
          {optimizationResults.slice(0, 3).map((result) => (
            <div key={result.sku} className="grid md:grid-cols-3 gap-6">
              <EOQCalculationCard sku={result.sku} eoqData={result.eoq} />
              <SafetyStockCard sku={result.sku} safetyStockData={result.safetyStock} />
              <ReorderPointCard sku={result.sku} ropData={result.rop} />
            </div>
          ))}

          {/* Results Table */}
          <OptimizationResultsTable
            results={optimizationResults}
            onApprove={(result) => approvePOMutation.mutate(result)}
          />
        </>
      )}

      {/* Empty State */}
      {optimizationResults.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Optimization Results</h3>
          <p className="text-gray-600 mb-4">
            Select SKUs and run optimization to see EOQ, safety stock, and reorder point calculations
          </p>
          <button
            onClick={() => runOptimizationMutation.mutate(optimizationConfig)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Optimization
          </button>
        </div>
      )}
    </div>
  );
}
