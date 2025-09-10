import React from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import DoughnutChart from './DoughnutChart';
import { useChartTheme } from '../ChartProvider';

// Manufacturing-specific chart components with predefined configurations

export const ProductionStatusChart = ({ data, height = 300, ...props }) => {
  const { getProductionChartConfig } = useChartTheme();
  const config = getProductionChartConfig();
  
  return (
    <DoughnutChart
      data={data}
      title="Production Status Overview"
      colorPalette="production"
      height={height}
      options={config.options}
      showValues={true}
      centerText="Production"
      {...props}
    />
  );
};

export const QualityMetricsChart = ({ data, height = 300, ...props }) => {
  const { getQualityChartConfig } = useChartTheme();
  const config = getQualityChartConfig();
  
  return (
    <BarChart
      data={data}
      title="Quality Control Metrics"
      colorPalette="quality"
      height={height}
      options={config.options}
      {...props}
    />
  );
};

export const FinancialTrendChart = ({ data, height = 300, ...props }) => {
  const { getFinancialChartConfig } = useChartTheme();
  const config = getFinancialChartConfig();
  
  return (
    <LineChart
      data={data}
      title="Financial Performance Trends"
      colorPalette="financial"
      height={height}
      options={config.options}
      fill={true}
      tension={0.3}
      {...props}
    />
  );
};

export const InventoryLevelsChart = ({ data, height = 300, ...props }) => {
  return (
    <BarChart
      data={data}
      title="Inventory Levels by Category"
      colorPalette="inventory"
      height={height}
      stacked={true}
      {...props}
    />
  );
};

export const EfficiencyGaugeChart = ({ data, height = 300, ...props }) => {
  return (
    <DoughnutChart
      data={data}
      title="Overall Equipment Effectiveness"
      colorPalette="efficiency"
      height={height}
      cutout="80%"
      showValues={false}
      centerText={`${data.overallEfficiency || 0}%`}
      {...props}
    />
  );
};

export const ProductionTrendChart = ({ data, height = 300, ...props }) => {
  return (
    <LineChart
      data={data}
      title="Production Output Trends"
      colorPalette="production"
      height={height}
      fill={false}
      tension={0.1}
      showGrid={true}
      options={{
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Units Produced'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time Period'
            }
          }
        }
      }}
      {...props}
    />
  );
};

export const WorkingCapitalChart = ({ data, height = 300, ...props }) => {
  return (
    <BarChart
      data={data}
      title="Working Capital Analysis"
      colorPalette="financial"
      height={height}
      horizontal={false}
      options={{
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(value);
              }
            }
          }
        }
      }}
      {...props}
    />
  );
};

export const DefectRateChart = ({ data, height = 300, ...props }) => {
  return (
    <LineChart
      data={data}
      title="Defect Rate Tracking"
      colorPalette="quality"
      height={height}
      fill={true}
      tension={0.2}
      options={{
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            title: {
              display: true,
              text: 'Defect Rate (%)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
              }
            }
          }
        }
      }}
      {...props}
    />
  );
};

export const MaintenanceScheduleChart = ({ data, height = 300, ...props }) => {
  return (
    <BarChart
      data={data}
      title="Maintenance Schedule Overview"
      colorPalette="production"
      height={height}
      horizontal={true}
      options={{
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          }
        }
      }}
      {...props}
    />
  );
};

export const CostBreakdownChart = ({ data, height = 300, ...props }) => {
  return (
    <DoughnutChart
      data={data}
      title="Cost Breakdown Analysis"
      colorPalette="financial"
      height={height}
      cutout="50%"
      showValues={true}
      options={{
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                const value = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(context.parsed);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }}
      {...props}
    />
  );
};

// Export all manufacturing charts as a collection
export const ManufacturingCharts = {
  ProductionStatusChart,
  QualityMetricsChart,
  FinancialTrendChart,
  InventoryLevelsChart,
  EfficiencyGaugeChart,
  ProductionTrendChart,
  WorkingCapitalChart,
  DefectRateChart,
  MaintenanceScheduleChart,
  CostBreakdownChart
};

export default ManufacturingCharts;