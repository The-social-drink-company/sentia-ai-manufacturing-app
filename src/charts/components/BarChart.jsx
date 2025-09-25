import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useChartTheme } from '../ChartProvider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const BarChart = ({
  data,
  options = {},
  title,
  height = 300,
  colorPalette = 'production',
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  horizontal = false,
  stacked = false,
  borderRadius = 4,
  ...props
}) => {
  const { getChartOptions, getColorPalette, theme } = useChartTheme();
  
  // Prepare chart data with theme colors
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colors = getColorPalette(colorPalette, data.datasets.length);
      const color = colors[index % colors.length];
      
      return {
        ...dataset,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 0,
        borderRadius: borderRadius,
        borderSkipped: false,
        hoverBackgroundColor: `${color}CC`, // CC = 80% opacity
        hoverBorderColor: color,
        hoverBorderWidth: 1
      };
    })
  };
  
  // Configure scales based on orientation
  const scaleConfig = horizontal ? {
    x: {
      ...options.scales?.x,
      grid: {
        display: showGrid,
        ...options.scales?.x?.grid
      }
    },
    y: {
      ...options.scales?.y,
      grid: {
        display: showGrid,
        ...options.scales?.y?.grid
      }
    }
  } : {
    x: {
      ...options.scales?.x,
      grid: {
        display: showGrid,
        ...options.scales?.x?.grid
      }
    },
    y: {
      ...options.scales?.y,
      grid: {
        display: showGrid,
        ...options.scales?.y?.grid
      }
    }
  };
  
  // Merge options with theme defaults
  const chartOptions = getChartOptions({
    indexAxis: horizontal ? 'y' : 'x',
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        display: showLegend,
        ...options.plugins?.legend
      },
      tooltip: {
        enabled: showTooltip,
        ...options.plugins?.tooltip
      },
      title: title ? {
        display: true,
        text: title,
        color: theme.colors.textPrimary,
        font: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: '600'
        },
        padding: 20,
        ...options.plugins?.title
      } : undefined
    },
    scales: {
      ...scaleConfig,
      ...(stacked ? {
        x: {
          ...scaleConfig.x,
          stacked: true
        },
        y: {
          ...scaleConfig.y,
          stacked: true
        }
      } : {})
    }
  });
  
  return (
    <div style={{ height: height }} {...props}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default BarChart;