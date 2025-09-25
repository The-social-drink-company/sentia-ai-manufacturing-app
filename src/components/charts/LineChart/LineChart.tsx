// Advanced Line Chart with zoom, pan, annotations, and multiple Y-axes

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  InteractionItem,
  Chart
} from 'chart.js';
import {
  Chart as ChartComponent,
  Line
} from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Settings,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin,
  annotationPlugin
);

export interface DataSeries {
  id: string;
  label: string;
  data: Array<{ x: string | number; y: number }>;
  borderColor: string;
  backgroundColor?: string;
  fill?: boolean | string;
  tension?: number;
  yAxisID?: string;
  hidden?: boolean;
  pointRadius?: number;
  borderWidth?: number;
  borderDash?: number[];
}

export interface YAxisConfig {
  id: string;
  type: 'linear' | 'logarithmic';
  position: 'left' | 'right';
  title: string;
  min?: number;
  max?: number;
  color?: string;
  gridDisplay?: boolean;
  tickFormat?: (value: number) => string;
}

export interface Annotation {
  id: string;
  type: 'line' | 'box' | 'point';
  label: string;
  color: string;
  value?: number | string;
  xMin?: number | string;
  xMax?: number | string;
  yMin?: number;
  yMax?: number;
  yScaleID?: string;
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  display?: boolean;
}

