// Enterprise KPI Card with sparkline, trend, AI insight, and forecast

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Brain, 
  AlertTriangle,
  Info,
  MoreVertical,
  RefreshCw,
  Eye,
  Calendar
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/design-system';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface KPIData {
  id: string;
  title: string;
  value: number;
  unit?: string;
  previousValue?: number;
  target?: number;
  targetLabel?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  precision?: number;
}

export interface TrendData {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
  period: string;
  isGood?: boolean;
}

export interface SparklineData {
  labels: string[];
  values: number[];
  predicted?: number[];
}

export interface AIInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface ForecastData {
  period: string;
  predicted: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}

export interface KPICardProps {
  kpi: KPIData;
  trend?: TrendData;
  sparkline?: SparklineData;
  aiInsight?: AIInsight;
  forecast?: ForecastData;
  loading?: boolean;
  error?: string;
  showSparkline?: boolean;
  showTrend?: boolean;
  showAIInsight?: boolean;
  showForecast?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
  onRefresh?: () => void;
  className?: string;
  'data-testid'?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  kpi,
  trend,
  sparkline,
  aiInsight,
  forecast,
  loading = false,
  error,
  showSparkline = true,
  showTrend = true,
  showAIInsight = true,
  showForecast = false,
  size = 'md',
  variant = 'default',
  onClick,
  onRefresh,
  className,
  'data-testid': testId
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Format value based on type
  const formatValue = (value: number, format?: string, precision: number = 0) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(value);
      case 'percentage':
        return `${value.toFixed(precision)}%`;
      case 'duration':
        const hours = Math.floor(value);
        const minutes = Math.floor((value % 1) * 60);
        return `${hours}h ${minutes}m`;
      default:
        return value.toLocaleString(undefined, {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        });
    }
  };

  // Calculate percentage change
  const percentageChange = kpi.previousValue 
    ? ((kpi.value - kpi.previousValue) / kpi.previousValue) * 100
    : 0;

  // Get trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    if (trend.isGood !== undefined) {
      return trend.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  // Get AI insight styling
  const getInsightStyling = (type: string) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          icon: 'text-green-600 dark:text-green-400'
        };
      case 'negative':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-600 dark:text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  // Sparkline chart configuration
  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        enabled: false,
        external: () => {} // Disable tooltips for sparkline
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.4 }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const sparklineChartData = sparkline ? {
    labels: sparkline.labels,
    datasets: [
      {
        data: sparkline.values,
        borderColor: trend?.isGood !== false ? '#10b981' : '#ef4444',
        backgroundColor: trend?.isGood !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        borderWidth: 1.5
      },
      ...(sparkline.predicted ? [{
        data: [...Array(sparkline.values.length - sparkline.predicted.length).fill(null), ...sparkline.predicted],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 1.5
      }] : [])
    ]
  } : null;

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        size === 'sm' && 'p-4',
        size === 'lg' && 'p-8',
        className
      )} data-testid={testId}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6',
        size === 'sm' && 'p-4',
        size === 'lg' && 'p-8',
        className
      )} data-testid={testId}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Error loading KPI</span>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  const cardContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium text-gray-900 dark:text-gray-100 truncate',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-lg'
          )}>
            {kpi.title}
          </h3>
          
          {variant === 'detailed' && kpi.targetLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {kpi.targetLabel}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Value and Unit */}
      <div className="mt-3 flex items-baseline space-x-2">
        <div className={cn(
          'font-bold text-gray-900 dark:text-gray-100',
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl'
        )}>
          {formatValue(kpi.value, kpi.format, kpi.precision)}
        </div>
        {kpi.unit && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {kpi.unit}
          </div>
        )}
      </div>

      {/* Trend */}
      {showTrend && trend && (
        <div className={cn('flex items-center space-x-2 mt-2', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {trend.period}
          </span>
        </div>
      )}

      {/* Target Progress */}
      {kpi.target && variant !== 'compact' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Target</span>
            <span>{formatValue(kpi.target, kpi.format, kpi.precision)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                kpi.value >= kpi.target 
                  ? 'bg-green-500' 
                  : kpi.value >= kpi.target * 0.8 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              )}
              style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Sparkline */}
      {showSparkline && sparkline && sparklineChartData && variant !== 'compact' && (
        <div className="mt-4 h-16">
          <Line data={sparklineChartData} options={sparklineOptions} />
        </div>
      )}

      {/* AI Insight */}
      {showAIInsight && aiInsight && (variant === 'detailed' || isExpanded) && (
        <div className={cn(
          'mt-4 p-3 rounded-lg border',
          getInsightStyling(aiInsight.type).bg,
          getInsightStyling(aiInsight.type).border
        )}>
          <div className="flex items-start space-x-2">
            <Brain className={cn(
              'h-4 w-4 mt-0.5 flex-shrink-0',
              getInsightStyling(aiInsight.type).icon
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  'text-sm font-medium',
                  getInsightStyling(aiInsight.type).text
                )}>
                  {aiInsight.title}
                </h4>
                <span className="text-xs opacity-75">
                  {aiInsight.confidence}% confidence
                </span>
              </div>
              <p className={cn(
                'text-xs mt-1 opacity-90',
                getInsightStyling(aiInsight.type).text
              )}>
                {aiInsight.description}
              </p>
              {aiInsight.actions && aiInsight.actions.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {aiInsight.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={cn(
                        'text-xs px-2 py-1 rounded border transition-colors',
                        getInsightStyling(aiInsight.type).border,
                        getInsightStyling(aiInsight.type).text,
                        'hover:opacity-80'
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forecast */}
      {showForecast && forecast && (variant === 'detailed' || isExpanded) && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start space-x-2">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {forecast.period} Forecast
                </h4>
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  {forecast.confidence}% confidence
                </span>
              </div>
              <div className="mt-1 flex items-center space-x-4">
                <div>
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    {formatValue(forecast.predicted, kpi.format, kpi.precision)}
                  </span>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Range: {formatValue(forecast.range.min, kpi.format, kpi.precision)} - {formatValue(forecast.range.max, kpi.format, kpi.precision)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        size === 'sm' && 'p-4',
        size === 'md' && 'p-6',
        size === 'lg' && 'p-8',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      data-testid={testId}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {cardContent}
    </div>
  );
};

export { KPICard };
export type { 
  KPICardProps, 
  KPIData, 
  TrendData, 
  SparklineData, 
  AIInsight, 
  ForecastData 
};