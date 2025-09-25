/**
 * ENTERPRISE CHARTS SYSTEM
 * Advanced data visualization with Apache ECharts
 * Features: dark/light themes, real-time updates, interactive legends, advanced tooltips
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as echarts from 'echarts';
import { motion } from 'framer-motion';
import { themes } from '../../config/theme.config.js';
import { useTheme } from '../ui/EnterpriseThemeSwitcher';

// Chart theme configurations
const CHART_THEMES = {
  quantumDark: {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#E5E7EB',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    title: {
      textStyle: {
        color: '#F3F4F6',
        fontSize: 18,
        fontWeight: 600,
      },
      subtextStyle: {
        color: '#9CA3AF',
        fontSize: 14,
      },
    },
    legend: {
      textStyle: {
        color: '#D1D5DB',
      },
      pageTextStyle: {
        color: '#D1D5DB',
      },
      inactiveColor: '#4B5563',
    },
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#F3F4F6',
      },
      axisPointer: {
        lineStyle: {
          color: '#6B7280',
        },
        crossStyle: {
          color: '#6B7280',
        },
      },
    },
    grid: {
      borderColor: '#374151',
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisTick: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisLabel: {
        color: '#9CA3AF',
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
        },
      },
    },
    valueAxis: {
      axisLine: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisTick: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisLabel: {
        color: '#9CA3AF',
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    },
    line: {
      itemStyle: {
        borderWidth: 2,
      },
      lineStyle: {
        width: 3,
      },
      symbolSize: 8,
      symbol: 'circle',
      smooth: true,
    },
    bar: {
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },
    pie: {
      itemStyle: {
        borderWidth: 2,
        borderColor: '#1F2937',
      },
    },
    scatter: {
      itemStyle: {
        borderWidth: 0,
        opacity: 0.8,
      },
    },
    radar: {
      itemStyle: {
        borderWidth: 2,
      },
      lineStyle: {
        width: 2,
      },
      symbolSize: 8,
      symbol: 'circle',
      areaStyle: {
        opacity: 0.3,
      },
    },
    gauge: {
      itemStyle: {
        borderWidth: 0,
      },
      axisTick: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisLabel: {
        color: '#9CA3AF',
      },
      detail: {
        textStyle: {
          color: '#F3F4F6',
        },
      },
      title: {
        textStyle: {
          color: '#D1D5DB',
        },
      },
    },
    candlestick: {
      itemStyle: {
        color: '#10B981',
        color0: '#EF4444',
        borderColor: '#10B981',
        borderColor0: '#EF4444',
      },
    },
    color: [
      '#00D4FF', // Electric Blue
      '#7C3AED', // Quantum Purple
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#EC4899', // Pink
      '#8B5CF6', // Violet
      '#14B8A6', // Teal
      '#FB923C', // Orange
    ],
  },
  crystalClear: {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#374151',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    title: {
      textStyle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: 600,
      },
      subtextStyle: {
        color: '#6B7280',
        fontSize: 14,
      },
    },
    legend: {
      textStyle: {
        color: '#374151',
      },
      pageTextStyle: {
        color: '#374151',
      },
      inactiveColor: '#D1D5DB',
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#111827',
      },
      axisPointer: {
        lineStyle: {
          color: '#9CA3AF',
        },
        crossStyle: {
          color: '#9CA3AF',
        },
      },
    },
    grid: {
      borderColor: '#E5E7EB',
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      axisTick: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      axisLabel: {
        color: '#6B7280',
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
        },
      },
    },
    valueAxis: {
      axisLine: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      axisTick: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      axisLabel: {
        color: '#6B7280',
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed',
        },
      },
    },
    line: {
      itemStyle: {
        borderWidth: 2,
      },
      lineStyle: {
        width: 3,
      },
      symbolSize: 8,
      symbol: 'circle',
      smooth: true,
    },
    bar: {
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
    },
    pie: {
      itemStyle: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    },
    scatter: {
      itemStyle: {
        borderWidth: 0,
        opacity: 0.8,
      },
    },
    radar: {
      itemStyle: {
        borderWidth: 2,
      },
      lineStyle: {
        width: 2,
      },
      symbolSize: 8,
      symbol: 'circle',
      areaStyle: {
        opacity: 0.3,
      },
    },
    gauge: {
      itemStyle: {
        borderWidth: 0,
      },
      axisTick: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#D1D5DB',
        },
      },
      axisLabel: {
        color: '#6B7280',
      },
      detail: {
        textStyle: {
          color: '#111827',
        },
      },
      title: {
        textStyle: {
          color: '#374151',
        },
      },
    },
    candlestick: {
      itemStyle: {
        color: '#059669',
        color0: '#DC2626',
        borderColor: '#059669',
        borderColor0: '#DC2626',
      },
    },
    color: [
      '#0EA5E9', // Sky Blue
      '#7C3AED', // Purple
      '#059669', // Green
      '#D97706', // Amber
      '#DC2626', // Red
      '#0891B2', // Cyan
      '#DB2777', // Pink
      '#7C3AED', // Violet
      '#0D9488', // Teal
      '#EA580C', // Orange
    ],
  },
};

/**
 * Base chart component with theme integration
 */
