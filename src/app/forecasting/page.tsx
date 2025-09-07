'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChartBarIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { DemandPredictionEngine } from '@/components/forecasting/DemandPredictionEngine';
import { ScenarioModelingWorkspace } from '@/components/forecasting/ScenarioModelingWorkspace';
import { AIExplanationPanel } from '@/components/forecasting/AIExplanationPanel';
import { ModelPerformanceTracking } from '@/components/forecasting/ModelPerformanceTracking';
import { ForecastingTimeline } from '@/components/forecasting/ForecastingTimeline';
import MCPEnsembleIntegration from '@/components/forecasting/MCPEnsembleIntegration';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useForecastingStore } from '@/stores/forecastingStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
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
}

type TimeRange = '1m' | '3m' | '6m' | '12m';
type ViewMode = 'single' | 'comparison' | 'overlay';

const PRODUCTS: Product[] = [
  { id: 'sensio-red', name: 'Sensio Red', sku: 'SEN-RED-001', category: 'Premium', color: '#EF4444' },
  { id: 'sensio-black', name: 'Sensio Black', sku: 'SEN-BLK-001', category: 'Premium', color: '#1F2937' },
  { id: 'sensio-gold', name: 'Sensio Gold', sku: 'SEN-GLD-001', category: 'Luxury', color: '#F59E0B' },
];

const MARKETS: Market[] = [
  { id: 'uk', name: 'United Kingdom', code: 'UK', flagEmoji: '🇬🇧', currency: 'GBP' },
  { id: 'eu', name: 'European Union', code: 'EU', flagEmoji: '🇪🇺', currency: 'EUR' },
  { id: 'us', name: 'United States', code: 'US', flagEmoji: '🇺🇸', currency: 'USD' },
];

