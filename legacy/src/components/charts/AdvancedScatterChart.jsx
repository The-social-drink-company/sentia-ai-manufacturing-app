import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ReferenceLine
} from 'recharts';

const AdvancedScatterChart = ({
  data = [],
  width = 600,
  height = 400,
  title = 'Scatter Plot Analysis',
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  showTrendline = true,
  showCorrelation = true,
  showQuadrants = false,
  quadrantLines = { x: 0, y: 0 },
  colorBy = null, // Field name to color points by
  sizeBy = null,  // Field name to size points by
  colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
  minSize = 3,
  maxSize = 15,
  showOutliers = true,
  outlierThreshold = 2, // Standard deviations
  formatTooltip = null,
  onPointClick = null
}) => {
  // Calculate statistics and regression
  const analysis = useMemo(() => {
    if (!data || data.length < 2) return null;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Linear regression: y = mx + b
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = meanY - slope * meanX;

    // Correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    // R-squared
    const rSquared = correlation * correlation;

    // Standard deviations for outlier detection
    const stdX = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.x - meanX, 2), 0) / (n - 1));
    const stdY = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0) / (n - 1));

    // Find data range for trend line
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    
    const trendline = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];

    return {
      slope,
      intercept,
      correlation,
      rSquared,
      meanX,
      meanY,
      stdX,
      stdY,
      trendline
    };
  }, [data]);

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get unique values for color grouping
    const colorGroups = colorBy ? [...new Set(data.map(d => d[colorBy]))] : [];
    const sizeValues = sizeBy ? data.map(d => d[sizeBy]) : [];
    const minSizeValue = sizeValues.length > 0 ? Math.min(...sizeValues) : 0;
    const maxSizeValue = sizeValues.length > 0 ? Math.max(...sizeValues) : 0;

    return data.map((d, index) => {
      const processed = { ...d };

      // Add color
      if (colorBy && d[colorBy] !== undefined) {
        const colorIndex = colorGroups.indexOf(d[colorBy]);
        processed._color = colors[colorIndex % colors.length];
        processed._group = d[colorBy];
      } else {
        processed._color = colors[0];
        processed._group = 'Data';
      }

      // Add size
      if (sizeBy && d[sizeBy] !== undefined) {
        const normalizedSize = maxSizeValue > minSizeValue 
          ? (d[sizeBy] - minSizeValue) / (maxSizeValue - minSizeValue)
          : 0.5;
        processed._size = minSize + (maxSize - minSize) * normalizedSize;
      } else {
        processed._size = (minSize + maxSize) / 2;
      }

      // Check if outlier
      if (showOutliers && analysis) {
        const zScoreX = Math.abs((d.x - analysis.meanX) / analysis.stdX);
        const zScoreY = Math.abs((d.y - analysis.meanY) / analysis.stdY);
        processed._isOutlier = zScoreX > outlierThreshold || zScoreY > outlierThreshold;
      }

      return processed;
    });
  }, [data, colorBy, sizeBy, colors, minSize, maxSize, showOutliers, analysis, outlierThreshold]);

  // Group data by color for multiple scatter series
  const groupedData = useMemo(() => {
    const groups = {};
    processedData.forEach(d => {
      const group = d._group || 'Data';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(d);
    });
    return groups;
  }, [processedData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      if (formatTooltip) {
        return formatTooltip(data);
      }

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <div className="space-y-1">
            <div>
              <span className="font-medium">X: </span>
              <span>{typeof data.x === 'number' ? data.x.toFixed(2) : data.x}</span>
            </div>
            <div>
              <span className="font-medium">Y: </span>
              <span>{typeof data.y === 'number' ? data.y.toFixed(2) : data.y}</span>
            </div>
            {colorBy && data[colorBy] && (
              <div>
                <span className="font-medium">{colorBy}: </span>
                <span>{data[colorBy]}</span>
              </div>
            )}
            {sizeBy && data[sizeBy] && (
              <div>
                <span className="font-medium">{sizeBy}: </span>
                <span>{data[sizeBy]}</span>
              </div>
            )}
            {data._isOutlier && (
              <div className="text-red-600 text-sm">âš  Outlier</div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot component
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={payload._size}
        fill={payload._color}
        stroke={payload._isOutlier ? '#EF4444' : payload._color}
        strokeWidth={payload._isOutlier ? 2 : 1}
        className="cursor-pointer hover:opacity-80"
        onClick={() => onPointClick && onPointClick(payload)}
      />
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      {/* Header with title and statistics */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        {analysis && showCorrelation && (
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Correlation: </span>
              <span className={`${
                Math.abs(analysis.correlation) > 0.7 ? 'text-green-600' :
                Math.abs(analysis.correlation) > 0.3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.correlation.toFixed(3)}
              </span>
            </div>
            <div>
              <span className="font-medium">RÂ²: </span>
              <span>{analysis.rSquared.toFixed(3)}</span>
            </div>
            <div>
              <span className="font-medium">Equation: </span>
              <span className="font-mono text-xs">
                y = {analysis.slope.toFixed(3)}x + {analysis.intercept.toFixed(3)}
              </span>
            </div>
            <div>
              <span className="font-medium">Points: </span>
              <span>{data.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }}
          />
          
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {Object.keys(groupedData).length > 1 && <Legend />}
          
          {/* Quadrant lines */}
          {showQuadrants && (
            <>
              <ReferenceLine x={quadrantLines.x} stroke="#9CA3AF" strokeDasharray="2 2" />
              <ReferenceLine y={quadrantLines.y} stroke="#9CA3AF" strokeDasharray="2 2" />
            </>
          )}
          
          {/* Data points */}
          {Object.entries(groupedData).map(([group, groupData], index) => (
            <Scatter
              key={group}
              name={group}
              data={groupData}
              fill={colors[index % colors.length]}
              shape={<CustomDot />}
            />
          ))}
          
          {/* Trend line */}
          {showTrendline && analysis && analysis.trendline && (
            <Scatter
              data={analysis.trendline}
              line={{ stroke: '#6B7280', strokeWidth: 2, strokeDasharray: '5 5' }}
              shape={() => null}
              name="Trend Line"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Additional statistics */}
      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Mean X</div>
            <div className="font-medium">{analysis.meanX.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Mean Y</div>
            <div className="font-medium">{analysis.meanY.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Std Dev X</div>
            <div className="font-medium">{analysis.stdX.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Std Dev Y</div>
            <div className="font-medium">{analysis.stdY.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedScatterChart;
