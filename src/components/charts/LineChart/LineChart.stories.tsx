// LineChart Storybook stories

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { LineChart } from './LineChart';
import type { DataSeries, YAxisConfig, Annotation } from './LineChart';

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced line chart with zoom, pan, annotations, and multiple Y-axes support. Built with Chart.js and React.'
      }
    }
  },
  argTypes: {
    enableZoom: {
      control: { type: 'boolean' },
      description: 'Enable zoom functionality'
    },
    enablePan: {
      control: { type: 'boolean' },
      description: 'Enable pan functionality'
    },
    enableAnnotations: {
      control: { type: 'boolean' },
      description: 'Enable annotations display'
    },
    showLegend: {
      control: { type: 'boolean' },
      description: 'Show chart legend'
    },
    showToolbar: {
      control: { type: 'boolean' },
      description: 'Show chart toolbar'
    },
    showGrid: {
      control: { type: 'boolean' },
      description: 'Show grid lines'
    },
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark'],
      description: 'Chart theme'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const generateTimeSeriesData = (points: number, baseValue: number, volatility: number = 0.1) => {
  const data = [];
  let value = baseValue;
  
  for (let i = 0; i < points; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (points - i));
    
    value += (0 /* REAL DATA REQUIRED */ 0.5) * baseValue * volatility;
    data.push({
      x: date.toISOString().split('T')[0],
      y: Math.round(value * 100) / 100
    });
  }
  
  return data;
};

const realDataRequiredSeries: DataSeries[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: generateTimeSeriesData(30, 100000, 0.05),
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f620',
    fill: false,
    tension: 0.4,
    yAxisID: 'y'
  },
  {
    id: 'profit',
    label: 'Profit',
    data: generateTimeSeriesData(30, 25000, 0.1),
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
    fill: false,
    tension: 0.4,
    yAxisID: 'y'
  }
];

const multiAxisDataSeries: DataSeries[] = [
  {
    id: 'sales',
    label: 'Sales Volume (units)',
    data: generateTimeSeriesData(30, 1000, 0.08),
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f620',
    fill: false,
    tension: 0.4,
    yAxisID: 'y'
  },
  {
    id: 'efficiency',
    label: 'Efficiency (%)',
    data: generateTimeSeriesData(30, 85, 0.02),
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b20',
    fill: false,
    tension: 0.4,
    yAxisID: 'y1'
  }
];

const yAxes: YAxisConfig[] = [
  {
    id: 'y',
    type: 'linear',
    position: 'left',
    title: 'Sales Volume',
    color: '#3b82f6',
    tickFormat: (value) => `${(value / 1000).toFixed(1)}K`
  },
  {
    id: 'y1',
    type: 'linear',
    position: 'right',
    title: 'Efficiency (%)',
    color: '#f59e0b',
    gridDisplay: false,
    tickFormat: (value) => `${value.toFixed(1)}%`
  }
];

const sampleAnnotations: Annotation[] = [
  {
    id: 'target-line',
    type: 'line',
    label: 'Target Revenue',
    color: '#ef4444',
    value: 105000,
    yScaleID: 'y',
    borderWidth: 2,
    borderColor: '#ef4444'
  },
  {
    id: 'promotion-period',
    type: 'box',
    label: 'Promotion Period',
    color: '#8b5cf6',
    xMin: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    xMax: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    yMin: 95000,
    yMax: 110000,
    backgroundColor: '#8b5cf620',
    borderColor: '#8b5cf6'
  }
];

export const Default: Story = {
  args: {
    data: realDataRequiredSeries,
    title: 'Revenue and Profit Trends',
    subtitle: 'Monthly performance metrics',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

export const MultipleYAxes: Story = {
  args: {
    data: multiAxisDataSeries,
    yAxes: yAxes,
    title: 'Sales Volume vs Efficiency',
    subtitle: 'Dual-axis comparison',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

export const WithAnnotations: Story = {
  args: {
    data: realDataRequiredSeries,
    annotations: sampleAnnotations,
    title: 'Revenue Analysis with Annotations',
    subtitle: 'Key events and targets highlighted',
    height: 400,
    enableZoom: true,
    enablePan: true,
    enableAnnotations: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed'),
    onAnnotationClick: action('annotation-clicked')
  }
};

export const DarkTheme: Story = {
  args: {
    data: realDataRequiredSeries,
    title: 'Revenue and Profit Trends',
    subtitle: 'Monthly performance metrics',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'dark',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};

export const MinimalChart: Story = {
  args: {
    data: realDataRequiredSeries.slice(0, 1), // Only one series
    height: 300,
    enableZoom: false,
    enablePan: false,
    showLegend: false,
    showToolbar: false,
    showGrid: false,
    theme: 'light'
  }
};

export const FilledAreaChart: Story = {
  args: {
    data: [
      {
        ...realDataRequiredSeries[0],
        fill: true,
        backgroundColor: '#3b82f640'
      },
      {
        ...realDataRequiredSeries[1],
        fill: '-1', // Fill to previous dataset
        backgroundColor: '#10b98140'
      }
    ],
    title: 'Stacked Area Chart',
    subtitle: 'Revenue and profit as filled areas',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

export const SteppedLine: Story = {
  args: {
    data: [
      {
        ...realDataRequiredSeries[0],
        tension: 0, // No curve
        stepped: true as any
      }
    ],
    title: 'Stepped Line Chart',
    subtitle: 'Step-wise data representation',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

export const DashedLines: Story = {
  args: {
    data: [
      realDataRequiredSeries[0],
      {
        ...realDataRequiredSeries[1],
        borderDash: [5, 5] // Dashed line
      }
    ],
    title: 'Mixed Line Styles',
    subtitle: 'Solid and dashed lines',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

export const LargeDataset: Story = {
  args: {
    data: [
      {
        id: 'large-dataset',
        label: 'Daily Values (1 Year)',
        data: generateTimeSeriesData(365, 50000, 0.05),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: false,
        tension: 0.4,
        pointRadius: 0 // Hide points for large datasets
      }
    ],
    title: 'Large Dataset Performance',
    subtitle: '365 data points with zoom and pan',
    height: 400,
    enableZoom: true,
    enablePan: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed')
  }
};

// Interactive playground
export const InteractivePlayground: Story = {
  args: {
    data: multiAxisDataSeries,
    yAxes: yAxes,
    annotations: sampleAnnotations,
    title: 'Interactive Chart Playground',
    subtitle: 'Try all the features: zoom, pan, annotations, and toolbar',
    height: 500,
    enableZoom: true,
    enablePan: true,
    enableAnnotations: true,
    showLegend: true,
    showToolbar: true,
    showGrid: true,
    theme: 'light',
    onDataPointClick: action('data-point-clicked'),
    onZoom: action('zoom-changed'),
    onAnnotationClick: action('annotation-clicked')
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-featured interactive chart with all capabilities enabled. Try zooming with mouse wheel, panning by dragging, toggling series visibility, and downloading the chart.'
      }
    }
  }
};