import React, { useState, useCallback, useMemo } from 'react';
import {
  CalculatorIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon,
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  color: string;
}

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
  timezone: string;
  locale: string;
}

interface ReorderPointData {
  product_id: string;
  market_id: string;
  current_stock: number;
  current_reorder_point: number;
  recommended_reorder_point: number;
  safety_stock: number;
  average_demand: number;
  lead_time_days: number;
  lead_time_variability: number;
  demand_variability: number;
  service_level: number;
  annual_holding_cost: number;
  stockout_cost: number;
  cost_benefit_analysis: {
    service_level_95: { reorder_point: number; holding_cost: number; stockout_risk: number; total_cost: number };
    service_level_98: { reorder_point: number; holding_cost: number; stockout_risk: number; total_cost: number };
    service_level_995: { reorder_point: number; holding_cost: number; stockout_risk: number; total_cost: number };
  };
  historical_stockouts: number;
  reorder_frequency: number;
}

interface ReorderPointCalculatorProps {
  products: Product[];
  markets: Market[];
  inventoryData: any;
  isSimulationMode: boolean;
  onUpdate: () => void;
}

export function ReorderPointCalculator({
  products,
  markets,
  inventoryData,
  isSimulationMode,
  onUpdate
}: ReorderPointCalculatorProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '');
  const [selectedMarket, setSelectedMarket] = useState<string>(markets[0]?.id || '');
  const [targetServiceLevel, setTargetServiceLevel] = useState<95 | 98 | 99.5>(98);
  const [customParameters, setCustomParameters] = useState({
    lead_time_buffer: 1.5,
    demand_forecast_accuracy: 0.85,
    supplier_reliability: 0.95,
    cost_of_capital: 0.12
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Generate reorder recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async (params: {
      product_id?: string;
      market_id?: string;
      service_level: number;
      custom_parameters: typeof customParameters;
      simulation_mode: boolean;
    }) => {
      const response = await fetch('/api/inventory/reorder-points/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to calculate reorder points');
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
    },
  });

  // Apply reorder point changes
  const applyChangesMutation = useMutation({
    mutationFn: async (changes: Array<{
      product_id: string;
      market_id: string;
      new_reorder_point: number;
      new_safety_stock: number;
    }>) => {
      const response = await fetch('/api/inventory/reorder-points/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes, simulation_mode: isSimulationMode }),
      });
      if (!response.ok) throw new Error('Failed to apply reorder point changes');
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
      setSelectedItems(new Set());
    },
  });

  // Get reorder point data for selected product/market combination
  const currentReorderData: ReorderPointData | null = useMemo(() => {
    if (!inventoryData?.reorder_point_data) return null;
    
    return inventoryData.reorder_point_data.find((item: ReorderPointData) => 
      item.product_id === selectedProduct && item.market_id === selectedMarket
    ) || null;
  }, [inventoryData, selectedProduct, selectedMarket]);

  // Generate cost-benefit chart data
  const costBenefitData = useMemo(() => {
    if (!currentReorderData) return [];
    
    return [
      {
        service_level: '95%',
        holding_cost: currentReorderData.cost_benefit_analysis.service_level_95.holding_cost,
        stockout_cost: currentReorderData.cost_benefit_analysis.service_level_95.stockout_risk * currentReorderData.stockout_cost,
        total_cost: currentReorderData.cost_benefit_analysis.service_level_95.total_cost,
        reorder_point: currentReorderData.cost_benefit_analysis.service_level_95.reorder_point
      },
      {
        service_level: '98%',
        holding_cost: currentReorderData.cost_benefit_analysis.service_level_98.holding_cost,
        stockout_cost: currentReorderData.cost_benefit_analysis.service_level_98.stockout_risk * currentReorderData.stockout_cost,
        total_cost: currentReorderData.cost_benefit_analysis.service_level_98.total_cost,
        reorder_point: currentReorderData.cost_benefit_analysis.service_level_98.reorder_point
      },
      {
        service_level: '99.5%',
        holding_cost: currentReorderData.cost_benefit_analysis.service_level_995.holding_cost,
        stockout_cost: currentReorderData.cost_benefit_analysis.service_level_995.stockout_risk * currentReorderData.stockout_cost,
        total_cost: currentReorderData.cost_benefit_analysis.service_level_995.total_cost,
        reorder_point: currentReorderData.cost_benefit_analysis.service_level_995.reorder_point
      }
    ];
  }, [currentReorderData]);

  // Generate demand variability chart data
  const demandVariabilityData = useMemo(() => {
    if (!currentReorderData) return [];
    
    // Simulate demand distribution
    const mean = currentReorderData.average_demand;
    const stdDev = mean * currentReorderData.demand_variability;
    
    return Array.from({ length: 30 }, (_, i) => {
      const x = mean * 0.5 + (i / 29) * (mean * 1.5 - mean * 0.5);
      const y = Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) / (stdDev * Math.sqrt(2 * Math.PI));
      
      return {
        demand: x,
        probability: y,
        is_safety_zone: x <= currentReorderData.recommended_reorder_point
      };
    });
  }, [currentReorderData]);

  const calculateReorderPoint = useCallback(() => {
    if (!selectedProduct || !selectedMarket) return;
    
    generateRecommendationsMutation.mutate({
      product_id: selectedProduct,
      market_id: selectedMarket,
      service_level: targetServiceLevel,
      custom_parameters: customParameters,
      simulation_mode: isSimulationMode
    });
  }, [selectedProduct, selectedMarket, targetServiceLevel, customParameters, isSimulationMode, generateRecommendationsMutation]);

  const calculateBulkReorderPoints = useCallback(() => {
    generateRecommendationsMutation.mutate({
      service_level: targetServiceLevel,
      custom_parameters: customParameters,
      simulation_mode: isSimulationMode
    });
  }, [targetServiceLevel, customParameters, isSimulationMode, generateRecommendationsMutation]);

  const applyRecommendations = useCallback(() => {
    if (!inventoryData?.reorder_point_data) return;
    
    const changes = inventoryData.reorder_point_data
      .filter((item: ReorderPointData) => 
        selectedItems.has(`${item.product_id}-${item.market_id}`) ||
        (!bulkUpdateMode && item.product_id === selectedProduct && item.market_id === selectedMarket)
      )
      .map((item: ReorderPointData) => ({
        product_id: item.product_id,
        market_id: item.market_id,
        new_reorder_point: item.recommended_reorder_point,
        new_safety_stock: item.safety_stock
      }));
    
    applyChangesMutation.mutate(changes);
  }, [inventoryData, selectedItems, bulkUpdateMode, selectedProduct, selectedMarket, applyChangesMutation]);

  const toggleItemSelection = useCallback((productId: string, marketId: string) => {
    const key = `${productId}-${marketId}`;
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    const market = markets.find(m => m.currency === currency);
    return new Intl.NumberFormat(market?.locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [markets]);

  const getServiceLevelColor = useCallback((level: number) => {
    if (level >= 99) return 'text-green-600 bg-green-50';
    if (level >= 98) return 'text-blue-600 bg-blue-50';
    if (level >= 95) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getStockStatusColor = useCallback((current: number, reorder: number) => {
    if (current <= reorder * 0.5) return 'text-red-600';
    if (current <= reorder) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CalculatorIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reorder Point Calculator</h2>
              <p className="text-sm text-gray-500">
                Dynamic safety stock calculation with lead time variability
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors text-sm',
                bulkUpdateMode
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {bulkUpdateMode ? 'Exit Bulk Mode' : 'Bulk Update'}
            </button>

            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <CogIcon className="h-4 w-4" />
              Advanced
            </button>
          </div>
        </div>

        {/* Selection Controls */}
        {!bulkUpdateMode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.flagEmoji} {market.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Service Level</label>
              <select
                value={targetServiceLevel}
                onChange={(e) => setTargetServiceLevel(parseFloat(e.target.value) as 95 | 98 | 99.5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={95}>95% - Standard</option>
                <option value={98}>98% - High</option>
                <option value={99.5}>99.5% - Critical</option>
              </select>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="border-t pt-6 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Parameters</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Lead Time Buffer</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={customParameters.lead_time_buffer}
                  onChange={(e) => setCustomParameters(prev => ({
                    ...prev,
                    lead_time_buffer: parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Forecast Accuracy</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1"
                  value={customParameters.demand_forecast_accuracy}
                  onChange={(e) => setCustomParameters(prev => ({
                    ...prev,
                    demand_forecast_accuracy: parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Supplier Reliability</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1"
                  value={customParameters.supplier_reliability}
                  onChange={(e) => setCustomParameters(prev => ({
                    ...prev,
                    supplier_reliability: parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Cost of Capital</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.25"
                  value={customParameters.cost_of_capital}
                  onChange={(e) => setCustomParameters(prev => ({
                    ...prev,
                    cost_of_capital: parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={bulkUpdateMode ? calculateBulkReorderPoints : calculateReorderPoint}
              disabled={generateRecommendationsMutation.isPending}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                generateRecommendationsMutation.isPending
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {generateRecommendationsMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              {bulkUpdateMode ? 'Calculate All' : 'Calculate Reorder Point'}
            </button>

            {(currentReorderData || selectedItems.size > 0) && (
              <button
                onClick={applyRecommendations}
                disabled={applyChangesMutation.isPending}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                  applyChangesMutation.isPending
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                {applyChangesMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                {isSimulationMode ? 'Simulate Changes' : 'Apply Changes'}
              </button>
            )}
          </div>

          {bulkUpdateMode && selectedItems.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedItems.size} items selected
            </div>
          )}
        </div>
      </div>

      {/* Current Reorder Point Analysis */}
      {currentReorderData && !bulkUpdateMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={cn(
                  'text-2xl font-bold',
                  getStockStatusColor(currentReorderData.current_stock, currentReorderData.current_reorder_point)
                )}>
                  {currentReorderData.current_stock}
                </div>
                <div className="text-sm text-gray-600">Current Stock</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentReorderData.current_reorder_point}
                </div>
                <div className="text-sm text-gray-600">Current Reorder Point</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentReorderData.recommended_reorder_point}
                </div>
                <div className="text-sm text-gray-600">Recommended</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentReorderData.safety_stock}
                </div>
                <div className="text-sm text-gray-600">Safety Stock</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Daily Demand:</span>
                <span className="font-medium">{currentReorderData.average_demand.toFixed(1)} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lead Time:</span>
                <span className="font-medium">{currentReorderData.lead_time_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lead Time Variability:</span>
                <span className="font-medium">{(currentReorderData.lead_time_variability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demand Variability:</span>
                <span className="font-medium">{(currentReorderData.demand_variability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Historical Stockouts:</span>
                <span className={cn(
                  'font-medium',
                  currentReorderData.historical_stockouts > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {currentReorderData.historical_stockouts} occurrences
                </span>
              </div>
            </div>
          </div>

          {/* Cost-Benefit Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost-Benefit Analysis</h3>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={costBenefitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service_level" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      formatCurrency(value, markets.find(m => m.id === selectedMarket)?.currency || 'USD'),
                      name === 'holding_cost' ? 'Holding Cost' : 
                      name === 'stockout_cost' ? 'Stockout Cost' : 'Total Cost'
                    ]}
                  />
                  <Bar dataKey="holding_cost" stackId="cost" fill="#3B82F6" name="Holding Cost" />
                  <Bar dataKey="stockout_cost" stackId="cost" fill="#EF4444" name="Stockout Cost" />
                  <ReferenceLine 
                    x={`${targetServiceLevel}%`} 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              {costBenefitData.map((level, index) => {
                const isSelected = level.service_level === `${targetServiceLevel}%`;
                return (
                  <div 
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border',
                      isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    )}
                  >
                    <div className="font-medium text-gray-900">{level.service_level}</div>
                    <div className="text-gray-600">ROP: {level.reorder_point}</div>
                    <div className="text-gray-600">
                      Total: {formatCurrency(level.total_cost, markets.find(m => m.id === selectedMarket)?.currency || 'USD')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Demand Variability Visualization */}
      {currentReorderData && !bulkUpdateMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Distribution & Safety Zone</h3>
          
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={demandVariabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="demand"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={(value) => `Demand: ${value.toFixed(0)} units`}
                  formatter={(value: any, name: string) => [
                    (value * 100).toFixed(2) + '%',
                    'Probability'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="probability" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                  name="Demand Distribution"
                />
                <ReferenceLine 
                  x={currentReorderData.recommended_reorder_point} 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: "Reorder Point", position: "topRight" }}
                />
                <ReferenceLine 
                  x={currentReorderData.average_demand} 
                  stroke="#6B7280" 
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  label={{ value: "Avg Demand", position: "topLeft" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Lead Time Demand</div>
              <div className="text-blue-700">
                {(currentReorderData.average_demand * currentReorderData.lead_time_days).toFixed(0)} units
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">Safety Stock Buffer</div>
              <div className="text-green-700">
                {currentReorderData.safety_stock} units
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">Service Level Target</div>
              <div className="text-purple-700">
                {targetServiceLevel}% ({(1 - targetServiceLevel/100) * 100}% stockout risk)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Mode - Product Matrix */}
      {bulkUpdateMode && inventoryData?.reorder_point_data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">All Products & Markets</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const allKeys = inventoryData.reorder_point_data.map((item: ReorderPointData) => 
                    `${item.product_id}-${item.market_id}`
                  );
                  setSelectedItems(new Set(allKeys));
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === inventoryData.reorder_point_data.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allKeys = inventoryData.reorder_point_data.map((item: ReorderPointData) => 
                            `${item.product_id}-${item.market_id}`
                          );
                          setSelectedItems(new Set(allKeys));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Market</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Current Stock</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Current ROP</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Recommended ROP</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Service Level</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryData.reorder_point_data.map((item: ReorderPointData) => {
                  const product = products.find(p => p.id === item.product_id);
                  const market = markets.find(m => m.id === item.market_id);
                  const itemKey = `${item.product_id}-${item.market_id}`;
                  const isSelected = selectedItems.has(itemKey);
                  const needsUpdate = item.current_reorder_point !== item.recommended_reorder_point;
                  
                  return (
                    <tr key={itemKey} className={cn('hover:bg-gray-50', isSelected && 'bg-blue-50')}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(item.product_id, item.market_id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: product?.color }}
                          />
                          <span className="font-medium">{product?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{market?.flagEmoji}</span>
                          <span>{market?.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={getStockStatusColor(item.current_stock, item.current_reorder_point)}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {item.current_reorder_point}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'font-medium',
                          needsUpdate ? 'text-blue-600' : 'text-gray-600'
                        )}>
                          {item.recommended_reorder_point}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getServiceLevelColor(item.service_level * 100)
                        )}>
                          {(item.service_level * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {needsUpdate ? (
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mx-auto" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}