export interface LineChartProps {
  data: DataSeries[];
  yAxes?: YAxisConfig[];
  annotations?: Annotation[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableAnnotations?: boolean;
  showLegend?: boolean;
  showToolbar?: boolean;
  showGrid?: boolean;
  theme?: 'light' | 'dark';
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  onDataPointClick?: (point: InteractionItem, data: DataSeries) => void;
  onZoom?: (zoomLevel: { min: number; max: number }) => void;
  onAnnotationClick?: (annotation: Annotation) => void;
  className?: string;
  'data-testid'?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  yAxes = [],
  annotations = [],
  title,
  subtitle,
  width,
  height = 400,
  enableZoom = true,
  enablePan = true,
  enableAnnotations = true,
  showLegend = true,
  showToolbar = true,
  showGrid = true,
  theme = 'light',
  responsive = true,
  maintainAspectRatio = false,
  onDataPointClick,
  onZoom,
  onAnnotationClick,
  className,
  'data-testid': testId
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<{ min?: number; max?: number }>({});

  // Convert data to Chart.js format
  const chartData: ChartData<'line'> = {
    labels: data.length > 0 ? data[0].data.map(point => point.x) : [],
    datasets: data.map(series => ({
      label: series.label,
      data: series.data.map(point => point.y),
      borderColor: series.borderColor,
      backgroundColor: series.backgroundColor || series.borderColor + '20',
      fill: series.fill || false,
      tension: series.tension || 0.4,
      yAxisID: series.yAxisID || 'y',
      hidden: hiddenSeries.has(series.id) || series.hidden,
      pointRadius: series.pointRadius || 3,
      pointHoverRadius: (series.pointRadius || 3) + 2,
      borderWidth: series.borderWidth || 2,
      borderDash: series.borderDash,
      pointBackgroundColor: series.borderColor,
      pointBorderColor: series.borderColor
    }))
  };

  // Configure chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive,
    maintainAspectRatio,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onDataPointClick) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const series = data[datasetIndex];
        onDataPointClick(element, series);
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
          padding: 20,
          filter: (item) => !hiddenSeries.has(data[item.datasetIndex]?.id)
        },
        onClick: (evt, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          if (index !== undefined) {
            const series = data[index];
            if (series) {
              toggleSeries(series.id);
            }
          }
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
            const series = data[context.datasetIndex];
            const yAxis = yAxes.find(axis => axis.id === series.yAxisID);
            const value = context.parsed.y;
            const formattedValue = yAxis?.tickFormat ? yAxis.tickFormat(value) : value.toLocaleString();
            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      },
      zoom: enableZoom ? {
        pan: {
          enabled: enablePan,
          mode: 'x' as const,
          onPanComplete: (chart) => {
            const xScale = chart.scales.x;
            const newZoomLevel = {
              min: xScale.min,
              max: xScale.max
            };
            setZoomLevel(newZoomLevel);
            onZoom?.(newZoomLevel);
          }
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const,
          onZoomComplete: (chart) => {
            const xScale = chart.scales.x;
            const newZoomLevel = {
              min: xScale.min,
              max: xScale.max
            };
            setZoomLevel(newZoomLevel);
            onZoom?.(newZoomLevel);
          }
        }
      } : undefined,
      annotation: enableAnnotations && annotations.length > 0 ? {
        annotations: annotations.reduce((acc, annotation) => {
          if (annotation.display !== false) {
            acc[annotation.id] = {
              type: annotation.type,
              label: {
                display: true,
                content: annotation.label,
                backgroundColor: annotation.color,
                color: 'white',
                position: 'start'
              },
              borderColor: annotation.borderColor || annotation.color,
              backgroundColor: annotation.backgroundColor || annotation.color + '20',
              borderWidth: annotation.borderWidth || 2,
              ...(annotation.type === 'line' && {
                scaleID: annotation.yScaleID || 'x',
                value: annotation.value
              }),
              ...(annotation.type === 'box' && {
                xMin: annotation.xMin,
                xMax: annotation.xMax,
                yMin: annotation.yMin,
                yMax: annotation.yMax,
                yScaleID: annotation.yScaleID
              }),
              ...(annotation.type === 'point' && {
                xValue: annotation.value,
                yValue: annotation.yMin
              }),
              click: () => onAnnotationClick?.(annotation)
            };
          }
          return acc;
        }, {} as any)
      } : undefined
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
        },
        border: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      // Default Y axis
      y: {
        type: 'linear' as const,
        display: yAxes.length === 0 || yAxes.some(axis => axis.id === 'y'),
        position: 'left' as const,
        grid: {
          display: showGrid,
          color: theme === 'dark' ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            const yAxis = yAxes.find(axis => axis.id === 'y');
            return yAxis?.tickFormat ? yAxis.tickFormat(Number(value)) : value;
          }
        },
        border: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        },
        title: {
          display: yAxes.some(axis => axis.id === 'y' && axis.title),
          text: yAxes.find(axis => axis.id === 'y')?.title || '',
          color: theme === 'dark' ? '#f3f4f6' : '#374151'
        }
      },
      // Additional Y axes
      ...yAxes.reduce((acc, axis) => {
        if (axis.id !== 'y') {
          acc[axis.id] = {
            type: axis.type,
            display: true,
            position: axis.position,
            min: axis.min,
            max: axis.max,
            grid: {
              display: axis.gridDisplay !== false ? showGrid : false,
              drawOnChartArea: axis.position === 'left',
              color: axis.color || (theme === 'dark' ? '#374151' : '#e5e7eb')
            },
            ticks: {
              color: axis.color || (theme === 'dark' ? '#9ca3af' : '#6b7280'),
              callback: function(value) {
                return axis.tickFormat ? axis.tickFormat(Number(value)) : value;
              }
            },
            border: {
              color: axis.color || (theme === 'dark' ? '#4b5563' : '#d1d5db')
            },
            title: {
              display: !!axis.title,
              text: axis.title,
              color: axis.color || (theme === 'dark' ? '#f3f4f6' : '#374151')
            }
          };
        }
        return acc;
      }, {} as any)
    }
  };

  // Toggle series visibility
  const toggleSeries = useCallback((seriesId: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setZoomLevel({});
    }
  }, []);

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
            {/* Series Toggle Buttons */}
            {data.map((series) => (
              <Button
                key={series.id}
                variant={hiddenSeries.has(series.id) ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => toggleSeries(series.id)}
                className="h-7 text-xs"
                data-testid={`${testId}-toggle-${series.id}`}
              >
                {hiddenSeries.has(series.id) ? (
                  <EyeOff className="h-3 w-3 mr-1" />
                ) : (
                  <Eye className="h-3 w-3 mr-1" />
                )}
                {series.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-1">
            {enableZoom && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetZoom}
                className="h-8 w-8"
                title="Reset Zoom"
                data-testid={`${testId}-reset-zoom`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
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
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          data-testid={`${testId}-canvas`}
        />
      </div>

      {/* Zoom Level Indicator */}
      {enableZoom && (zoomLevel.min !== undefined || zoomLevel.max !== undefined) && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
            <ZoomIn className="h-3 w-3" />
            <span>
              Zoomed: {zoomLevel.min?.toFixed(0)} - {zoomLevel.max?.toFixed(0)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
              className="h-5 text-xs px-2"
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { LineChart };
export type { LineChartProps, DataSeries, YAxisConfig, Annotation };