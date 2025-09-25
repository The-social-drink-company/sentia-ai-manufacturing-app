'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  CubeIcon,
  ChartBarIcon,
  CalculatorIcon,
  LightBulbIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ProductMatrixView } from '@/components/inventory/ProductMatrixView';
import { ABCAnalysisChart } from '@/components/inventory/ABCAnalysisChart';
import { InventoryAgingHeatMap } from '@/components/inventory/InventoryAgingHeatMap';
import { WorkingCapitalCalculator } from '@/components/inventory/WorkingCapitalCalculator';
import { OptimizationRecommendationsPanel } from '@/components/inventory/OptimizationRecommendationsPanel';
import { ReorderPointCalculator } from '@/components/inventory/ReorderPointCalculator';
import { DeadStockIdentifier } from '@/components/inventory/DeadStockIdentifier';
import { SafetyStockOptimizer } from '@/components/inventory/SafetyStockOptimizer';
import { InventoryTurnoverAnalytics } from '@/components/inventory/InventoryTurnoverAnalytics';
import { AllocationEngine } from '@/components/inventory/AllocationEngine';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useInventoryOptimizationStore } from '@/stores/inventoryOptimizationStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface OptimizationScenario {
  id: string;
  name: string;
  description: string;
  created_at: string;
  parameters: {
    service_level: number;
    cost_of_capital: number;
    storage_cost_per_unit: number;
    stockout_penalty: number;
    lead_time_buffer: number;
  };
  results: {
    total_investment_change: number;
    working_capital_impact: number;
    service_level_improvement: number;
    carrying_cost_reduction: number;
    stockout_risk_reduction: number;
  };
  is_simulation: boolean;
}

const PRODUCTS: Product[] = [
  { id: 'sensio-red', name: 'Sensio Red', sku: 'SEN-RED-001', category: 'Premium', color: '#EF4444' },
  { id: 'sensio-black', name: 'Sensio Black', sku: 'SEN-BLK-001', category: 'Premium', color: '#1F2937' },
  { id: 'sensio-gold', name: 'Sensio Gold', sku: 'SEN-GLD-001', category: 'Luxury', color: '#F59E0B' },
];

