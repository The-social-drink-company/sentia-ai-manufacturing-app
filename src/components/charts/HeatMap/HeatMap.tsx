// HeatMap for risk visualization and market comparison

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Thermometer,
  Download,
  Maximize2,
  Info,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';

export interface HeatMapCell {
  id: string;
  row: string;
  column: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ColorScale {
  min: string;
  mid: string;
  max: string;
  steps?: number;
}

export interface HeatMapProps {
  data: HeatMapCell[];
  rowLabels: string[];
  columnLabels: string[];
  title?: string;
  subtitle?: string;
  colorScale?: ColorScale;
  showValues?: boolean;
  showColorBar?: boolean;
  showToolbar?: boolean;
  cellSize?: number;
  fontSize?: number;
  theme?: 'light' | 'dark';
  valueFormat?: (value: number) => string;
  onCellClick?: (cell: HeatMapCell) => void;
  onCellHover?: (cell: HeatMapCell | null) => void;
  className?: string;
  'data-testid'?: string;
}

const defaultColorScale: ColorScale = {
  min: '#22c55e', // green
  mid: '#fbbf24', // yellow
  max: '#ef4444', // red
  steps: 100
};

const HeatMap: React.FC<HeatMapProps> = ({
  data,
  rowLabels,
  columnLabels,
  title,
  subtitle,
  colorScale = defaultColorScale,
  showValues = true,
  showColorBar = true,
  showToolbar = true,
  cellSize = 60,
  fontSize = 12,
  theme = 'light',
  valueFormat = (value) => value.toFixed(1),
  onCellClick,
  onCellHover,
  className,
  'data-testid': testId
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<HeatMapCell | null>(null);

  // Calculate min and max values
  const { minValue, maxValue } = useMemo(() => {
    const values = data.map(cell => cell.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values)
    };
  }, [data]);

  // Generate color interpolation
  const interpolateColor = useCallback((value: number): string => {
    if (minValue === maxValue) return colorScale.mid;

    const normalizedValue = (value - minValue) / (maxValue - minValue);
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    // Convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("");
    };

    let startColor: string, endColor: string, ratio: number;

    if (normalizedValue <= 0.5) {
      // Interpolate between min and mid
      startColor = colorScale.min;
      endColor = colorScale.mid;
      ratio = normalizedValue * 2;
    } else {
      // Interpolate between mid and max
      startColor = colorScale.mid;
      endColor = colorScale.max;
      ratio = (normalizedValue - 0.5) * 2;
    }

    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);

    const r = startRgb.r + (endRgb.r - startRgb.r) * ratio;
    const g = startRgb.g + (endRgb.g - startRgb.g) * ratio;
    const b = startRgb.b + (endRgb.b - startRgb.b) * ratio;

    return rgbToHex(r, g, b);
  }, [minValue, maxValue, colorScale]);

  // Create matrix for rendering
  const matrix = useMemo(() => {
    const result: (HeatMapCell | null)[][] = [];
    
    for (let i = 0; i < rowLabels.length; i++) {
      result[i] = [];
      for (let j = 0; j < columnLabels.length; j++) {
        const cell = data.find(
          d => d.row === rowLabels[i] && d.column === columnLabels[j]
        );
        result[i][j] = cell || null;
      }
    }
    
    return result;
  }, [data, rowLabels, columnLabels]);

  // Handle cell interaction
  const handleCellClick = useCallback((cell: HeatMapCell | null) => {
    if (cell && onCellClick) {
      onCellClick(cell);
    }
  }, [onCellClick]);

  const handleCellHover = useCallback((cell: HeatMapCell | null) => {
    setHoveredCell(cell);
    if (onCellHover) {
      onCellHover(cell);
    }
  }, [onCellHover]);

  // Download as SVG
  const downloadChart = useCallback(() => {
    const svgElement = document.querySelector(`[data-testid="${testId}-svg"]`) as SVGElement;
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${title || 'heatmap'}.svg`;
      link.click();
      
      URL.revokeObjectURL(svgUrl);
    }
  }, [title, testId]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Calculate dimensions
  const totalWidth = columnLabels.length * cellSize + 150; // Extra space for row labels
  const totalHeight = rowLabels.length * cellSize + 100; // Extra space for column labels

  // Get risk level for a value
  const getRiskLevel = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized < 0.33) return 'low';
    if (normalized < 0.66) return 'medium';
    return 'high';
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const values = data.map(cell => cell.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    return { total, average, median, count: values.length };
  }, [data]);

  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        isFullscreen && 'fixed inset-0 z-50 m-4',
        className
      )}
      data-testid={testId}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {showToolbar && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={downloadChart}
                className="h-8 w-8"
                title="Download HeatMap"
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
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start space-x-6">
          {/* HeatMap */}
          <div className="flex-1 overflow-auto">
            <svg
              width={totalWidth}
              height={totalHeight}
              data-testid={`${testId}-svg`}
              className="border border-gray-200 dark:border-gray-700 rounded"
            >
              {/* Column Labels */}
              {columnLabels.map((label, colIndex) => (
                <text
                  key={`col-${colIndex}`}
                  x={150 + colIndex * cellSize + cellSize / 2}
                  y={30}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill={theme === 'dark' ? '#f3f4f6' : '#374151'}
                  className="font-medium"
                >
                  {label}
                </text>
              ))}

              {/* Row Labels */}
              {rowLabels.map((label, rowIndex) => (
                <text
                  key={`row-${rowIndex}`}
                  x={140}
                  y={50 + rowIndex * cellSize + cellSize / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fill={theme === 'dark' ? '#f3f4f6' : '#374151'}
                  className="font-medium"
                >
                  {label}
                </text>
              ))}

              {/* Heat Map Cells */}
              {matrix.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const x = 150 + colIndex * cellSize;
                  const y = 50 + rowIndex * cellSize;
                  const isHovered = hoveredCell?.id === cell?.id;

                  return (
                    <g key={`cell-${rowIndex}-${colIndex}`}>
                      <rect
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        fill={cell ? interpolateColor(cell.value) : (theme === 'dark' ? '#374151' : '#f3f4f6')}
                        stroke={isHovered ? '#3b82f6' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')}
                        strokeWidth={isHovered ? 2 : 1}
                        className="cursor-pointer transition-all"
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => handleCellHover(cell)}
                        onMouseLeave={() => handleCellHover(null)}
                      />
                      
                      {/* Cell Value */}
                      {cell && showValues && (
                        <text
                          x={x + cellSize / 2}
                          y={y + cellSize / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.min(fontSize, cellSize / 4)}
                          fill={theme === 'dark' ? '#ffffff' : '#000000'}
                          className="font-medium pointer-events-none"
                        >
                          {valueFormat(cell.value)}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Side Panel */}
          <div className="w-64 space-y-4">
            {/* Color Scale */}
            {showColorBar && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Thermometer className="h-4 w-4 mr-1" />
                  Color Scale
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Min</span>
                    <span className="font-medium">{valueFormat(minValue)}</span>
                  </div>
                  <div 
                    className="h-4 rounded"
                    style={{
                      background: `linear-gradient(to right, ${colorScale.min}, ${colorScale.mid}, ${colorScale.max})`
                    }}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Max</span>
                    <span className="font-medium">{valueFormat(maxValue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Statistics
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Count:</span>
                  <span>{statistics.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average:</span>
                  <span>{valueFormat(statistics.average)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Median:</span>
                  <span>{valueFormat(statistics.median)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Range:</span>
                  <span>{valueFormat(maxValue - minValue)}</span>
                </div>
              </div>
            </div>

            {/* Hovered Cell Info */}
            {hoveredCell && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Cell Details
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Row:</span>
                    <span>{hoveredCell.row}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Column:</span>
                    <span>{hoveredCell.column}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="font-medium">{valueFormat(hoveredCell.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risk:</span>
                    <div className="flex items-center space-x-1">
                      {getRiskLevel(hoveredCell.value) === 'high' && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        getRiskLevel(hoveredCell.value) === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                        getRiskLevel(hoveredCell.value) === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                        getRiskLevel(hoveredCell.value) === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      )}>
                        {getRiskLevel(hoveredCell.value)}
                      </span>
                    </div>
                  </div>
                  {hoveredCell.label && (
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">{hoveredCell.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { HeatMap };
export type { HeatMapProps, HeatMapCell, ColorScale };