// Enterprise Metric Card with comparison, percentage change, and goal tracking

import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Target, 
  TrendingUp,
  Info,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Progress } from '../../ui/Progress/Progress';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';

export interface MetricData {
  id: string;
  label: string;
  value: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration' | 'bytes';
  precision?: number;
}

export interface ComparisonData {
  label: string;
  value: number;
  period: string;
  type: 'previous' | 'target' | 'benchmark' | 'average';
}

export interface GoalData {
  target: number;
  current: number;
  deadline?: Date;
  status: 'on-track' | 'at-risk' | 'behind' | 'achieved';
  label?: string;
}

export interface ChangeData {
  value: number;
  percentage: number;
  period: string;
  trend: 'positive' | 'negative' | 'neutral';
  isGood?: boolean;
}

export interface MetricCardProps {
  metric: MetricData;
  comparison?: ComparisonData;
  goal?: GoalData;
  change?: ChangeData;
  loading?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
  showComparison?: boolean;
  showGoal?: boolean;
  showChange?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onGoalEdit?: () => void;
  className?: string;
  'data-testid'?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  comparison,
  goal,
  change,
  loading = false,
  error,
  size = 'md',
  variant = 'default',
  showComparison = true,
  showGoal = true,
  showChange = true,
  interactive = false,
  onClick,
  onGoalEdit,
  className,
  'data-testid': testId
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format value based on type
  const formatValue = (value: number, format?: string, precision: number = 0) => {
    if (isNaN(value)) return '—';
    
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
      case 'bytes':
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = value;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(precision)} ${units[unitIndex]}`;
      default:
        return value.toLocaleString(undefined, {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        });
    }
  };

  // Get comparison styling
  const getComparisonStyling = () => {
    if (!comparison) return null;
    
    const diff = metric.value - comparison.value;
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    
    return {
      icon: isPositive ? ArrowUp : isNegative ? ArrowDown : Minus,
      color: isPositive 
        ? 'text-green-600 dark:text-green-400' 
        : isNegative 
          ? 'text-red-600 dark:text-red-400' 
          : 'text-gray-500',
      percentage: Math.abs((diff / comparison.value) * 100)
    };
  };

  // Get goal status styling
  const getGoalStatusStyling = (status: string) => {
    switch (status) {
      case 'achieved':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: CheckCircle2,
          progressColor: 'bg-green-500'
        };
      case 'on-track':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: TrendingUp,
          progressColor: 'bg-blue-500'
        };
      case 'at-risk':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: Clock,
          progressColor: 'bg-yellow-500'
        };
      case 'behind':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: AlertCircle,
          progressColor: 'bg-red-500'
        };
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: Target,
          progressColor: 'bg-gray-500'
        };
    }
  };

  // Get change styling
  const getChangeStyling = () => {
    if (!change) return null;
    
    const isPositive = change.value > 0;
    const isNegative = change.value < 0;
    
    let colorClass = 'text-gray-500';
    if (change.isGood !== undefined) {
      colorClass = change.isGood 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400';
    } else {
      colorClass = isPositive 
        ? 'text-green-600 dark:text-green-400' 
        : isNegative 
          ? 'text-red-600 dark:text-red-400' 
          : 'text-gray-500';
    }
    
    return {
      icon: isPositive ? ArrowUp : isNegative ? ArrowDown : Minus,
      color: colorClass
    };
  };

  const comparisonStyling = getComparisonStyling();
  const goalStyling = goal ? getGoalStatusStyling(goal.status) : null;
  const changeStyling = getChangeStyling();

  // Loading state
  if (loading) {
    return (
      <div 
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          size === 'sm' && 'p-4',
          size === 'md' && 'p-6',
          size === 'lg' && 'p-8',
          className
        )}
        data-testid={testId}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800',
          size === 'sm' && 'p-4',
          size === 'md' && 'p-6',
          size === 'lg' && 'p-8',
          className
        )}
        data-testid={testId}
      >
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Error loading metric</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  const cardContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium text-gray-700 dark:text-gray-300 truncate',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            {metric.label}
          </h3>
        </div>
        
        {interactive && (
          <div className="ml-2">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <BarChart3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline space-x-2">
        <span className={cn(
          'font-bold text-gray-900 dark:text-gray-100',
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl'
        )}>
          {formatValue(metric.value, metric.format, metric.precision)}
        </span>
        {metric.unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {metric.unit}
          </span>
        )}
      </div>

      {/* Change */}
      {showChange && change && changeStyling && variant !== 'minimal' && (
        <div className={cn('flex items-center space-x-1', changeStyling.color)}>
          <changeStyling.icon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {change.value > 0 ? '+' : ''}{formatValue(change.value, metric.format, metric.precision)}
          </span>
          <span className="text-sm">
            ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            vs {change.period}
          </span>
        </div>
      )}

      {/* Comparison */}
      {showComparison && comparison && comparisonStyling && variant === 'detailed' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              vs {comparison.label}
            </span>
            <div className={cn('flex items-center space-x-1', comparisonStyling.color)}>
              <comparisonStyling.icon className="h-3 w-3" />
              <span className="font-medium">
                {comparisonStyling.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {comparison.type === 'previous' && `Previous ${comparison.period}`}
            {comparison.type === 'target' && 'Target'}
            {comparison.type === 'benchmark' && 'Benchmark'}
            {comparison.type === 'average' && `${comparison.period} Average`}
            : {formatValue(comparison.value, metric.format, metric.precision)}
          </div>
        </div>
      )}

      {/* Goal Progress */}
      {showGoal && goal && goalStyling && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <goalStyling.icon className={cn('h-4 w-4', goalStyling.color)} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {goal.label || 'Goal'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn('text-xs font-medium', goalStyling.color)}>
                {goal.status.replace('-', ' ').toUpperCase()}
              </span>
              {onGoalEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoalEdit();
                  }}
                >
                  <Target className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress 
              value={Math.min((goal.current / goal.target) * 100, 100)}
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {formatValue(goal.current, metric.format, metric.precision)} of {formatValue(goal.target, metric.format, metric.precision)}
              </span>
              {goal.deadline && (
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{goal.deadline.toLocaleDateString()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Info for Detailed Variant */}
      {variant === 'detailed' && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Last updated</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200',
        interactive && 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer',
        isHovered && interactive && 'transform scale-105',
        size === 'sm' && 'p-4',
        size === 'md' && 'p-6',
        size === 'lg' && 'p-8',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

export { MetricCard };
export type { 
  MetricCardProps, 
  MetricData, 
  ComparisonData, 
  GoalData, 
  ChangeData 
};