export const EnterpriseChart = ({
  option,
  type = 'line',
  height = 400,
  onEvents = {},
  loading = false,
  className = '',
  responsive = true,
  animation = true,
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const { currentTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize ECharts instance
    chartInstance.current = echarts.init(chartRef.current);
    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    if (responsive) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (responsive) {
        window.removeEventListener('resize', handleResize);
      }
      chartInstance.current?.dispose();
    };
  }, [responsive]);

  // Update chart when theme or options change
  useEffect(() => {
    if (!chartInstance.current || !isInitialized) return;

    const themeConfig = currentTheme === 'quantumDark' ? CHART_THEMES.quantumDark : CHART_THEMES.crystalClear;

    // Merge theme with custom options
    const finalOption = {
      ...themeConfig,
      ...option,
      animation,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 500,
      animationEasingUpdate: 'cubicOut',
    };

    chartInstance.current.setOption(finalOption, true);

    // Bind events
    Object.keys(onEvents).forEach(eventName => {
      chartInstance.current.off(eventName);
      chartInstance.current.on(eventName, onEvents[eventName]);
    });
  }, [option, currentTheme, animation, onEvents, isInitialized]);

  // Handle loading state
  useEffect(() => {
    if (!chartInstance.current) return;

    if (loading) {
      chartInstance.current.showLoading('default', {
        text: 'Loading...',
        color: currentTheme === 'quantumDark' ? '#00D4FF' : '#0EA5E9',
        textColor: currentTheme === 'quantumDark' ? '#E5E7EB' : '#374151',
        maskColor: currentTheme === 'quantumDark' ? 'rgba(10, 14, 27, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      });
    } else {
      chartInstance.current.hideLoading();
    }
  }, [loading, currentTheme]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <div
        ref={chartRef}
        style={{ height: `${height}px`, width: '100%' }}
        className="rounded-lg"
      />
    </motion.div>
  );
};

/**
 * Line chart component
 */
export const LineChart = ({ data, xAxis, yAxis, series, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis || data.map(d => d.x),
      ...props.xAxisConfig,
    },
    yAxis: {
      type: 'value',
      ...props.yAxisConfig,
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data || data.map(d => d[s.dataKey]),
      smooth: true,
      emphasis: {
        focus: 'series',
      },
      ...s.config,
    })),
  }), [data, xAxis, yAxis, series, props.xAxisConfig, props.yAxisConfig]);

  return <EnterpriseChart option={option} type="line" {...props} />;
};

/**
 * Bar chart component
 */
export const BarChart = ({ data, xAxis, yAxis, series, stacked = false, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxis || data.map(d => d.x),
      ...props.xAxisConfig,
    },
    yAxis: {
      type: 'value',
      ...props.yAxisConfig,
    },
    series: series.map(s => ({
      name: s.name,
      type: 'bar',
      stack: stacked ? 'total' : undefined,
      data: s.data || data.map(d => d[s.dataKey]),
      emphasis: {
        focus: 'series',
      },
      ...s.config,
    })),
  }), [data, xAxis, yAxis, series, stacked, props.xAxisConfig, props.yAxisConfig]);

  return <EnterpriseChart option={option} type="bar" {...props} />;
};

