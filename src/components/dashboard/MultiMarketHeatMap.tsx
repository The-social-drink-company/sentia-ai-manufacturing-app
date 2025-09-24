// Multi-Market Performance Heat Map with geographic visualization

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Maximize2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useMarkets, usePerformanceMetrics } from '@/hooks/useQueries';
import { useMarketSelectionStore } from '@/stores/marketSelectionStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { numberFormatter, dateTimeFormatter } from '@/lib/dataTransformers';
import { cn } from '@/lib/utils';

// Market performance data interface
interface MarketPerformance {
  marketId: string;
  marketName: string;
  marketCode: string;
  country: string;
  flagEmoji: string;
  region: 'UK' | 'EU' | 'US' | 'ASIA' | 'OTHER';
  coordinates: { lat: number; lng: number };
  performance: {
    revenue: { value: number; change: number; target: number };
    margin: { value: number; change: number; target: number };
    orders: { value: number; change: number; target: number };
    customers: { value: number; change: number; target: number };
  };
  overallScore: number; // 0-100 performance score
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: Date;
  trends: {
    revenue: number[];
    margin: number[];
    orders: number[];
  };
  keyIssues?: string[];
  opportunities?: string[];
}

interface MultiMarketHeatMapProps {
  isEditMode?: boolean;
  isFullscreen?: boolean;
  breakpoint?: string;
}

// Sample coordinates for visualization
const marketCoordinates: Record<string, { lat: number; lng: number }> = {
  'UK': { lat: 54.5, lng: -2 },
  'US': { lat: 39.8, lng: -98.5 },
  'EU': { lat: 54.5, lng: 15.2 },
  'ASIA': { lat: 35.8, lng: 104.1 },
};

