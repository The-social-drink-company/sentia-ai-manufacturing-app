// Advanced Bar Chart with stacked/grouped modes and drill-down functionality

import React, { useRef, useCallback, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  InteractionItem
} from 'chart.js';
import {
  Chart as ChartComponent,
  Bar
} from 'react-chartjs-2';
import { 
  Download, 
  BarChart3,
  Layers,
  Grid3X3,
  ArrowLeft,
  Maximize2,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface BarDataSeries {
  id: string;
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  stack?: string;
  hidden?: boolean;
}

export interface DrillDownData {
  [key: string]: {
    labels: string[];
    series: BarDataSeries[];
  };
}

export interface BarChartProps {
  labels: string[];
  data: BarDataSeries[];
  drillDownData?: DrillDownData;
  title?: string;
  subtitle?: string;
  mode?: 'grouped' | 'stacked' | 'stacked100';
  width?: number;
  height?: number;
  showLegend?: boolean;
  showToolbar?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  enableDrillDown?: boolean;
  theme?: 'light' | 'dark';
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  indexAxis?: 'x' | 'y';
  onBarClick?: (point: InteractionItem, category: string, series: BarDataSeries) => void;
  onDrillDown?: (category: string, data: any) => void;
  onDrillUp?: () => void;
  className?: string;
  'data-testid'?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  labels,
  data,
  drillDownData,
  title,
  subtitle,
  mode = 'grouped',
  width,
  height = 400,
  showLegend = true,
  showToolbar = true,
  showGrid = true,
  showValues = false,
  enableDrillDown = false,
  theme = 'light',
  responsive = true,
  maintainAspectRatio = false,
  indexAxis = 'x',
  onBarClick,
  onDrillDown,
  onDrillUp,
  className,
  'data-testid': testId
}) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDrillPath, setCurrentDrillPath] = useState<string[]>([]);

  // Determine if chart is stacked
  const isStacked = mode === 'stacked' || mode === 'stacked100';

  // Calculate percentages for stacked100 mode
  const calculateStackedPercentages = (data: BarDataSeries[], labels: string[]) => {
    if (mode !== 'stacked100') return data;

    const totals = labels.map((_, index) => {
      return data.reduce((sum, series) => sum + (series.data[index] || 0), 0);
    });

    return data.map(series => ({
      ...series,
      data: series.data.map((value, index) => 
        totals[index] > 0 ? (value / totals[index]) * 100 : 0
      )
    }));
  };

  const processedData = calculateStackedPercentages(data, labels);

  // Convert data to Chart.js format
  const chartData: ChartData<'bar'> = {
    labels,
    datasets: processedData.map(series => ({
      label: series.label,
      data: series.data,
      backgroundColor: series.backgroundColor,
      borderColor: series.borderColor,
      borderWidth: series.borderWidth || 0,
      stack: isStacked ? (series.stack || 'default') : undefined,
      hidden: series.hidden
    }))
  };

  // Configure chart options
  const chartOptions: ChartOptions<'bar'> = {
    responsive,
    maintainAspectRatio,
    indexAxis,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const dataIndex = element.index;
        const category = labels[dataIndex];
        const series = data[datasetIndex];
        
        onBarClick?.(element, category, series);
        
        if (enableDrillDown && drillDownData && drillDownData[category]) {
          setCurrentDrillPath([...currentDrillPath, category]);
          onDrillDown?.(category, drillDownData[category]);
        }
      }
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: theme === 'dark' ? '#f3f4f6' : '#374151',
        padding: {
          bottom: subtitle ? 5 : 20
        }
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12
        },
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        padding: {
          bottom: 20
        }
      },
      legend: {
        display: showLegend,
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#374151',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#f3f4f6' : '#374151',
        bodyColor: theme === 'dark' ? '#f3f4f6' : '#374151',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return context[0].label || '';
          },
          label: (context) => {
            const value = context.parsed[indexAxis === 'x' ? 'y' : 'x'];
            const suffix = mode === 'stacked100' ? '%' : '';
            const formattedValue = value.toLocaleString() + suffix;
            
            if (mode === 'stacked100') {
              // Show original value in tooltip for stacked100
              const originalValue = data[context.datasetIndex].data[context.dataIndex];
              return `${context.dataset.label}: ${formattedValue} (${originalValue.toLocaleString()})`;
            }
            
            return `${context.dataset.label}: ${formattedValue}`;
          },
          footer: (context) => {
            if (enableDrillDown && drillDownData && context[0]) {
              const category = context[0].label;
              if (drillDownData[category]) {
                return 'Click to drill down';
              }
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        stacked: isStacked,
        display: true,
        grid: {
          display: indexAxis === 'x' ? showGrid : false,
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          maxRotation: 45
        },
        border: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      y: {
        type: 'linear',
        stacked: isStacked,
        display: true,
        grid: {
          display: indexAxis === 'y' ? showGrid : true,
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            const suffix = mode === 'stacked100' ? '%' : '';
            return Number(value).toLocaleString() + suffix;
          }
        },
        border: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        },
        max: mode === 'stacked100' ? 100 : undefined
      }
    }
  };

  // Download chart as image
  const downloadChart = useCallback(() => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `${title || 'chart'}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  }, [title]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle drill up
  const handleDrillUp = useCallback(() => {
    if (currentDrillPath.length > 0) {
      const newPath = [...currentDrillPath];
      newPath.pop();
      setCurrentDrillPath(newPath);
      onDrillUp?.();
    }
  }, [currentDrillPath, onDrillUp]);

  // Get mode icon
  const getModeIcon = () => {
    switch (mode) {
      case 'stacked':
      case 'stacked100':
        return <Layers className="h-4 w-4" />;
      case 'grouped':
        return <Grid3X3 className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  // Calculate totals for display
  const calculateTotals = () => {
    return labels.map((_, index) => {
      return data.reduce((sum, series) => {
        if (!series.hidden) {
          return sum + (series.data[index] || 0);
        }
        return sum;
      }, 0);
    });
  };

  const totals = calculateTotals();

  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        isFullscreen && 'fixed inset-0 z-50 m-4',
        className
      )}
      data-testid={testId}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* Drill Up Button */}
            {enableDrillDown && currentDrillPath.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDrillUp}
                className="h-8"
                data-testid={`${testId}-drill-up`}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}

            {/* Mode Indicator */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              {getModeIcon()}
              <span className="capitalize">{mode.replace('stacked100', 'stacked %')}</span>
            </div>

            {/* Drill Path */}
            {currentDrillPath.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Path: {currentDrillPath.join(' → ')}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={downloadChart}
              className="h-8 w-8"
              title="Download Chart"
              data-testid={`${testId}-download`}
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title="Toggle Fullscreen"
              data-testid={`${testId}-fullscreen`}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div 
        className="p-4"
        style={{ 
          height: isFullscreen ? 'calc(100vh - 120px)' : height,
          width: width || '100%'
        }}
      >
        <Bar
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          data-testid={`${testId}-canvas`}
        />
      </div>

      {/* Summary Statistics */}
      {showValues && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 pt-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Max:</span>
              <span className="text-sm">{Math.max(...totals).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm">{totals.reduce((sum, val) => sum + val, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Avg:</span>
              <span className="text-sm">
                {(totals.reduce((sum, val) => sum + val, 0) / totals.length).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drill Down Hint */}
      {enableDrillDown && drillDownData && Object.keys(drillDownData).length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Click on bars to drill down for more details
          </div>
        </div>
      )}
    </div>
  );
};

export { BarChart };
export type { BarChartProps, BarDataSeries, DrillDownData };