/**
 * Pie chart component
 */
export const PieChart = ({ data, series, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: series?.name || 'Data',
        type: 'pie',
        radius: series?.radius || ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
        ...series?.config,
      },
    ],
  }), [data, series]);

  return <EnterpriseChart option={option} type="pie" {...props} />;
};

/**
 * Area chart component
 */
export const AreaChart = ({ data, xAxis, yAxis, series, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis || data.map(d => d.x),
      ...props.xAxisConfig,
    },
    yAxis: {
      type: 'value',
      ...props.yAxisConfig,
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0,
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
      },
      emphasis: {
        focus: 'series',
      },
      data: s.data || data.map(d => d[s.dataKey]),
      ...s.config,
    })),
  }), [data, xAxis, yAxis, series, props.xAxisConfig, props.yAxisConfig]);

  return <EnterpriseChart option={option} type="area" {...props} />;
};

/**
 * Scatter chart component
 */
export const ScatterChart = ({ data, xAxis, yAxis, series, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.seriesName}<br/>X: ${params.value[0]}<br/>Y: ${params.value[1]}`;
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      ...xAxis,
    },
    yAxis: {
      type: 'value',
      ...yAxis,
    },
    series: series.map(s => ({
      name: s.name,
      type: 'scatter',
      symbolSize: 10,
      data: s.data || data,
      emphasis: {
        focus: 'series',
      },
      ...s.config,
    })),
  }), [data, xAxis, yAxis, series]);

  return <EnterpriseChart option={option} type="scatter" {...props} />;
};

/**
 * Gauge chart component
 */
export const GaugeChart = ({ value, min = 0, max = 100, title, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%',
    },
    series: [
      {
        name: title || 'Gauge',
        type: 'gauge',
        min,
        max,
        progress: {
          show: true,
          width: 18,
        },
        axisLine: {
          lineStyle: {
            width: 18,
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
          },
        },
        axisLabel: {
          distance: 25,
          fontSize: 12,
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 25,
          itemStyle: {
            borderWidth: 10,
          },
        },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          offsetCenter: [0, '70%'],
          formatter: '{value}%',
        },
        data: [
          {
            value: value,
            name: title || '',
          },
        ],
      },
    ],
  }), [value, min, max, title]);

  return <EnterpriseChart option={option} type="gauge" {...props} />;
};

/**
 * Mixed chart component (Line + Bar)
 */
export const MixedChart = ({ data, xAxis, series, ...props }) => {
  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxis || data.map(d => d.x),
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: series
      .map(s => s.yAxisIndex || 0)
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(index => ({
        type: 'value',
        name: series.find(s => (s.yAxisIndex || 0) === index)?.yAxisName || '',
        ...(index > 0 ? {
          splitLine: { show: false },
          position: 'right',
        } : {}),
      })),
    series: series.map(s => ({
      name: s.name,
      type: s.type || 'line',
      yAxisIndex: s.yAxisIndex || 0,
      data: s.data || data.map(d => d[s.dataKey]),
      smooth: s.type === 'line',
      ...s.config,
    })),
  }), [data, xAxis, series]);

  return <EnterpriseChart option={option} type="mixed" {...props} />;
};

/**
 * Real-time chart component with auto-update
 */
export const RealTimeChart = ({
  dataSource,
  interval = 1000,
  maxPoints = 50,
  type = 'line',
  ...props
}) => {
  const [data, setData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const newData = dataSource();
      setData(prev => {
        const updated = [...prev, newData];
        return updated.slice(-maxPoints);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [dataSource, interval, maxPoints, isStreaming]);

  const ChartComponent = type === 'bar' ? BarChart : LineChart;

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            isStreaming
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
        >
          {isStreaming ? 'Streaming' : 'Paused'}
        </button>
      </div>
      <ChartComponent data={data} {...props} />
    </div>
  );
};

export default EnterpriseChart;