const MARKETS: Market[] = [
  { id: 'uk', name: 'United Kingdom', code: 'UK', flagEmoji: '🇬🇧', currency: 'GBP', timezone: 'Europe/London', locale: 'en-GB' },
  { id: 'eu', name: 'European Union', code: 'EU', flagEmoji: '🇪🇺', currency: 'EUR', timezone: 'Europe/Amsterdam', locale: 'en-DE' },
  { id: 'us', name: 'United States', code: 'US', flagEmoji: '🇺🇸', currency: 'USD', timezone: 'America/New_York', locale: 'en-US' },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reorder' | 'deadstock' | 'safety' | 'turnover' | 'allocation'>('overview');
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Store for inventory optimization state
  const {
    optimizationScenarios,
    currentScenario,
    simulationResults,
    setCurrentScenario,
    saveScenario,
    deleteScenario,
    updateSimulationResults
  } = useInventoryOptimizationStore();

  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ['inventory-optimization'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/optimization-data');
      if (!response.ok) throw new Error('Failed to fetch inventory data');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time inventory updates
  const { lastMessage, connectionStatus } = useWebSocket('/ws/inventory-optimization', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'inventory_update' || data.type === 'optimization_complete') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing inventory WebSocket message:', error);
      }
    },
  });

  // Run optimization
  const runOptimizationMutation = useMutation({
    mutationFn: async (params: {
      scenario: OptimizationScenario;
      simulation_mode: boolean;
    }) => {
      setIsOptimizing(true);
      
      const response = await fetch('/api/inventory/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) throw new Error('Failed to run optimization');
      return response.json();
    },
    onSuccess: (data) => {
      if (isSimulationMode) {
        updateSimulationResults(data.results);
      } else {
        queryClient.invalidateQueries({ queryKey: ['inventory-optimization'] });
      }
      setIsOptimizing(false);
    },
    onError: () => {
      setIsOptimizing(false);
    },
  });

  // Export optimization results
  const exportResults = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: selectedScenario,
          include_recommendations: true,
          format: 'excel'
        }),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-optimization-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [selectedScenario]);

  const handleRunOptimization = useCallback(() => {
    if (!currentScenario) return;
    
    runOptimizationMutation.mutate({
      scenario: currentScenario,
      simulation_mode: isSimulationMode
    });
  }, [currentScenario, isSimulationMode, runOptimizationMutation]);

  const workingCapitalImpact = useMemo(() => {
    if (!inventoryData) return null;
    
    return {
      current_investment: inventoryData.total_inventory_value || 0,
      optimal_investment: inventoryData.optimal_inventory_value || 0,
      potential_savings: (inventoryData.total_inventory_value || 0) - (inventoryData.optimal_inventory_value || 0),
      service_level: inventoryData.current_service_level || 0,
      turnover_rate: inventoryData.average_turnover_rate || 0
    };
  }, [inventoryData]);

  if (isLoading && !inventoryData) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSkeleton className="p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </LoadingSkeleton>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Inventory Optimization Suite
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI-powered working capital management and inventory optimization
                    </p>
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {connectionStatus === 'connected' ? 'Live Data' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Simulation Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Simulation Mode
                  </label>
                  <button
                    onClick={() => setIsSimulationMode(!isSimulationMode)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
                      isSimulationMode ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        isSimulationMode ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* Run Optimization */}
                <button
                  onClick={handleRunOptimization}
                  disabled={isOptimizing || !currentScenario}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                    currentScenario && !isOptimizing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      {isSimulationMode ? 'Run Simulation' : 'Optimize Now'}
                    </>
                  )}
                </button>

                {/* Export */}
                <button
                  onClick={exportResults}
                  disabled={!inventoryData}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                    inventoryData
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Working Capital Impact Summary */}
        {workingCapitalImpact && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${(workingCapitalImpact.current_investment / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Investment</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(workingCapitalImpact.optimal_investment / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Optimal Investment</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${(workingCapitalImpact.potential_savings / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Potential Savings</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(workingCapitalImpact.service_level * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Service Level</div>
                </div>
                
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {workingCapitalImpact.turnover_rate.toFixed(1)}x
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Turnover Rate</div>
                </div>
              </div>

              {isSimulationMode && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Simulation Mode Active
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Changes will be simulated without affecting actual inventory levels. 
                    Review results before applying optimizations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview Tab - Dashboard */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Product Matrix View */}
              <ErrorBoundary>
                <ProductMatrixView 
                  products={PRODUCTS}
                  markets={MARKETS}
                  inventoryData={inventoryData}
                />
              </ErrorBoundary>

              {/* ABC Analysis */}
              <ErrorBoundary>
                <ABCAnalysisChart 
                  products={PRODUCTS}
                  inventoryData={inventoryData}
                />
              </ErrorBoundary>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Inventory Aging Heat Map */}
              <ErrorBoundary>
                <InventoryAgingHeatMap 
                  products={PRODUCTS}
                  markets={MARKETS}
                  inventoryData={inventoryData}
                />
              </ErrorBoundary>

              {/* Working Capital Calculator */}
              <ErrorBoundary>
                <WorkingCapitalCalculator 
                  inventoryData={inventoryData}
                  onScenarioUpdate={(scenario) => setCurrentScenario(scenario)}
                />
              </ErrorBoundary>
            </div>

            {/* Optimization Recommendations */}
            <ErrorBoundary>
              <OptimizationRecommendationsPanel 
                inventoryData={inventoryData}
                simulationResults={simulationResults}
                isSimulationMode={isSimulationMode}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-6">
            <div className="flex space-x-8">
              {[
                { id: 'overview' as const, label: 'Overview', icon: ChartBarIcon },
                { id: 'reorder' as const, label: 'Reorder Points', icon: CalculatorIcon },
                { id: 'deadstock' as const, label: 'Dead Stock', icon: ExclamationTriangleIcon },
                { id: 'safety' as const, label: 'Safety Stock', icon: CheckCircleIcon },
                { id: 'turnover' as const, label: 'Turnover Analysis', icon: ArrowPathIcon },
                { id: 'allocation' as const, label: 'Allocation Engine', icon: CogIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors',
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <ErrorBoundary>
            {activeTab === 'reorder' && (
              <ReorderPointCalculator
                products={PRODUCTS}
                markets={MARKETS}
                inventoryData={inventoryData}
                isSimulationMode={isSimulationMode}
                onUpdate={() => refetch()}
              />
            )}
            
            {activeTab === 'deadstock' && (
              <DeadStockIdentifier
                products={PRODUCTS}
                markets={MARKETS}
                inventoryData={inventoryData}
                isSimulationMode={isSimulationMode}
                onUpdate={() => refetch()}
              />
            )}
            
            {activeTab === 'safety' && (
              <SafetyStockOptimizer
                products={PRODUCTS}
                markets={MARKETS}
                inventoryData={inventoryData}
                isSimulationMode={isSimulationMode}
                onUpdate={() => refetch()}
              />
            )}
            
            {activeTab === 'turnover' && (
              <InventoryTurnoverAnalytics
                products={PRODUCTS}
                markets={MARKETS}
                inventoryData={inventoryData}
              />
            )}
            
            {activeTab === 'allocation' && (
              <AllocationEngine
                products={PRODUCTS}
                markets={MARKETS}
                inventoryData={inventoryData}
                isSimulationMode={isSimulationMode}
                onUpdate={() => refetch()}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}