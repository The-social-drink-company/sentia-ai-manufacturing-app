// KPI Section with 6 primary metrics and trend analysis

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Target,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Minus,
  RefreshCw,
  Calendar,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Progress } from '@/components/ui/Progress/Progress';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useRevenueAnalytics, usePerformanceMetrics } from '@/hooks/useQueries';
import { useMarketSelectionStore } from '@/stores/marketSelectionStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { numberFormatter, statisticalCalculator } from '@/lib/dataTransformers';
import { cn } from '@/lib/utils';

// KPI data interfaces
interface KPIMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  format: 'currency' | 'percentage' | 'number' | 'ratio' | 'days';
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  lastUpdated: Date;
  confidence?: number;
  breakdown?: Array<{ label: string; value: number; change: number }>;
}

interface KPISectionProps {
  isEditMode?: boolean;
  isFullscreen?: boolean;
  breakpoint?: string;
}

// Period toggle options
type PeriodOption = 'MTD' | 'QTD' | 'YTD';

export const KPISection: React.FC<KPISectionProps> = ({
  isEditMode = false,
  isFullscreen = false,
  breakpoint = 'lg'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('MTD');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);

  const { activeMarket } = useMarketSelectionStore();

  // Fetch data
  const {
    data: revenueData,
    isLoading: revenueLoading,
    refetch: refetchRevenue
  } = useRevenueAnalytics(selectedPeriod.toLowerCase(), activeMarket?.id);

  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance
  } = usePerformanceMetrics({
    market: activeMarket?.id,
    period: selectedPeriod.toLowerCase()
  });

  // WebSocket for real-time updates
  const { subscribe, unsubscribe } = useWebSocket({
    enabled: true,
  });

  // Subscribe to real-time KPI updates
  useEffect(() => {
    const subscriptionId = subscribe(
      'kpi-updates',
      (message) => {
        if (message.data.marketId === activeMarket?.id) {
          updateKPIMetrics(message.data.metrics);
          setLastRefresh(new Date());
        }
      },
      { priority: 'high' }
    );

    return () => unsubscribe(subscriptionId);
  }, [activeMarket?.id, subscribe, unsubscribe]);

  // Generate KPI metrics from data
  const generateKPIMetrics = (revenue: any, performance: any): KPIMetric[] => {
    const mockData = {
      workingCapital: { current: 2500000, previous: 2300000, target: 2800000 },
      revenue: { current: revenue?.total || 15600000, previous: 14200000, target: 16000000 },
      grossMargin: { current: 0.34, previous: 0.32, target: 0.35 },
      inventoryTurnover: { current: 8.2, previous: 7.8, target: 9.0 },
      cashConversionCycle: { current: 45, previous: 52, target: 40 },
      forecastAccuracy: { current: 0.87, previous: 0.84, target: 0.90 }
    };

    return [
      {
        id: 'working-capital',
        label: 'Total Working Capital',
        value: mockData.workingCapital.current,
        previousValue: mockData.workingCapital.previous,
        target: mockData.workingCapital.target,
        unit: 'GBP',
        format: 'currency',
        trend: mockData.workingCapital.current > mockData.workingCapital.previous ? 'up' : 'down',
        changePercent: ((mockData.workingCapital.current - mockData.workingCapital.previous) / mockData.workingCapital.previous) * 100,
        status: mockData.workingCapital.current >= mockData.workingCapital.target * 0.95 ? 'excellent' : 'good',
        icon: DollarSign,
        description: '30-day trend shows steady growth in available capital',
        lastUpdated: new Date(),
        confidence: 95,
        breakdown: [
          { label: 'Current Assets', value: 3800000, change: 5.2 },
          { label: 'Current Liabilities', value: 1300000, change: -2.1 },
        ]
      },
      {
        id: 'revenue',
        label: `Revenue (${selectedPeriod})`,
        value: mockData.revenue.current,
        previousValue: mockData.revenue.previous,
        target: mockData.revenue.target,
        unit: 'GBP',
        format: 'currency',
        trend: mockData.revenue.current > mockData.revenue.previous ? 'up' : 'down',
        changePercent: ((mockData.revenue.current - mockData.revenue.previous) / mockData.revenue.previous) * 100,
        status: mockData.revenue.current >= mockData.revenue.target * 0.9 ? 'excellent' : 'good',
        icon: BarChart3,
        description: `${selectedPeriod} performance tracking above expectations`,
        lastUpdated: new Date(),
        confidence: 92,
        breakdown: [
          { label: 'Product Sales', value: 12400000, change: 8.5 },
          { label: 'Service Revenue', value: 3200000, change: 12.3 },
        ]
      },
      {
        id: 'gross-margin',
        label: 'Gross Margin',
        value: mockData.grossMargin.current,
        previousValue: mockData.grossMargin.previous,
        target: mockData.grossMargin.target,
        unit: '%',
        format: 'percentage',
        trend: mockData.grossMargin.current > mockData.grossMargin.previous ? 'up' : 'down',
        changePercent: ((mockData.grossMargin.current - mockData.grossMargin.previous) / mockData.grossMargin.previous) * 100,
        status: mockData.grossMargin.current >= mockData.grossMargin.target * 0.95 ? 'excellent' : 
               mockData.grossMargin.current >= mockData.grossMargin.target * 0.85 ? 'good' : 'warning',
        icon: Target,
        description: 'Margin improvement driven by cost optimization',
        lastUpdated: new Date(),
        confidence: 88,
        breakdown: [
          { label: 'Direct Costs', value: 0.66, change: -2.8 },
          { label: 'Manufacturing', value: 0.58, change: -3.2 },
        ]
      },
      {
        id: 'inventory-turnover',
        label: 'Inventory Turnover',
        value: mockData.inventoryTurnover.current,
        previousValue: mockData.inventoryTurnover.previous,
        target: mockData.inventoryTurnover.target,
        unit: 'x',
        format: 'ratio',
        trend: mockData.inventoryTurnover.current > mockData.inventoryTurnover.previous ? 'up' : 'down',
        changePercent: ((mockData.inventoryTurnover.current - mockData.inventoryTurnover.previous) / mockData.inventoryTurnover.previous) * 100,
        status: mockData.inventoryTurnover.current >= mockData.inventoryTurnover.target * 0.9 ? 'excellent' : 'good',
        icon: Package,
        description: 'Efficient inventory management across markets',
        lastUpdated: new Date(),
        confidence: 90,
        breakdown: [
          { label: 'Raw Materials', value: 12.5, change: 8.2 },
          { label: 'Finished Goods', value: 6.8, change: 4.1 },
        ]
      },
      {
        id: 'cash-conversion',
        label: 'Cash Conversion Cycle',
        value: mockData.cashConversionCycle.current,
        previousValue: mockData.cashConversionCycle.previous,
        target: mockData.cashConversionCycle.target,
        unit: 'days',
        format: 'days',
        trend: mockData.cashConversionCycle.current < mockData.cashConversionCycle.previous ? 'up' : 'down', // Lower is better
        changePercent: Math.abs(((mockData.cashConversionCycle.current - mockData.cashConversionCycle.previous) / mockData.cashConversionCycle.previous) * 100),
        status: mockData.cashConversionCycle.current <= mockData.cashConversionCycle.target ? 'excellent' : 
               mockData.cashConversionCycle.current <= mockData.cashConversionCycle.target * 1.15 ? 'good' : 'warning',
        icon: Clock,
        description: 'Improved cash flow cycle timing',
        lastUpdated: new Date(),
        confidence: 85,
        breakdown: [
          { label: 'Days Sales Outstanding', value: 28, change: -5.2 },
          { label: 'Days Payable Outstanding', value: 35, change: 8.1 },
        ]
      },
      {
        id: 'forecast-accuracy',
        label: 'Forecast Accuracy Score',
        value: mockData.forecastAccuracy.current,
        previousValue: mockData.forecastAccuracy.previous,
        target: mockData.forecastAccuracy.target,
        unit: '%',
        format: 'percentage',
        trend: mockData.forecastAccuracy.current > mockData.forecastAccuracy.previous ? 'up' : 'down',
        changePercent: ((mockData.forecastAccuracy.current - mockData.forecastAccuracy.previous) / mockData.forecastAccuracy.previous) * 100,
        status: mockData.forecastAccuracy.current >= mockData.forecastAccuracy.target * 0.95 ? 'excellent' : 'good',
        icon: TrendingUp,
        description: 'AI-powered forecasting showing high accuracy',
        lastUpdated: new Date(),
        confidence: 93,
        breakdown: [
          { label: 'Demand Forecast', value: 0.89, change: 4.2 },
          { label: 'Revenue Forecast', value: 0.85, change: 2.8 },
        ]
      }
    ];
  };

  // Update KPI metrics
  const updateKPIMetrics = (newMetrics?: any) => {
    const metrics = generateKPIMetrics(revenueData, performanceData);
    setKpiMetrics(metrics);
  };

  // Initialize and update metrics
  useEffect(() => {
    setIsLoading(revenueLoading || performanceLoading);
    
    if (!revenueLoading && !performanceLoading) {
      updateKPIMetrics();
    }
  }, [revenueData, performanceData, revenueLoading, performanceLoading, selectedPeriod]);

  // Format value based on type
  const formatValue = (metric: KPIMetric): string => {
    switch (metric.format) {
      case 'currency':
        return numberFormatter.formatCurrency(metric.value, metric.unit, { compact: true });
      case 'percentage':
        return numberFormatter.formatPercentage(metric.value * 100, { decimals: 1 });
      case 'ratio':
        return `${metric.value.toFixed(1)}${metric.unit}`;
      case 'days':
        return `${Math.round(metric.value)} ${metric.unit}`;
      default:
        return numberFormatter.formatNumber(metric.value, { compact: true });
    }
  };

  // Get status styling
  const getStatusStyling = (status: KPIMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: KPIMetric['trend'], isReverse: boolean = false) => {
    if (!trend) return <Minus className="h-4 w-4" />;
    
    const actualTrend = isReverse ? (trend === 'up' ? 'down' : 'up') : trend;
    
    switch (actualTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([refetchRevenue(), refetchPerformance()]);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
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
            Key Performance Indicators
          </h2>
          
          {lastRefresh && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Period Toggles for Revenue */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {(['MTD', 'QTD', 'YTD'] as PeriodOption[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="h-8 px-3 text-xs"
              >
                {period}
              </Button>
            ))}
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

      {/* KPI Grid */}
      <div className={cn(
        'grid gap-4',
        breakpoint === 'lg' || breakpoint === 'md' ? 'grid-cols-3' :
        breakpoint === 'sm' ? 'grid-cols-2' : 'grid-cols-1'
      )}>
        {kpiMetrics.map((metric) => (
          <div
            key={metric.id}
            className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
          >
            {/* Status Indicator */}
            <div className={cn(
              'absolute top-4 right-4 w-2 h-2 rounded-full',
              getStatusStyling(metric.status).replace('text-', 'bg-').split(' ')[0]
            )} />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  getStatusStyling(metric.status)
                )}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {metric.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Value and Change */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatValue(metric)}
                </span>
                
                {metric.changePercent && (
                  <div className="flex items-center space-x-1 text-sm">
                    {getTrendIcon(metric.trend, metric.id === 'cash-conversion')}
                    <span className={cn(
                      'font-medium',
                      metric.trend === 'up' ? 
                        (metric.id === 'cash-conversion' ? 'text-red-600' : 'text-green-600') :
                        (metric.id === 'cash-conversion' ? 'text-green-600' : 'text-red-600')
                    )}>
                      {Math.abs(metric.changePercent).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress to Target */}
              {metric.target && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Target Progress</span>
                    <span className="font-medium">
                      {formatValue({ ...metric, value: metric.target })}
                    </span>
                  </div>
                  <Progress
                    value={Math.min((metric.value / metric.target) * 100, 100)}
                    className="h-2"
                  />
                </div>
              )}

              {/* Confidence Score */}
              {metric.confidence && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Confidence</span>
                  <span>{metric.confidence}%</span>
                </div>
              )}
            </div>

            {/* Breakdown on Hover */}
            {metric.breakdown && (
              <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    Breakdown
                  </h4>
                  {metric.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {metric.format === 'currency' ? 
                            numberFormatter.formatCurrency(item.value, metric.unit, { compact: true }) :
                            metric.format === 'percentage' ?
                            numberFormatter.formatPercentage(item.value * 100, { decimals: 1 }) :
                            item.value.toFixed(1)
                          }
                        </span>
                        <span className={cn(
                          'text-xs',
                          item.change > 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          ({item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};