export const MultiMarketHeatMap: React.FC<MultiMarketHeatMapProps> = ({
  isEditMode = false,
  isFullscreen = false,
  breakpoint = 'lg'
}) => {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [hoveredMarket, setHoveredMarket] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [marketPerformances, setMarketPerformances] = useState<MarketPerformance[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  const { activeMarket, actions: marketActions } = useMarketSelectionStore();

  // Fetch market data
  const {
    data: marketsData,
    isLoading: marketsLoading,
    refetch: refetchMarkets
  } = useMarkets();

  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance
  } = usePerformanceMetrics({});

  // WebSocket for real-time updates
  const { subscribe, unsubscribe } = useWebSocket({
    enabled: true,
  });

  // Subscribe to market performance updates
  useEffect(() => {
    const subscriptionId = subscribe(
      'market-performance',
      (message) => {
        updateMarketPerformance(message.data.marketId, message.data.performance);
        setLastRefresh(new Date());
      },
      { priority: 'medium' }
    );

    return () => unsubscribe(subscriptionId);
  }, [subscribe, unsubscribe]);

  // Generate market performance data
  const generateMarketPerformances = (markets: any[], performance: any): MarketPerformance[] => {
    if (!markets || markets.length === 0) return [];

    // Use REAL performance data from API - NO MOCK DATA
    // If performance data is not available, return empty structure
    if (!performanceData || !performanceData.markets) {
      return markets.map((market): MarketPerformance => {
        const coordinates = marketCoordinates[market.region] || { lat: 0, lng: 0 };

        return {
          marketId: market.id,
          marketName: market.name,
          marketCode: market.code,
          country: market.country,
          flagEmoji: market.flagEmoji,
          region: market.region,
          coordinates,
          performance: {
            revenue: { value: 0, change: 0, target: 0 },
            margin: { value: 0, change: 0, target: 0 },
            orders: { value: 0, change: 0, target: 0 },
            customers: { value: 0, change: 0, target: 0 }
          },
          overallScore: 0,
          status: 'warning' as const,
          lastUpdated: new Date(),
          trends: {
            revenue: [],
            margin: [],
            orders: []
          },
          keyIssues: ['Waiting for real market data'],
          opportunities: []
        };
      });
    }

    // Map real performance data from API
    return markets.map((market): MarketPerformance => {
      const marketData = performanceData.markets[market.id];
      const coordinates = marketCoordinates[market.region] || { lat: 0, lng: 0 };

      if (!marketData) {
        // No data for this market - return empty structure
        return {
          marketId: market.id,
          marketName: market.name,
          marketCode: market.code,
          country: market.country,
          flagEmoji: market.flagEmoji,
          region: market.region,
          coordinates,
          performance: {
            revenue: { value: 0, change: 0, target: 0 },
            margin: { value: 0, change: 0, target: 0 },
            orders: { value: 0, change: 0, target: 0 },
            customers: { value: 0, change: 0, target: 0 }
          },
          overallScore: 0,
          status: 'warning' as const,
          lastUpdated: new Date(),
          trends: {
            revenue: [],
            margin: [],
            orders: []
          },
          keyIssues: ['No data available for this market'],
          opportunities: []
        };
      }

      return {
        marketId: market.id,
        marketName: market.name,
        marketCode: market.code,
        country: market.country,
        flagEmoji: market.flagEmoji,
        region: market.region,
        coordinates,
        performance: marketData.performance,
        overallScore: marketData.overallScore,
        status: marketData.status,
        lastUpdated: new Date(marketData.lastUpdated),
        trends: marketData.trends,
        keyIssues: marketData.keyIssues || [],
        opportunities: marketData.opportunities || []
      };
    });
  };

  // REMOVED: generateTrendData function - NO MOCK DATA GENERATION
  // All trend data must come from real API sources

  // Update market performance
  const updateMarketPerformance = (marketId: string, newPerformance: any) => {
    setMarketPerformances(prev =>
      prev.map(market =>
        market.marketId === marketId
          ? { ...market, performance: { ...market.performance, ...newPerformance } }
          : market
      )
    );
  };

  // Initialize data
  useEffect(() => {
    setIsLoading(marketsLoading || performanceLoading);
    
    if (!marketsLoading && !performanceLoading && marketsData) {
      const performances = generateMarketPerformances(marketsData, performanceData);
      setMarketPerformances(performances);
    }
  }, [marketsData, performanceData, marketsLoading, performanceLoading]);

  // Get performance color
  const getPerformanceColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get status styling
  const getStatusStyling = (status: MarketPerformance['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Handle market selection
  const handleMarketClick = (marketId: string) => {
    const market = marketsData?.find(m => m.id === marketId);
    if (market) {
      marketActions.selectMarket(market);
      setSelectedMarket(marketId);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([refetchMarkets(), refetchPerformance()]);
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-full p-6">
        <LoadingSkeleton>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </LoadingSkeleton>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Multi-Market Performance
          </h2>
          
          {lastRefresh && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="h-8 px-3 text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              Map
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3 text-xs"
            >
              <Package className="h-3 w-3 mr-1" />
              Grid
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
          {/* World Map Background */}
          <div
            ref={mapRef}
            className="relative h-80 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-gray-700 dark:to-gray-800"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Market Points */}
            {marketPerformances.map((market) => {
              const isHovered = hoveredMarket === market.marketId;
              const isSelected = selectedMarket === market.marketId || activeMarket?.id === market.marketId;
              
              // Convert coordinates to percentage positions (simplified projection)
              const x = ((market.coordinates.lng + 180) / 360) * 100;
              const y = ((90 - market.coordinates.lat) / 180) * 100;

              return (
                <div
                  key={market.marketId}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                  onClick={() => handleMarketClick(market.marketId)}
                  onMouseEnter={() => setHoveredMarket(market.marketId)}
                  onMouseLeave={() => setHoveredMarket(null)}
                >
                  {/* Market Point */}
                  <div className={cn(
                    'relative w-12 h-12 rounded-full border-4 border-white dark:border-gray-700 transition-all duration-200',
                    getPerformanceColor(market.overallScore),
                    isHovered && 'scale-125 shadow-lg',
                    isSelected && 'ring-4 ring-blue-400 ring-opacity-50'
                  )}>
                    {/* Flag Emoji */}
                    <div className="absolute inset-0 flex items-center justify-center text-lg">
                      {market.flagEmoji}
                    </div>
                    
                    {/* Performance Score */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-700">
                      {market.overallScore}
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-72 z-10">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {market.marketName}
                          </h3>
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium border',
                            getStatusStyling(market.status)
                          )}>
                            {market.status.toUpperCase()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">
                                  {numberFormatter.formatCurrency(market.performance.revenue.value, 'GBP', { compact: true })}
                                </span>
                                <span className={cn(
                                  'text-xs',
                                  market.performance.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {market.performance.revenue.change >= 0 ? '+' : ''}{market.performance.revenue.change.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Margin</span>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">
                                  {numberFormatter.formatPercentage(market.performance.margin.value * 100)}
                                </span>
                                <span className={cn(
                                  'text-xs',
                                  market.performance.margin.change >= 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {market.performance.margin.change >= 0 ? '+' : ''}{market.performance.margin.change.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Orders</span>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">
                                  {numberFormatter.formatNumber(market.performance.orders.value)}
                                </span>
                                <span className={cn(
                                  'text-xs',
                                  market.performance.orders.change >= 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {market.performance.orders.change >= 0 ? '+' : ''}{market.performance.orders.change.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Customers</span>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">
                                  {numberFormatter.formatNumber(market.performance.customers.value)}
                                </span>
                                <span className={cn(
                                  'text-xs',
                                  market.performance.customers.change >= 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {market.performance.customers.change >= 0 ? '+' : ''}{market.performance.customers.change.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {market.keyIssues && market.keyIssues.length > 0 && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Key Issues</p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {market.keyIssues.map((issue, index) => (
                                    <li key={index}>• {issue}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">Performance Score</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Excellent (85-100)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Good (70-84)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Warning (50-69)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Critical (<50)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketPerformances.map((market) => {
            const isSelected = selectedMarket === market.marketId || activeMarket?.id === market.marketId;
            
            return (
              <div
                key={market.marketId}
                onClick={() => handleMarketClick(market.marketId)}
                className={cn(
                  'p-4 bg-white dark:bg-gray-800 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{market.flagEmoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {market.marketCode}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {market.country}
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium border',
                    getStatusStyling(market.status)
                  )}>
                    {market.overallScore}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">
                        {numberFormatter.formatCurrency(market.performance.revenue.value, 'GBP', { compact: true })}
                      </span>
                      {market.performance.revenue.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Margin</span>
                    <span className="font-medium">
                      {numberFormatter.formatPercentage(market.performance.margin.value * 100)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Orders</span>
                    <span className="font-medium">
                      {numberFormatter.formatNumber(market.performance.orders.value)}
                    </span>
                  </div>
                </div>

                {/* Issues/Opportunities */}
                {(market.keyIssues?.length || market.opportunities?.length) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {market.keyIssues && market.keyIssues.length > 0 && (
                      <div className="flex items-start space-x-1 mb-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {market.keyIssues.length} issue{market.keyIssues.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    {market.opportunities && market.opportunities.length > 0 && (
                      <div className="flex items-start space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {market.opportunities.length} opportunit{market.opportunities.length > 1 ? 'ies' : 'y'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {marketPerformances.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Markets</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {marketPerformances.filter(m => m.status === 'excellent').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Excellent</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {marketPerformances.filter(m => m.status === 'warning').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">At Risk</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(marketPerformances.reduce((sum, m) => sum + m.overallScore, 0) / marketPerformances.length)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
        </div>
      </div>
    </div>
  );
};