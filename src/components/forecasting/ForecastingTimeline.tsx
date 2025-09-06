import React, { useMemo, useCallback, useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Bars3Icon,
  ViewColumnsIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, ReferenceDot } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval } from 'date-fns';
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

interface TimelineDataPoint {
  date: string;
  [key: string]: any; // Dynamic keys for product-market combinations
}

interface SeasonalityPattern {
  month: number;
  seasonal_index: number;
  confidence: number;
  historical_variance: number;
}

interface ConfidenceInterval {
  date: string;
  product_id: string;
  market_id: string;
  lower: number;
  upper: number;
  confidence_level: number;
}

type ViewMode = 'single' | 'comparison' | 'overlay';

interface ForecastingTimelineProps {
  products: Product[];
  markets: Market[];
  timeRange: string;
  viewMode: ViewMode;
  showConfidenceIntervals: boolean;
  showSeasonality: boolean;
  forecastData: any;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ForecastingTimeline({
  products,
  markets,
  timeRange,
  viewMode,
  showConfidenceIntervals,
  showSeasonality,
  forecastData,
  onViewModeChange
}: ForecastingTimelineProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());

  // Generate timeline data
  const timelineData = useMemo(() => {
    if (!forecastData) return [];

    const months = parseInt(timeRange.replace('m', ''));
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(addMonths(startDate, months - 1));
    const monthsArray = eachMonthOfInterval({ start: startDate, end: endDate });

    return monthsArray.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dataPoint: TimelineDataPoint = { date: dateStr };

      // Add actual and predicted values for each product-market combination
      products.forEach(product => {
        markets.forEach(market => {
          const key = `${product.id}-${market.id}`;
          const actualKey = `${key}-actual`;
          const predictedKey = `${key}-predicted`;
          const confidenceKey = `${key}-confidence`;

          // Simulate data (replace with actual data from forecastData)
          const baseValue = Math.random() * 1000 + 500;
          const seasonalMultiplier = getSeasonalMultiplier(date.getMonth(), product.category);
          const trendMultiplier = getTrendMultiplier(date, startDate);

          dataPoint[actualKey] = Math.floor(baseValue * seasonalMultiplier * (0.8 + Math.random() * 0.4));
          dataPoint[predictedKey] = Math.floor(baseValue * seasonalMultiplier * trendMultiplier);
          dataPoint[confidenceKey] = {
            lower: dataPoint[predictedKey] * 0.8,
            upper: dataPoint[predictedKey] * 1.2,
            confidence: 0.85
          };
        });
      });

      return dataPoint;
    });
  }, [products, markets, timeRange, forecastData]);

  // Generate seasonality overlay data
  const seasonalityData = useMemo(() => {
    if (!showSeasonality) return [];

    const months = Array.from({ length: 12 }, (_, i) => i);
    return months.map(month => ({
      month: format(new Date(2024, month, 1), 'MMM'),
      premium: getSeasonalMultiplier(month, 'Premium'),
      luxury: getSeasonalMultiplier(month, 'Luxury'),
    }));
  }, [showSeasonality]);

  // Helper functions
  const getSeasonalMultiplier = useCallback((month: number, category: string) => {
    // Simulate seasonal patterns
    const patterns = {
      Premium: [0.8, 0.85, 0.9, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1, 1.05, 1.0, 0.9],
      Luxury: [1.2, 1.3, 1.1, 0.9, 0.8, 0.75, 0.7, 0.75, 0.9, 1.1, 1.25, 1.4],
    };
    return patterns[category as keyof typeof patterns]?.[month] || 1.0;
  }, []);

  const getTrendMultiplier = useCallback((date: Date, startDate: Date) => {
    const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                     (date.getMonth() - startDate.getMonth());
    return 1.0 + (monthsDiff * 0.02); // 2% growth per month
  }, []);

  const toggleSeriesVisibility = useCallback((seriesKey: string) => {
    setSelectedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesKey)) {
        newSet.delete(seriesKey);
      } else {
        newSet.add(seriesKey);
      }
      return newSet;
    });
  }, []);

  const formatValue = useCallback((value: number, currency?: string) => {
    if (currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US').format(value);
  }, []);

  const customTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="font-medium text-gray-900 mb-2">
          {format(parseISO(label), 'MMM yyyy')}
        </div>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.includes('confidence')) return null;
            
            const [productId, marketId, type] = entry.dataKey.split('-');
            const product = products.find(p => p.id === productId);
            const market = markets.find(m => m.id === marketId);
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {product?.name} {market?.flagEmoji} ({type})
                  </span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatValue(entry.value, market?.currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [products, markets, formatValue]);

  if (!timelineData.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No forecast data available</p>
          <p className="text-sm text-gray-500">
            Generate predictions to see the timeline visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Demand Forecast Timeline</h3>
            <div className="text-sm text-gray-500">
              {format(parseISO(timelineData[0].date), 'MMM yyyy')} - {format(parseISO(timelineData[timelineData.length - 1].date), 'MMM yyyy')}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('single')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1',
                  viewMode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Single view"
              >
                <Bars3Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('comparison')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1',
                  viewMode === 'comparison'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Comparison view"
              >
                <ArrowsPointingInIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('overlay')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1',
                  viewMode === 'overlay'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Overlay view"
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-blue-500 rounded" />
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-purple-500 rounded border-2 border-purple-500 border-dashed" />
                <span className="text-gray-600">Predicted</span>
              </div>
              {showConfidenceIntervals && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-gray-300 rounded opacity-50" />
                  <span className="text-gray-600">Confidence</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product & Market Toggles */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Products:</span>
            <div className="flex space-x-2">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => toggleSeriesVisibility(product.id)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-lg border transition-colors flex items-center gap-2',
                    selectedSeries.has(product.id) || selectedSeries.size === 0
                      ? 'border-current'
                      : 'border-gray-300 opacity-50'
                  )}
                  style={{ 
                    color: selectedSeries.has(product.id) || selectedSeries.size === 0 ? product.color : undefined,
                    borderColor: selectedSeries.has(product.id) || selectedSeries.size === 0 ? product.color : undefined
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: product.color }}
                  />
                  {product.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Markets:</span>
            <div className="flex space-x-2">
              {markets.map(market => (
                <button
                  key={market.id}
                  onClick={() => toggleSeriesVisibility(market.id)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-lg border transition-colors flex items-center gap-2',
                    selectedSeries.has(market.id) || selectedSeries.size === 0
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 opacity-50'
                  )}
                >
                  <span className="text-base">{market.flagEmoji}</span>
                  {market.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        <div style={{ width: '100%', height: '500px' }}>
          <ResponsiveContainer>
            {showConfidenceIntervals ? (
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(parseISO(value), 'MMM')}
                  stroke="#666"
                />
                <YAxis 
                  tickFormatter={(value) => formatValue(value)}
                  stroke="#666"
                />
                <Tooltip content={customTooltip} />
                
                {/* Confidence Intervals */}
                {products.map(product => 
                  markets.map(market => {
                    const key = `${product.id}-${market.id}`;
                    const shouldShow = (selectedSeries.size === 0) || 
                                     selectedSeries.has(product.id) || 
                                     selectedSeries.has(market.id);
                    
                    if (!shouldShow) return null;
                    
                    return (
                      <Area
                        key={`${key}-confidence`}
                        dataKey={`${key}-confidence`}
                        stroke="none"
                        fill={`${product.color}20`}
                        fillOpacity={0.3}
                        isAnimationActive={false}
                      />
                    );
                  })
                )}
                
                {/* Actual Lines */}
                {products.map(product => 
                  markets.map(market => {
                    const key = `${product.id}-${market.id}`;
                    const shouldShow = (selectedSeries.size === 0) || 
                                     selectedSeries.has(product.id) || 
                                     selectedSeries.has(market.id);
                    
                    if (!shouldShow) return null;
                    
                    return (
                      <Line
                        key={`${key}-actual`}
                        type="monotone"
                        dataKey={`${key}-actual`}
                        stroke={product.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: product.color }}
                      />
                    );
                  })
                )}
                
                {/* Predicted Lines */}
                {products.map(product => 
                  markets.map(market => {
                    const key = `${product.id}-${market.id}`;
                    const shouldShow = (selectedSeries.size === 0) || 
                                     selectedSeries.has(product.id) || 
                                     selectedSeries.has(market.id);
                    
                    if (!shouldShow) return null;
                    
                    return (
                      <Line
                        key={`${key}-predicted`}
                        type="monotone"
                        dataKey={`${key}-predicted`}
                        stroke={product.color}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: product.color }}
                      />
                    );
                  })
                )}
              </AreaChart>
            ) : (
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(parseISO(value), 'MMM')}
                  stroke="#666"
                />
                <YAxis 
                  tickFormatter={(value) => formatValue(value)}
                  stroke="#666"
                />
                <Tooltip content={customTooltip} />
                <Legend />
                
                {/* Actual and Predicted Lines */}
                {products.map(product => 
                  markets.map(market => {
                    const key = `${product.id}-${market.id}`;
                    const shouldShow = (selectedSeries.size === 0) || 
                                     selectedSeries.has(product.id) || 
                                     selectedSeries.has(market.id);
                    
                    if (!shouldShow) return null;
                    
                    return (
                      <React.Fragment key={key}>
                        <Line
                          type="monotone"
                          dataKey={`${key}-actual`}
                          stroke={product.color}
                          strokeWidth={2}
                          dot={false}
                          name={`${product.name} ${market.code} (Actual)`}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${key}-predicted`}
                          stroke={product.color}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name={`${product.name} ${market.code} (Predicted)`}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Seasonality Pattern Overlay */}
        {showSeasonality && seasonalityData.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">Seasonal Patterns</h4>
            <div style={{ width: '100%', height: '120px' }}>
              <ResponsiveContainer>
                <LineChart data={seasonalityData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="premium" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Premium Products"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="luxury" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Luxury Products"
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${(value * 100).toFixed(0)}% of baseline`,
                      name === 'premium' ? 'Premium Products' : 'Luxury Products'
                    ]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}