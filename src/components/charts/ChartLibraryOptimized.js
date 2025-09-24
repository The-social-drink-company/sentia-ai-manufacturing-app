/**
 * Optimized Chart Library System
 * Implements dynamic imports and component-specific bundles
 * Target: 150kB bundle size reduction through chart splitting
 */

import React, { lazy, Suspense, memo, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

// Chart loading states
const ChartLoadingSpinner = ({ type = 'chart' }) => (
  <div className="min-h-[200px] bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
    <div className="text-center space-y-2">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Loading {type}...
      </p>
    </div>
  </div>
);

// Dynamic chart imports - only load when needed
const createLazyChart = (importFn, chartName) => {
  const LazyChart = lazy(importFn);
  
  return memo(({ inView, ...props }) => {
    if (!inView) {
      return <ChartLoadingSpinner type={chartName} />;
    }

    return (
      <Suspense 0 />}>
        <LazyChart {...props} />
      </Suspense>
    );
  });
};

// Line Chart Components
export const OptimizedLineChart = createLazyChart(
  () => import('./LineChart/OptimizedLineChart'),
  'Line Chart'
);

export const OptimizedAreaChart = createLazyChart(
  () => import('./AreaChart/OptimizedAreaChart'),
  'Area Chart'
);

// Bar Chart Components
export const OptimizedBarChart = createLazyChart(
  () => import('./BarChart/OptimizedBarChart'),
  'Bar Chart'
);

export const OptimizedHorizontalBarChart = createLazyChart(
  () => import('./BarChart/OptimizedHorizontalBarChart'),
  'Horizontal Bar Chart'
);

// Pie and Doughnut Charts
export const OptimizedPieChart = createLazyChart(
  () => import('./PieChart/OptimizedPieChart'),
  'Pie Chart'
);

export const OptimizedDoughnutChart = createLazyChart(
  () => import('./DoughnutChart/OptimizedDoughnutChart'),
  'Doughnut Chart'
);

// Specialized Manufacturing Charts
export const OptimizedProductionChart = createLazyChart(
  () => import('./ProductionChart/OptimizedProductionChart'),
  'Production Chart'
);

export const OptimizedQualityChart = createLazyChart(
  () => import('./QualityChart/OptimizedQualityChart'),
  'Quality Chart'
);

export const OptimizedInventoryChart = createLazyChart(
  () => import('./InventoryChart/OptimizedInventoryChart'),
  'Inventory Chart'
);

// Real-time Charts
export const OptimizedRealTimeChart = createLazyChart(
  () => import('./RealTimeChart/OptimizedRealTimeChart'),
  'Real-time Chart'
);

// Advanced Charts
export const OptimizedScatterChart = createLazyChart(
  () => import('./ScatterChart/OptimizedScatterChart'),
  'Scatter Chart'
);

export const OptimizedGaugeChart = createLazyChart(
  () => import('./GaugeChart/OptimizedGaugeChart'),
  'Gauge Chart'
);

// Chart wrapper with viewport detection
const ChartWrapper = memo(({ 
  children, 
  height = 300,
  enableVirtualization = true,
  rootMargin = '50px',
  ...props 
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin,
    triggerOnce: false // Allow re-triggering for memory management
  });

  const chartHeight = useMemo(() => Math.max(height, 200), [height]);

  return (
    <div 
      ref={ref} 
      style={{ minHeight: chartHeight }}
      className="w-full"
      {...props}
    >
      {React.cloneElement(children, { inView })}
    </div>
  );
});

ChartWrapper.displayName = 'ChartWrapper';

// Dynamic chart selector with type-based loading
export const DynamicChart = memo(({
  type,
  data,
  options = {},
  height = 300,
  enableVirtualization = true,
  ...props
}) => {
  const chartType = useMemo(() => {
    // Normalize chart type
    const normalizedType = type?.toLowerCase().replace(/[^a-z]/g, '');
    
    // Map to optimized components
    const typeMap = {
      'line': OptimizedLineChart,
      'area': OptimizedAreaChart,
      'bar': OptimizedBarChart,
      'horizontalbar': OptimizedHorizontalBarChart,
      'pie': OptimizedPieChart,
      'doughnut': OptimizedDoughnutChart,
      'production': OptimizedProductionChart,
      'quality': OptimizedQualityChart,
      'inventory': OptimizedInventoryChart,
      'realtime': OptimizedRealTimeChart,
      'scatter': OptimizedScatterChart,
      'gauge': OptimizedGaugeChart
    };

    return typeMap[normalizedType] || OptimizedLineChart;
  }, [type]);

  const ChartComponent = chartType;

  if (enableVirtualization) {
    return (
      <ChartWrapper height={height} enableVirtualization={enableVirtualization}>
        <ChartComponent 
          data={data}
          options={options}
          height={height}
          {...props}
        />
      </ChartWrapper>
    );
  }

  return (
    <ChartComponent 
      data={data}
      options={options}
      height={height}
      inView={true}
      {...props}
    />
  );
});

DynamicChart.displayName = 'DynamicChart';

// Chart registry for dynamic loading
export const chartRegistry = {
  line: () => import('./LineChart/OptimizedLineChart'),
  area: () => import('./AreaChart/OptimizedAreaChart'),
  bar: () => import('./BarChart/OptimizedBarChart'),
  horizontalBar: () => import('./BarChart/OptimizedHorizontalBarChart'),
  pie: () => import('./PieChart/OptimizedPieChart'),
  doughnut: () => import('./DoughnutChart/OptimizedDoughnutChart'),
  production: () => import('./ProductionChart/OptimizedProductionChart'),
  quality: () => import('./QualityChart/OptimizedQualityChart'),
  inventory: () => import('./InventoryChart/OptimizedInventoryChart'),
  realTime: () => import('./RealTimeChart/OptimizedRealTimeChart'),
  scatter: () => import('./ScatterChart/OptimizedScatterChart'),
  gauge: () => import('./GaugeChart/OptimizedGaugeChart')
};

// Preload utility for chart types
export const preloadChartType = (type) => {
  const chartImport = chartRegistry[type];
  if (chartImport) {
    chartImport().catch(() => {
      // Silently handle preload failures
    });
  }
};

// Batch preload for multiple chart types
export const preloadChartTypes = (types) => {
  types.forEach(type => preloadChartType(type));
};

// Manufacturing-specific chart presets
export const manufacturingChartPresets = {
  productionMetrics: {
    type: 'production',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Production Metrics'
        }
      }
    }
  },
  qualityTrends: {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Quality Score (%)'
          }
        }
      }
    }
  },
  inventoryLevels: {
    type: 'bar',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Inventory Units'
          }
        }
      }
    }
  },
  efficiencyGauge: {
    type: 'gauge',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        }
      }
    }
  }
};

// Export optimized chart components
export default {
  OptimizedLineChart,
  OptimizedAreaChart,
  OptimizedBarChart,
  OptimizedHorizontalBarChart,
  OptimizedPieChart,
  OptimizedDoughnutChart,
  OptimizedProductionChart,
  OptimizedQualityChart,
  OptimizedInventoryChart,
  OptimizedRealTimeChart,
  OptimizedScatterChart,
  OptimizedGaugeChart,
  DynamicChart,
  ChartWrapper,
  chartRegistry,
  preloadChartType,
  preloadChartTypes,
  manufacturingChartPresets
};
