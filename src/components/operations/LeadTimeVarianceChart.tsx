import React, { useState, useMemo, useCallback } from 'react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
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

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface LeadTimeData {
  supplier_id: string;
  market_id: string;
  product_category: string;
  historical_lead_time: number; // days
  current_lead_time: number; // days
  predicted_lead_time: number; // days
  variance: number; // percentage
  confidence_band_lower: number; // days
  confidence_band_upper: number; // days
  recent_deliveries: {
    id: string;
    order_date: string;
    promised_delivery: string;
    actual_delivery?: string;
    status: 'on_time' | 'delayed' | 'early' | 'pending';
    delay_days?: number;
  }[];
  alerts: {
    id: string;
    type: 'delay_risk' | 'performance_decline' | 'supplier_issue';
    severity: 'low' | 'medium' | 'high';
    message: string;
    created_at: string;
  }[];
}

type ViewMode = 'tabs' | 'split' | 'unified';
type TimeRange = '30d' | '90d' | '180d' | '1y';

interface LeadTimeVarianceChartProps {
  viewMode: ViewMode;
  activeMarket?: string;
  selectedMarkets?: string[];
  markets: Market[];
}

export function LeadTimeVarianceChart({ 
  viewMode, 
  activeMarket, 
  selectedMarkets, 
  markets 
}: LeadTimeVarianceChartProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get relevant markets based on view mode
  const relevantMarkets = useMemo(() => {
    if (viewMode === 'tabs' && activeMarket) {
      return markets.filter(m => m.id === activeMarket);
    } else if (viewMode === 'split' && selectedMarkets) {
      return markets.filter(m => selectedMarkets.includes(m.id));
    }
    return markets;
  }, [viewMode, activeMarket, selectedMarkets, markets]);

  // Fetch lead time data
  const { data: leadTimeData = [], isLoading, refetch } = useQuery({
    queryKey: ['lead-time-variance', relevantMarkets.map(m => m.id), timeRange, selectedSupplier, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        markets: relevantMarkets.map(m => m.id).join(','),
        timeRange,
        ...(selectedSupplier !== 'all' && { supplier: selectedSupplier }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      });
      
      const response = await fetch(`/api/operations/lead-times?${params}`);
      if (!response.ok) throw new Error('Failed to fetch lead time data');
      return response.json() as LeadTimeData[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch suppliers for filter
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json() as Supplier[];
    },
  });

  // Real-time updates
  useWebSocket('/ws/lead-times', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'lead_time_update' || data.type === 'delivery_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing lead time WebSocket message:', error);
      }
    },
  });

  const getVarianceColor = useCallback((variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance <= 5) return 'text-green-600 bg-green-50';
    if (absVariance <= 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'on_time':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'early':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'delayed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const calculateTimelinePosition = useCallback((date: string, startDate: Date, totalDays: number) => {
    const targetDate = parseISO(date);
    const daysDiff = differenceInDays(targetDate, startDate);
    return Math.max(0, Math.min(100, (daysDiff / totalDays) * 100));
  }, []);

  const renderTimeline = useCallback((data: LeadTimeData, market: Market) => {
    const today = new Date();
    const timelineDays = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : timeRange === '180d' ? 180 : 365;
    const startDate = addDays(today, -timelineDays);
    
    const supplier = suppliers.find(s => s.id === data.supplier_id);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">{supplier?.name || 'Unknown Supplier'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">{market.flagEmoji}</span>
              <span className="text-sm text-gray-600">{market.code}</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {data.product_category}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className={cn(
              'px-2 py-1 rounded-full font-medium',
              getVarianceColor(data.variance)
            )}>
              {data.variance > 0 ? '+' : ''}{data.variance.toFixed(1)}% variance
            </div>
          </div>
        </div>

        {/* Lead Time Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{data.historical_lead_time}d</div>
            <div className="text-xs text-gray-500">Historical Avg</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{data.current_lead_time}d</div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{data.predicted_lead_time}d</div>
            <div className="text-xs text-gray-500">Predicted</div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Delivery Timeline</span>
            <span className="text-xs text-gray-500">
              {format(startDate, 'MMM dd')} - {format(today, 'MMM dd, yyyy')}
            </span>
          </div>
          
          <div className="relative">
            {/* Timeline base */}
            <div className="h-2 bg-gray-200 rounded-full mb-3">
              {/* Confidence band */}
              <div 
                className="h-2 bg-purple-200 rounded-full absolute"
                style={{
                  left: `${calculateTimelinePosition(addDays(today, -data.confidence_band_upper).toISOString(), startDate, timelineDays)}%`,
                  width: `${(data.confidence_band_upper - data.confidence_band_lower) / timelineDays * 100}%`,
                }}
                title="Prediction confidence band"
              />
            </div>

            {/* Recent Deliveries */}
            <div className="space-y-2">
              {data.recent_deliveries.slice(0, 5).map((delivery, index) => {
                const orderPos = calculateTimelinePosition(delivery.order_date, startDate, timelineDays);
                const promisedPos = calculateTimelinePosition(delivery.promised_delivery, startDate, timelineDays);
                const actualPos = delivery.actual_delivery 
                  ? calculateTimelinePosition(delivery.actual_delivery, startDate, timelineDays)
                  : null;
                
                return (
                  <div key={delivery.id} className="relative">
                    <div className="flex items-center text-xs text-gray-600 mb-1">
                      {getStatusIcon(delivery.status)}
                      <span className="ml-1">
                        Order {format(parseISO(delivery.order_date), 'MMM dd')}
                        {delivery.delay_days && delivery.delay_days > 0 && (
                          <span className="text-red-600 ml-1">({delivery.delay_days}d delay)</span>
                        )}
                      </span>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded">
                      {/* Order placed */}
                      <div 
                        className="absolute w-3 h-3 bg-blue-500 rounded-full top-1.5 transform -translate-x-1/2"
                        style={{ left: `${orderPos}%` }}
                        title={`Order placed: ${format(parseISO(delivery.order_date), 'MMM dd, yyyy')}`}
                      />
                      
                      {/* Promised delivery */}
                      <div 
                        className="absolute w-3 h-3 bg-yellow-500 rounded-full top-1.5 transform -translate-x-1/2"
                        style={{ left: `${promisedPos}%` }}
                        title={`Promised delivery: ${format(parseISO(delivery.promised_delivery), 'MMM dd, yyyy')}`}
                      />
                      
                      {/* Actual delivery */}
                      {actualPos !== null && (
                        <div 
                          className={cn(
                            'absolute w-3 h-3 rounded-full top-1.5 transform -translate-x-1/2',
                            delivery.status === 'on_time' ? 'bg-green-500' :
                            delivery.status === 'early' ? 'bg-blue-500' : 'bg-red-500'
                          )}
                          style={{ left: `${actualPos}%` }}
                          title={`Actual delivery: ${format(parseISO(delivery.actual_delivery!), 'MMM dd, yyyy')}`}
                        />
                      )}
                      
                      {/* Connection lines */}
                      <div 
                        className="absolute top-2 h-1 bg-gray-300"
                        style={{
                          left: `${Math.min(orderPos, promisedPos)}%`,
                          width: `${Math.abs(promisedPos - orderPos)}%`,
                        }}
                      />
                      {actualPos !== null && (
                        <div 
                          className={cn(
                            'absolute top-2 h-1',
                            delivery.status === 'delayed' ? 'bg-red-300' : 'bg-green-300'
                          )}
                          style={{
                            left: `${Math.min(promisedPos, actualPos)}%`,
                            width: `${Math.abs(actualPos - promisedPos)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Active Alerts</span>
            {data.alerts.map((alert) => (
              <div key={alert.id} className={cn(
                'flex items-start space-x-2 p-2 rounded-lg text-sm',
                alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
                alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              )}>
                <ExclamationTriangleIcon className={cn(
                  'h-4 w-4 flex-shrink-0 mt-0.5',
                  alert.severity === 'high' ? 'text-red-500' :
                  alert.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                )} />
                <div>
                  <p className={cn(
                    'font-medium',
                    alert.severity === 'high' ? 'text-red-800' :
                    alert.severity === 'medium' ? 'text-yellow-800' :
                    'text-blue-800'
                  )}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(parseISO(alert.created_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [suppliers, timeRange, getVarianceColor, getStatusIcon, calculateTimelinePosition]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-16 bg-gray-200 rounded mb-3" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lead Time Variance Analysis</h2>
          
          <div className="flex items-center space-x-3">
            {/* Supplier Filter */}
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Premium">Premium</option>
              <option value="Luxury">Luxury</option>
              <option value="Standard">Standard</option>
            </select>

            {/* Time Range */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['30d', '90d', '180d', '1y'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    timeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {leadTimeData.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No lead time data available</p>
            <p className="text-sm text-gray-500">
              Data will appear here as supplier deliveries are tracked
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {relevantMarkets.map(market => {
              const marketData = leadTimeData.filter(d => d.market_id === market.id);
              
              if (marketData.length === 0) return null;
              
              return (
                <div key={market.id}>
                  {viewMode !== 'tabs' && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg">{market.flagEmoji}</span>
                      <h3 className="font-medium text-gray-900">{market.name}</h3>
                    </div>
                  )}
                  
                  <div className="grid gap-4">
                    {marketData.map(data => renderTimeline(data, market))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Order Placed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>Promised Delivery</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Actual Delivery</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2 bg-purple-200 rounded-full" />
              <span>Prediction Band</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}