import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const MultiAxisChart = ({
  data = [],
  height = 400,
  leftAxisKey = 'primary',
  rightAxisKey = 'secondary',
  leftAxisLabel = 'Primary Axis',
  rightAxisLabel = 'Secondary Axis',
  title = '',
  showGrid = true,
  showLegend = true,
  leftAxisColor = '#3B82F6',
  rightAxisColor = '#EF4444',
  animations = true,
  series = [],
  timeFormat = 'auto'
}) => {
  // Format X-axis labels based on data type
  const formatXAxisLabel = (value) => {
    if (timeFormat === 'date') {
      return new Date(value).toLocaleDateString('en-GB', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    if (timeFormat === 'month') {
      return new Date(value + '-01').toLocaleDateString('en-GB', { 
        month: 'short' 
      });
    }
    if (timeFormat === 'time') {
      return new Date(value).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return value;
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {timeFormat !== 'auto' ? formatXAxisLabel(label) : label}
          </p>
          {payload.map((entry, index) => {
            const seriesConfig = series.find(s => s.dataKey === entry.dataKey) || {};
            return (
              <div key={index} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {seriesConfig.name || entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {typeof entry.value === 'number' 
                    ? entry.value.toLocaleString() 
                    : entry.value}
                  {seriesConfig.unit || ''}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Render series based on configuration
  const renderSeries = () => {
    return series.map((seriesItem, index) => {
      const commonProps = {
        key: seriesItem.dataKey,
        dataKey: seriesItem.dataKey,
        stroke: seriesItem.color || (seriesItem.yAxisId === 'right' ? rightAxisColor : leftAxisColor),
        fill: seriesItem.fill || seriesItem.color || (seriesItem.yAxisId === 'right' ? rightAxisColor : leftAxisColor),
        yAxisId: seriesItem.yAxisId || 'left',
        name: seriesItem.name || seriesItem.dataKey,
        strokeWidth: seriesItem.strokeWidth || 2,
        dot: seriesItem.showDots !== false,
        ...(seriesItem.animationDuration && { animationDuration: seriesItem.animationDuration })
      };

      switch (seriesItem.type) {
        case 'line':
          return (
            <Line
              {...commonProps}
              type={seriesItem.curve || 'monotone'}
              strokeDasharray={seriesItem.dashed ? '5 5' : '0'}
              dot={seriesItem.showDots ? { r: 3 } : false}
            />
          );
        
        case 'bar':
          return (
            <Bar
              {...commonProps}
              fillOpacity={seriesItem.opacity || 0.8}
              radius={seriesItem.radius || [0, 0, 0, 0]}
            />
          );
        
        case 'area':
          return (
            <Area
              {...commonProps}
              type={seriesItem.curve || 'monotone'}
              fillOpacity={seriesItem.opacity || 0.3}
              strokeWidth={seriesItem.strokeWidth || 2}
            />
          );
        
        default:
          return (
            <Line
              {...commonProps}
              type="monotone"
            />
          );
      }
    });
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
            />
          )}
          
          <XAxis
            dataKey="x"
            tickFormatter={timeFormat !== 'auto' ? formatXAxisLabel : undefined}
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          
          {/* Left Y Axis */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12, fill: leftAxisColor }}
            axisLine={{ stroke: leftAxisColor }}
            tickLine={{ stroke: leftAxisColor }}
            label={{ 
              value: leftAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: leftAxisColor }
            }}
          />
          
          {/* Right Y Axis */}
          {series.some(s => s.yAxisId === 'right') && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: rightAxisColor }}
              axisLine={{ stroke: rightAxisColor }}
              tickLine={{ stroke: rightAxisColor }}
              label={{ 
                value: rightAxisLabel, 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: rightAxisColor }
              }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          )}
          
          {renderSeries()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiAxisChart;