/**
 * Optimized Chart Component
 * Implements virtualization, memoization, and progressive rendering for Recharts
 */

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useInView } from 'react-intersection-observer';

// Memoized tooltip component
const CustomTooltip = memo(({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-semibold mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// Virtualized chart wrapper - only renders when in viewport
export const VirtualizedChart = memo(({ 
  children, 
  height = 300,
  placeholder = null,
  rootMargin = '100px'
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin,
    triggerOnce: true // Only trigger once for performance
  });

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {inView ? children : placeholder || <ChartPlaceholder height={height} />}
    </div>
  );
});

VirtualizedChart.displayName = 'VirtualizedChart';

// Chart placeholder
const ChartPlaceholder = ({ height }) => (
  <div 
    className="bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
    style={{ height }}
  />
);

// Data sampling for large datasets
const 0;

// Optimized Line Chart
export const OptimizedLineChart = memo(({
  data,
  lines = [],
  xDataKey = 'date',
  height = 300,
  maxDataPoints = 100,
  animationDuration = 300,
  showGrid = true,
  showLegend = true,
  tooltipFormatter,
  ...props
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  // Sample data if too large
  const sampledData = useMemo(
    () => sampleData(data, maxDataPoints),
    [data, maxDataPoints]
  );

  // Only animate on first render
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartContent = useMemo(() => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={sampledData} {...props}>
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e0e0e0"
            strokeOpacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xDataKey}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (typeof value === 'string' && value.includes('-')) {
              return new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            }
            return value;
          }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.key || index}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || null}
            strokeWidth={2}
            dot={false}
            animationDuration={isAnimated ? 0 : animationDuration}
            animationBegin={0}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  ), [sampledData, lines, xDataKey, height, showGrid, showLegend, isAnimated, animationDuration, tooltipFormatter, props]);

  return <VirtualizedChart height={height}>{chartContent}</VirtualizedChart>;
});

OptimizedLineChart.displayName = 'OptimizedLineChart';

// Optimized Bar Chart
export const OptimizedBarChart = memo(({
  data,
  bars = [],
  xDataKey = 'name',
  height = 300,
  maxDataPoints = 50,
  animationDuration = 300,
  showGrid = true,
  showLegend = true,
  tooltipFormatter,
  stacked = false,
  ...props
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  const sampledData = useMemo(
    () => sampleData(data, maxDataPoints),
    [data, maxDataPoints]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartContent = useMemo(() => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sampledData} {...props}>
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e0e0e0"
            strokeOpacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xDataKey}
          tick={{ fontSize: 12 }}
          angle={data.length > 10 ? -45 : 0}
          textAnchor={data.length > 10 ? "end" : "middle"}
          height={data.length > 10 ? 80 : 40}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={bar.key || index}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || null}
            stackId={stacked ? "stack" : undefined}
            animationDuration={isAnimated ? 0 : animationDuration}
            animationBegin={0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  ), [sampledData, bars, xDataKey, height, showGrid, showLegend, stacked, isAnimated, animationDuration, tooltipFormatter, props]);

  return <VirtualizedChart height={height}>{chartContent}</VirtualizedChart>;
});

OptimizedBarChart.displayName = 'OptimizedBarChart';

// Optimized Area Chart
export const OptimizedAreaChart = memo(({
  data,
  areas = [],
  xDataKey = 'date',
  height = 300,
  maxDataPoints = 100,
  animationDuration = 300,
  showGrid = true,
  showLegend = true,
  tooltipFormatter,
  stacked = false,
  ...props
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  const sampledData = useMemo(
    () => sampleData(data, maxDataPoints),
    [data, maxDataPoints]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartContent = useMemo(() => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sampledData} {...props}>
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e0e0e0"
            strokeOpacity={0.3}
          />
        )}
        <XAxis 
          dataKey={xDataKey}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (typeof value === 'string' && value.includes('-')) {
              return new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            }
            return value;
          }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && <Legend />}
        {areas.map((area, index) => (
          <Area
            key={area.key || index}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stroke={area.stroke || null}
            fill={area.fill || null}
            fillOpacity={area.fillOpacity || 0.6}
            stackId={stacked ? "stack" : undefined}
            animationDuration={isAnimated ? 0 : animationDuration}
            animationBegin={0}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  ), [sampledData, areas, xDataKey, height, showGrid, showLegend, stacked, isAnimated, animationDuration, tooltipFormatter, props]);

  return <VirtualizedChart height={height}>{chartContent}</VirtualizedChart>;
});

OptimizedAreaChart.displayName = 'OptimizedAreaChart';

// Optimized Pie Chart with limited data points
export const OptimizedPieChart = memo(({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  maxSlices = 10,
  animationDuration = 300,
  showLegend = true,
  colors = [],
  ...props
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  // Limit pie slices and group small values
  const processedData = useMemo(() => {
    if (data.length <= maxSlices) return data;
    
    const sorted = [...data].sort((a, b) => b[dataKey] - a[dataKey]);
    const topSlices = sorted.slice(0, maxSlices - 1);
    const otherSlices = sorted.slice(maxSlices - 1);
    
    if (otherSlices.length > 0) {
      const otherTotal = otherSlices.reduce((sum, item) => sum + item[dataKey], 0);
      topSlices.push({
        [nameKey]: 'Others',
        [dataKey]: otherTotal
      });
    }
    
    return topSlices;
  }, [data, maxSlices, dataKey, nameKey]);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getColor = useCallback((index) => {
    if (colors[index]) return colors[index];
    return `hsl(${index * (360 / processedData.length)}, 70%, 50%)`;
  }, [colors, processedData.length]);

  const chartContent = useMemo(() => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart {...props}>
        <Pie
          data={processedData}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={height / 3}
          animationDuration={isAnimated ? 0 : animationDuration}
          animationBegin={0}
          label={({ value, percent }) => `${(percent * 100).toFixed(0)}%`}
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(index)} />
          ))}
        </Pie>
        <Tooltip />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  ), [processedData, dataKey, nameKey, height, showLegend, isAnimated, animationDuration, getColor, props]);

  return <VirtualizedChart height={height}>{chartContent}</VirtualizedChart>;
});

OptimizedPieChart.displayName = 'OptimizedPieChart';

// Chart type selector for dynamic rendering
export const DynamicChart = memo(({
  type = 'line',
  ...props
}) => {
  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'line':
        return OptimizedLineChart;
      case 'bar':
        return OptimizedBarChart;
      case 'area':
        return OptimizedAreaChart;
      case 'pie':
        return OptimizedPieChart;
      default:
        return OptimizedLineChart;
    }
  }, [type]);

  return <ChartComponent {...props} />;
});

DynamicChart.displayName = 'DynamicChart';

// Export Cell for PieChart
import { Cell } from 'recharts';

export default {
  OptimizedLineChart,
  OptimizedBarChart,
  OptimizedAreaChart,
  OptimizedPieChart,
  DynamicChart,
  VirtualizedChart
};
