'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  GlobeAmericasIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CurrencyDollarIcon,
  ClockIcon,
  Bars3Icon,
  ViewColumnsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { InventoryManagementGrid } from '@/components/operations/InventoryManagementGrid';
import { LeadTimeVarianceChart } from '@/components/operations/LeadTimeVarianceChart';
import { CrossMarketArbitrageDetector } from '@/components/operations/CrossMarketArbitrageDetector';
import { SupplierPerformanceDashboard } from '@/components/operations/SupplierPerformanceDashboard';
import { CurrencyConverter } from '@/components/operations/CurrencyConverter';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
  timezone: string;
  locale: string;
}

type ViewMode = 'tabs' | 'split' | 'unified';

const MARKETS: Market[] = [
  {
    id: 'uk',
    name: 'United Kingdom',
    code: 'UK',
    flagEmoji: '🇬🇧',
    currency: 'GBP',
    timezone: 'Europe/London',
    locale: 'en-GB'
  },
  {
    id: 'eu',
    name: 'European Union',
    code: 'EU',
    flagEmoji: '🇪🇺',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    locale: 'en-DE'
  },
  {
    id: 'us',
    name: 'United States',
    code: 'US',
    flagEmoji: '🇺🇸',
    currency: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US'
  }
];

export default function OperationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [activeMarket, setActiveMarket] = useState<string>('uk');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['uk', 'us']);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Real-time synchronization
  const { lastMessage, connectionStatus } = useWebSocket('/ws/operations', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        
        switch (data.type) {
          case 'inventory_update':
          case 'order_flow_update':
          case 'currency_rate_update':
          case 'market_status_update':
            setLastSyncTime(new Date());
            break;
          case 'sync_conflict':
            // Handle simultaneous edit conflicts
            console.warn('Sync conflict detected:', data.conflict);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
  });

  // Fetch market status data
  const { data: marketStatus, isLoading } = useQuery({
    queryKey: ['market-status'],
    queryFn: async () => {
      const response = await fetch('/api/operations/market-status');
      if (!response.ok) throw new Error('Failed to fetch market status');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getCurrentTime = useCallback((timezone: string, locale: string) => {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  }, []);

  const formatMarketTime = useCallback((market: Market) => {
    const time = getCurrentTime(market.timezone, market.locale);
    const date = new Intl.DateTimeFormat(market.locale, {
      timeZone: market.timezone,
      month: 'short',
      day: 'numeric',
    }).format(new Date());
    
    return { time, date };
  }, [getCurrentTime]);

  const handleMarketSelect = useCallback((marketId: string) => {
    if (viewMode === 'tabs') {
      setActiveMarket(marketId);
    } else if (viewMode === 'split') {
      setSelectedMarkets(prev => {
        if (prev.includes(marketId)) {
          return prev.filter(id => id !== marketId);
        } else if (prev.length < 2) {
          return [...prev, marketId];
        } else {
          return [prev[1], marketId];
        }
      });
    }
  }, [viewMode]);

  const getMarketData = useCallback((marketId: string) => {
    return MARKETS.find(m => m.id === marketId);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSkeleton className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Multi-Market Operations Center
                </h1>
                
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {connectionStatus === 'connected' ? 'Live Sync' : 'Offline'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* View Mode Selector */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('tabs')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                      viewMode === 'tabs'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <Bars3Icon className="h-4 w-4" />
                    Tabs
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                      viewMode === 'split'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                    Split
                  </button>
                  <button
                    onClick={() => setViewMode('unified')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                      viewMode === 'unified'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <ViewColumnsIcon className="h-4 w-4" />
                    Unified
                  </button>
                </div>

                {/* Currency Converter Toggle */}
                <button
                  onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                  className={cn(
                    'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                    showCurrencyConverter
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Currency
                </button>

                {/* Sync Status */}
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Force refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Market Selector / Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-6">
            {viewMode === 'tabs' && (
              <div className="flex space-x-8">
                {MARKETS.map((market) => {
                  const timeInfo = formatMarketTime(market);
                  const isActive = activeMarket === market.id;
                  
                  return (
                    <button
                      key={market.id}
                      onClick={() => handleMarketSelect(market.id)}
                      className={cn(
                        'flex items-center space-x-3 py-4 border-b-2 transition-colors',
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      )}
                    >
                      <span className="text-2xl">{market.flagEmoji}</span>
                      <div className="text-left">
                        <div className="font-medium">{market.name}</div>
                        <div className="text-xs flex items-center gap-2">
                          <ClockIcon className="h-3 w-3" />
                          {timeInfo.time} • {timeInfo.date}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === 'split' && (
              <div className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Compare Markets:
                    </span>
                    <div className="flex space-x-2">
                      {MARKETS.map((market) => {
                        const isSelected = selectedMarkets.includes(market.id);
                        const timeInfo = formatMarketTime(market);
                        
                        return (
                          <button
                            key={market.id}
                            onClick={() => handleMarketSelect(market.id)}
                            disabled={!isSelected && selectedMarkets.length >= 2}
                            className={cn(
                              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
                              isSelected
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700'
                                : selectedMarkets.length >= 2
                                ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            )}
                          >
                            <span className="text-lg">{market.flagEmoji}</span>
                            <div>
                              <div className="font-medium">{market.code}</div>
                              <div className="text-xs">{timeInfo.time}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Select up to 2 markets to compare
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'unified' && (
              <div className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      All Markets View:
                    </span>
                    {MARKETS.map((market) => {
                      const timeInfo = formatMarketTime(market);
                      
                      return (
                        <div key={market.id} className="flex items-center space-x-2 text-sm">
                          <span className="text-lg">{market.flagEmoji}</span>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {market.code}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              {timeInfo.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Inventory Management Grid */}
            <ErrorBoundary>
              <InventoryManagementGrid 
                viewMode={viewMode}
                activeMarket={viewMode === 'tabs' ? activeMarket : undefined}
                selectedMarkets={viewMode === 'split' ? selectedMarkets : undefined}
                markets={MARKETS}
              />
            </ErrorBoundary>

            {/* Analytics Row */}
            <div className={cn(
              'grid gap-6',
              viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'
            )}>
              {/* Lead Time Variance Chart */}
              <ErrorBoundary>
                <LeadTimeVarianceChart 
                  viewMode={viewMode}
                  activeMarket={viewMode === 'tabs' ? activeMarket : undefined}
                  selectedMarkets={viewMode === 'split' ? selectedMarkets : MARKETS.map(m => m.id)}
                  markets={MARKETS}
                />
              </ErrorBoundary>

              {/* Cross-Market Arbitrage Detector */}
              <ErrorBoundary>
                <CrossMarketArbitrageDetector 
                  markets={MARKETS}
                />
              </ErrorBoundary>
            </div>

            {/* Supplier Performance Dashboard */}
            <ErrorBoundary>
              <SupplierPerformanceDashboard 
                viewMode={viewMode}
                activeMarket={viewMode === 'tabs' ? activeMarket : undefined}
                selectedMarkets={viewMode === 'split' ? selectedMarkets : MARKETS.map(m => m.id)}
                markets={MARKETS}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Currency Converter Floating Widget */}
        {showCurrencyConverter && (
          <div className="fixed bottom-6 right-6 z-50">
            <CurrencyConverter 
              markets={MARKETS}
              onClose={() => setShowCurrencyConverter(false)}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}