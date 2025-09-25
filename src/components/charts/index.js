// Export all chart components
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as DoughnutChart } from './DoughnutChart';
export { default as ChartErrorBoundary } from './ChartErrorBoundary';
export { default as QualityTrendsChart } from './QualityTrendsChart';
export { default as RealTimeChart } from './RealTimeChart';
export { default as RealTimeProductionChart } from './RealTimeProductionChart';
export { default as WorkingCapitalChart } from './WorkingCapitalChart';

// Advanced chart components
export { default as AdvancedGaugeChart } from './AdvancedGaugeChart';
export { default as MultiAxisChart } from './MultiAxisChart';
export { default as AdvancedHeatMap } from './AdvancedHeatMap';
export { default as RealTimeStreamChart } from './RealTimeStreamChart';
export { default as AdvancedScatterChart } from './AdvancedScatterChart';

export { 
  defaultChartOptions, 
  timeChartOptions,
  colorPalettes,
  productionColors,
  qualityColors,
  inventoryColors
} from './ChartConfig';