export default function ForecastingPage() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'scenarios' | 'explanations' | 'performance' | 'mcp-ensemble'>('predictions');
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set(['sensio-red']));
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set(['uk', 'us']));
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);
  const [showSeasonality, setShowSeasonality] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Forecasting store for state management
  const {
    currentScenario,
    savedScenarios,
    modelMetrics,
    setCurrentScenario,
    saveScenario,
    deleteScenario,
    updateModelMetrics
  } = useForecastingStore();

  // Fetch forecasting data
  const { data: forecastData, isLoading, refetch } = useQuery({
    queryKey: ['forecasting-data', Array.from(selectedProducts), Array.from(selectedMarkets), timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        products: Array.from(selectedProducts).join(','),
        markets: Array.from(selectedMarkets).join(','),
        timeRange,
      });
      
      const response = await fetch(`/api/forecasting/data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecasting data');
      return response.json();
    },
    refetchInterval: isAutoRefresh ? 60000 : false,
  });

  // Real-time updates
  const { lastMessage, connectionStatus } = useWebSocket('/ws/forecasting', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'forecast_update' || data.type === 'model_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing forecasting WebSocket message:', error);
      }
    },
  });

  const handleProductToggle = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet.size > 0 ? newSet : new Set([productId]);
    });
  }, []);

  const handleMarketToggle = useCallback((marketId: string) => {
    setSelectedMarkets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(marketId)) {
        newSet.delete(marketId);
      } else {
        newSet.add(marketId);
      }
      return newSet.size > 0 ? newSet : new Set([marketId]);
    });
  }, []);

  const handleExportForecast = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        products: Array.from(selectedProducts).join(','),
        markets: Array.from(selectedMarkets).join(','),
        timeRange,
        format: 'excel',
      });
      
      const response = await fetch(`/api/forecasting/export?${params}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [selectedProducts, selectedMarkets, timeRange]);

  const selectedProductsData = useMemo(() => {
    return PRODUCTS.filter(p => selectedProducts.has(p.id));
  }, [selectedProducts]);

  const selectedMarketsData = useMemo(() => {
    return MARKETS.filter(m => selectedMarkets.has(m.id));
  }, [selectedMarkets]);

  if (isLoading && !forecastData) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSkeleton className="p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
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
                  <SparklesIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      AI Forecasting Command Center
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Advanced ML-powered demand prediction and scenario modeling
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
                    {connectionStatus === 'connected' ? 'Live ML Models' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Auto Refresh Toggle */}
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={cn(
                    'p-2 rounded-lg transition-colors flex items-center gap-2',
                    isAutoRefresh 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  title={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                >
                  {isAutoRefresh ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  <span className="text-sm">Auto</span>
                </button>

                {/* Export */}
                <button
                  onClick={handleExportForecast}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Time Range */}
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Range:</span>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {(['1m', '3m', '6m', '12m'] as TimeRange[]).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        timeRange === range
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      {range === '1m' ? '1 Month' : 
                       range === '3m' ? '3 Months' : 
                       range === '6m' ? '6 Months' : '12 Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Selection */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Products:</span>
                <div className="flex space-x-2">
                  {PRODUCTS.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleProductToggle(product.id)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg border-2 transition-colors flex items-center gap-2',
                        selectedProducts.has(product.id)
                          ? 'border-current text-white shadow-sm'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      )}
                      style={selectedProducts.has(product.id) ? { backgroundColor: product.color, borderColor: product.color } : {}}
                    >
                      <div 
                        className="w-3 h-3 rounded-full border border-white" 
                        style={{ backgroundColor: product.color }}
                      />
                      {product.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Selection */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Markets:</span>
                <div className="flex space-x-2">
                  {MARKETS.map(market => (
                    <button
                      key={market.id}
                      onClick={() => handleMarketToggle(market.id)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-2',
                        selectedMarkets.has(market.id)
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <span className="text-lg">{market.flagEmoji}</span>
                      {market.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Options */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowConfidenceIntervals(!showConfidenceIntervals)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                    showConfidenceIntervals
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {showConfidenceIntervals ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                  Confidence
                </button>
                
                <button
                  onClick={() => setShowSeasonality(!showSeasonality)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                    showSeasonality
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {showSeasonality ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                  Seasonality
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Timeline Chart */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <ErrorBoundary>
            <ForecastingTimeline
              products={selectedProductsData}
              markets={selectedMarketsData}
              timeRange={timeRange}
              viewMode={viewMode}
              showConfidenceIntervals={showConfidenceIntervals}
              showSeasonality={showSeasonality}
              forecastData={forecastData}
              onViewModeChange={setViewMode}
            />
          </ErrorBoundary>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-6">
            <div className="flex space-x-8">
              {[
                { id: 'predictions' as const, label: 'AI Predictions', icon: SparklesIcon },
                { id: 'scenarios' as const, label: 'Scenario Modeling', icon: AdjustmentsHorizontalIcon },
                { id: 'explanations' as const, label: 'AI Explanations', icon: DocumentChartBarIcon },
                { id: 'performance' as const, label: 'Model Performance', icon: CpuChipIcon },
                { id: 'mcp-ensemble' as const, label: 'MCP Ensemble', icon: BoltIcon },
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
            {activeTab === 'predictions' && (
              <DemandPredictionEngine
                products={selectedProductsData}
                markets={selectedMarketsData}
                timeRange={timeRange}
                forecastData={forecastData}
                onForecastUpdate={() => refetch()}
              />
            )}
            
            {activeTab === 'scenarios' && (
              <ScenarioModelingWorkspace
                products={selectedProductsData}
                markets={selectedMarketsData}
                timeRange={timeRange}
                currentScenario={currentScenario}
                savedScenarios={savedScenarios}
                onScenarioChange={setCurrentScenario}
                onSaveScenario={saveScenario}
                onDeleteScenario={deleteScenario}
              />
            )}
            
            {activeTab === 'explanations' && (
              <AIExplanationPanel
                products={selectedProductsData}
                markets={selectedMarketsData}
                forecastData={forecastData}
                currentScenario={currentScenario}
              />
            )}
            
            {activeTab === 'performance' && (
              <ModelPerformanceTracking
                products={selectedProductsData}
                markets={selectedMarketsData}
                timeRange={timeRange}
                modelMetrics={modelMetrics}
                onMetricsUpdate={updateModelMetrics}
              />
            )}
            
            {activeTab === 'mcp-ensemble' && (
              <MCPEnsembleIntegration />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}