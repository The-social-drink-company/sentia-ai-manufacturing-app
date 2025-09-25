
/**
 * Optimized chart loader with viewport-aware hydration
 */

import React, { lazy, memo, Suspense, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

const ChartLoadingSpinner = ({ type = 'chart' }) => (
  <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
    <div className="space-y-2 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      <p className="text-xs">Loading {type}?</p>
    </div>
  </div>
)

const createLazyChart = (importer, chartName) => {
  const LazyChart = lazy(importer)

  const WrappedChart = memo(({ inView, ...props }) => {
    if (!inView) {
      return <ChartLoadingSpinner type={chartName} />
    }

    return (
      <Suspense fallback={<ChartLoadingSpinner type={chartName} />}>
        <LazyChart {...props} />
      </Suspense>
    )
  })

  WrappedChart.displayName = `Lazy${chartName.replace(/\\\s+/g, '')}`
  return WrappedChart
}

export const OptimizedLineChart = createLazyChart(
  () => import('./LineChart/OptimizedLineChart'),
  'Line Chart'
)
export const OptimizedAreaChart = createLazyChart(
  () => import('./AreaChart/OptimizedAreaChart'),
  'Area Chart'
)
export const OptimizedBarChart = createLazyChart(
  () => import('./BarChart/OptimizedBarChart'),
  'Bar Chart'
)
export const OptimizedHorizontalBarChart = createLazyChart(
  () => import('./BarChart/OptimizedHorizontalBarChart'),
  'Horizontal Bar Chart'
)
export const OptimizedPieChart = createLazyChart(
  () => import('./PieChart/OptimizedPieChart'),
  'Pie Chart'
)
export const OptimizedDoughnutChart = createLazyChart(
  () => import('./DoughnutChart/OptimizedDoughnutChart'),
  'Doughnut Chart'
)
export const OptimizedProductionChart = createLazyChart(
  () => import('./ProductionChart/OptimizedProductionChart'),
  'Production Chart'
)
export const OptimizedQualityChart = createLazyChart(
  () => import('./QualityChart/OptimizedQualityChart'),
  'Quality Chart'
)
export const OptimizedInventoryChart = createLazyChart(
  () => import('./InventoryChart/OptimizedInventoryChart'),
  'Inventory Chart'
)
export const OptimizedRealTimeChart = createLazyChart(
  () => import('./RealTimeChart/OptimizedRealTimeChart'),
  'Real-time Chart'
)
export const OptimizedScatterChart = createLazyChart(
  () => import('./ScatterChart/OptimizedScatterChart'),
  'Scatter Chart'
)
export const OptimizedGaugeChart = createLazyChart(
  () => import('./GaugeChart/OptimizedGaugeChart'),
  'Gauge Chart'
)

const ChartWrapper = memo(({ children, height = 300, rootMargin = '50px', enableVirtualization = true, ...props }) => {
  const { ref, inView } = useInView({ threshold: 0, rootMargin, triggerOnce: false })
  const computedHeight = useMemo(() => Math.max(height, 200), [height])

  if (!enableVirtualization) {
    return React.cloneElement(children, { inView: true })
  }

  return (
    <div ref={ref} style={{ minHeight: computedHeight }} className="w-full" {...props}>
      {React.cloneElement(children, { inView })}
    </div>
  )
})

ChartWrapper.displayName = 'ChartWrapper'

export const DynamicChart = memo(({ type, data, options = {}, height = 300, enableVirtualization = true, ...props }) => {
  const chartComponent = useMemo(() => {
    const normalized = type?.toLowerCase().replace(/[^a-z]/g, '')
    const registry = {
      line: OptimizedLineChart,
      area: OptimizedAreaChart,
      bar: OptimizedBarChart,
      horizontalbar: OptimizedHorizontalBarChart,
      pie: OptimizedPieChart,
      doughnut: OptimizedDoughnutChart,
      production: OptimizedProductionChart,
      quality: OptimizedQualityChart,
      inventory: OptimizedInventoryChart,
      realtime: OptimizedRealTimeChart,
      scatter: OptimizedScatterChart,
      gauge: OptimizedGaugeChart
    }

    return registry[normalized] || OptimizedLineChart
  }, [type])

  const ChartComponent = chartComponent

  if (!enableVirtualization) {
    return <ChartComponent data={data} options={options} height={height} inView {...props} />
  }

  return (
    <ChartWrapper height={height} enableVirtualization={enableVirtualization}>
      <ChartComponent data={data} options={options} height={height} {...props} />
    </ChartWrapper>
  )
})

DynamicChart.displayName = 'DynamicChart'

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
}

export const preloadChartType = (type) => {
  const importer = chartRegistry[type]
  if (importer) {
    importer().catch(() => undefined)
  }
}

export const preloadChartTypes = (types) => {
  types?.forEach((type) => preloadChartType(type))
}

export const manufacturingChartPresets = {
  productionMetrics: {
    type: 'production',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Production Metrics' }
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
          title: { display: true, text: 'Quality Score (%)' }
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
          title: { display: true, text: 'Inventory Units' }
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
        legend: { display: false }
      }
    }
  }
}

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
}

